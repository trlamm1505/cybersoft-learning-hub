import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  assertGradeEditable,
  assertTransition,
  canTransition,
  isTerminal,
  requireReasonText,
  SubmissionState as S,
  SUBMISSION_STATES,
  TRANSITIONS,
} from './submission-state';
import {
  AssessmentType as T,
  assertCanAttempt,
  classifySubmissionTime,
  effectiveScore,
  pickCountedAttempt,
  redactForStudent,
  validateAssessmentInput,
} from './assessment-policy';
import { FORCE_SUBMIT_AT, registerLeave } from './contest-integrity';
import { calculateFinalGrade, letterOf } from './final-grade';
import { deriveKidProgress, kidLevelOf, type CompletedLevel } from './kid-progress';
import { TESTER_RUBRIC, TESTER_RUBRIC_TOTAL, validateTesterGrade } from './tester-rubric';

const NOW = new Date('2026-10-16T08:00:00Z');
const MIN = 60_000;
const HOUR = 60 * MIN;
const at = (ms: number) => new Date(NOW.getTime() + ms);

// ------------------------------------------------------------------------------------------------ state machine
describe('State machine bài nộp', () => {
  it('luồng chính DRAFT -> SUBMITTED -> GRADING -> GRADED -> PUBLISHED -> APPEALING -> FINALIZED', () => {
    const path: Array<[S, S, 'OWNER' | 'CLASS_TEACHER']> = [
      [S.DRAFT, S.SUBMITTED, 'OWNER'],
      [S.SUBMITTED, S.GRADING, 'CLASS_TEACHER'],
      [S.GRADING, S.GRADED, 'CLASS_TEACHER'],
      [S.GRADED, S.PUBLISHED, 'CLASS_TEACHER'],
      [S.PUBLISHED, S.APPEALING, 'OWNER'],
      [S.APPEALING, S.FINALIZED, 'CLASS_TEACHER'],
    ];
    for (const [from, to, actor] of path) expect(() => assertTransition(from, to, actor)).not.toThrow();
  });

  it('nhánh LATE: chỉ chủ bài nộp trễ, rồi giảng viên chấm như bài thường', () => {
    expect(canTransition(S.DRAFT, S.LATE, 'OWNER')).toBe(true);
    expect(canTransition(S.LATE, S.GRADING, 'CLASS_TEACHER')).toBe(true);
    expect(canTransition(S.LATE, S.GRADED, 'CLASS_TEACHER')).toBe(false);
  });

  it('chỉ học viên sở hữu được DRAFT -> SUBMITTED (giảng viên bị 403)', () => {
    expect(() => assertTransition(S.DRAFT, S.SUBMITTED, 'CLASS_TEACHER')).toThrow(ForbiddenException);
  });

  it('chỉ giảng viên phụ trách được sang GRADING, GRADED, PUBLISHED', () => {
    expect(() => assertTransition(S.SUBMITTED, S.GRADING, 'OWNER')).toThrow(ForbiddenException);
    expect(() => assertTransition(S.GRADING, S.GRADED, 'OWNER')).toThrow(ForbiddenException);
    expect(() => assertTransition(S.GRADED, S.PUBLISHED, 'OWNER')).toThrow(ForbiddenException);
    expect(() => assertTransition(S.GRADED, S.PUBLISHED, 'SYSTEM')).toThrow(ForbiddenException);
  });

  it('không cho nhảy cóc (SUBMITTED -> PUBLISHED) -> 400', () => {
    expect(() => assertTransition(S.SUBMITTED, S.PUBLISHED, 'CLASS_TEACHER')).toThrow(BadRequestException);
    expect(() => assertTransition(S.DRAFT, S.GRADED, 'CLASS_TEACHER')).toThrow(BadRequestException);
  });

  it('FINALIZED khóa cứng: mọi bước chuyển, kể cả hủy, đều bị từ chối với mã E403_SUBMISSION_FINALIZED', () => {
    for (const to of SUBMISSION_STATES) {
      for (const actor of ['OWNER', 'CLASS_TEACHER', 'SYSTEM'] as const) {
        try {
          assertTransition(S.FINALIZED, to, actor);
          throw new Error('không được tới đây');
        } catch (e) {
          expect((e as ForbiddenException).getResponse()).toMatchObject({ code: 'E403_SUBMISSION_FINALIZED' });
        }
      }
    }
    expect(() => assertGradeEditable(S.FINALIZED)).toThrow(ForbiddenException);
  });

  it('INVALIDATED đi được từ mọi trạng thái chưa chốt, và là trạng thái kết thúc', () => {
    for (const s of SUBMISSION_STATES.filter((x) => x !== S.FINALIZED && x !== S.INVALIDATED)) {
      expect(canTransition(s, S.INVALIDATED, 'CLASS_TEACHER')).toBe(true);
      expect(canTransition(s, S.INVALIDATED, 'OWNER')).toBe(false);
    }
    expect(isTerminal(S.INVALIDATED)).toBe(true);
    expect(isTerminal(S.FINALIZED)).toBe(true);
  });

  it('phúc khảo: giảng viên chấp nhận -> GRADING (chấm lại) hoặc chốt -> FINALIZED', () => {
    expect(canTransition(S.APPEALING, S.GRADING, 'CLASS_TEACHER')).toBe(true);
    expect(canTransition(S.APPEALING, S.FINALIZED, 'CLASS_TEACHER')).toBe(true);
    expect(canTransition(S.APPEALING, S.PUBLISHED, 'CLASS_TEACHER')).toBe(false);
  });

  it('chỉ sửa điểm khi đang GRADING', () => {
    expect(() => assertGradeEditable(S.GRADING)).not.toThrow();
    for (const s of [S.SUBMITTED, S.GRADED, S.PUBLISHED, S.APPEALING]) expect(() => assertGradeEditable(s)).toThrow(BadRequestException);
  });

  it('bảng chuyển trạng thái phủ đủ mọi trạng thái', () => {
    expect(Object.keys(TRANSITIONS).sort()).toEqual([...SUBMISSION_STATES].sort());
  });

  it('lý do bắt buộc tối thiểu 10 ký tự', () => {
    expect(() => requireReasonText(undefined)).toThrow(BadRequestException);
    expect(() => requireReasonText('   ngắn    ')).toThrow(BadRequestException);
    expect(requireReasonText('  Phát hiện sao chép bài  ')).toBe('Phát hiện sao chép bài');
  });
});

// ------------------------------------------------------------------------------------------------ assessment policy
describe('Ba loại hình đánh giá', () => {
  it('Assignment: dueDate bắt buộc và phải > now + 1h', () => {
    expect(() => validateAssessmentInput({ assessmentType: 'ASSIGNMENT', title: 'Tuần 1' }, NOW)).toThrow(BadRequestException);
    expect(() => validateAssessmentInput({ assessmentType: 'ASSIGNMENT', title: 'Tuần 1', dueDate: at(HOUR).toISOString() }, NOW)).toThrow(BadRequestException);
    expect(validateAssessmentInput({ assessmentType: 'ASSIGNMENT', title: 'Tuần 1', dueDate: at(HOUR + MIN).toISOString() }, NOW).assessmentType).toBe(T.ASSIGNMENT);
  });

  it('Contest: bắt buộc startTime ở tương lai và durationMinutes nguyên trong [5, 600]', () => {
    const base = { assessmentType: 'CONTEST', title: 'Đấu trường 1' };
    expect(() => validateAssessmentInput({ ...base, durationMinutes: 60 }, NOW)).toThrow(BadRequestException);
    expect(() => validateAssessmentInput({ ...base, startTime: at(-MIN).toISOString(), durationMinutes: 60 }, NOW)).toThrow(BadRequestException);
    expect(() => validateAssessmentInput({ ...base, startTime: at(HOUR).toISOString(), durationMinutes: 2 }, NOW)).toThrow(BadRequestException);
    expect(() => validateAssessmentInput({ ...base, startTime: at(HOUR).toISOString(), durationMinutes: 30.5 }, NOW)).toThrow(BadRequestException);
    expect(validateAssessmentInput({ ...base, startTime: at(HOUR).toISOString(), durationMinutes: 90 }, NOW).durationMinutes).toBe(90);
  });

  it('loại không hợp lệ hoặc tiêu đề rỗng bị từ chối', () => {
    expect(() => validateAssessmentInput({ assessmentType: 'QUIZ', title: 'abc' }, NOW)).toThrow(BadRequestException);
    expect(() => validateAssessmentInput({ assessmentType: 'EXAM', title: ' ', dueDate: at(HOUR * 5) }, NOW)).toThrow(BadRequestException);
  });

  describe('thời điểm nộp bài tập tuần', () => {
    const a = { assessmentType: T.ASSIGNMENT, dueDate: NOW };
    it('trong 5 phút ân hạn vẫn đúng hạn', () => {
      expect(classifySubmissionTime(a, NOW)).toBe('ON_TIME');
      expect(classifySubmissionTime(a, at(5 * MIN))).toBe('ON_TIME');
    });
    it('sau ân hạn, trong 24h -> LATE', () => {
      expect(classifySubmissionTime(a, at(5 * MIN + 1))).toBe('LATE');
      expect(classifySubmissionTime(a, at(24 * HOUR))).toBe('LATE');
    });
    it('quá 24h -> từ chối', () => {
      expect(() => classifySubmissionTime(a, at(24 * HOUR + 1))).toThrow(ForbiddenException);
    });
  });

  it('Exam: không ân hạn, không nộp trễ', () => {
    const e = { assessmentType: T.EXAM, dueDate: NOW };
    expect(classifySubmissionTime(e, NOW)).toBe('ON_TIME');
    expect(() => classifySubmissionTime(e, at(1000))).toThrow(ForbiddenException);
  });

  it('Contest: chỉ nhận trong [startTime, startTime + duration]', () => {
    const c = { assessmentType: T.CONTEST, startTime: NOW, durationMinutes: 60 };
    expect(() => classifySubmissionTime(c, at(-1))).toThrow(ForbiddenException);
    expect(classifySubmissionTime(c, at(30 * MIN))).toBe('ON_TIME');
    expect(classifySubmissionTime(c, at(60 * MIN))).toBe('ON_TIME');
    expect(() => classifySubmissionTime(c, at(60 * MIN + 1))).toThrow(ForbiddenException);
  });

  it('LATE tự áp trần 90% điểm tối đa; đúng hạn giữ nguyên', () => {
    expect(effectiveScore(100, 100, true, T.ASSIGNMENT)).toBe(90);
    expect(effectiveScore(80, 100, true, T.ASSIGNMENT)).toBe(80);
    expect(effectiveScore(100, 100, false, T.ASSIGNMENT)).toBe(100);
    expect(effectiveScore(130, 100, false, T.ASSIGNMENT)).toBe(100);
    expect(effectiveScore(-5, 100, false, T.ASSIGNMENT)).toBe(0);
  });

  it('số lượt: Assignment 3, Contest 1, Exam 1', () => {
    expect(() => assertCanAttempt(T.ASSIGNMENT, 2)).not.toThrow();
    expect(() => assertCanAttempt(T.ASSIGNMENT, 3)).toThrow(ForbiddenException);
    expect(() => assertCanAttempt(T.EXAM, 1)).toThrow(ForbiddenException);
    expect(() => assertCanAttempt(T.CONTEST, 1)).toThrow(ForbiddenException);
  });

  it('ghi nhận lượt có điểm cao nhất (hòa thì lượt sớm hơn), bỏ qua lượt chưa có điểm', () => {
    const best = pickCountedAttempt([
      { attemptNo: 1, score: 60 },
      { attemptNo: 2, score: 85 },
      { attemptNo: 3, score: 85 },
      { attemptNo: 4, score: null },
    ]);
    expect(best?.attemptNo).toBe(2);
    expect(pickCountedAttempt([{ attemptNo: 1, score: null }])).toBeNull();
  });

  it('Exam không trả chi tiết test case/đáp án cho học viên; điểm chỉ hiện khi đã công bố', () => {
    const sub = { score: 70, rawScore: 70, details: { tests: [1] }, testResults: [1], answerKey: 'x', gradedBy: 't', state: 'PUBLISHED' };
    const exam = redactForStudent(T.EXAM, sub, true);
    expect(exam).not.toHaveProperty('details');
    expect(exam).not.toHaveProperty('testResults');
    expect(exam).not.toHaveProperty('answerKey');
    expect(exam).not.toHaveProperty('gradedBy');
    expect(exam.score).toBe(70);
    expect(redactForStudent(T.ASSIGNMENT, sub, true)).toHaveProperty('details');
    expect(redactForStudent(T.ASSIGNMENT, sub, false)).not.toHaveProperty('score');
  });
});

// ------------------------------------------------------------------------------------------------ contest integrity
describe('Giám sát liêm chính cuộc thi', () => {
  it('lần rời dưới 5 giây không tính', () => {
    expect(registerLeave(0, 4999)).toEqual({ counted: false, leaveCount: 0, forceSubmit: false });
  });
  it('lần rời thứ 3 (mỗi lần >= 5 giây) -> forceSubmit', () => {
    let n = 0;
    const r1 = registerLeave(n, 5000);
    n = r1.leaveCount;
    const r2 = registerLeave(n, 12_000);
    n = r2.leaveCount;
    const r3 = registerLeave(n, 6000);
    expect([r1.forceSubmit, r2.forceSubmit, r3.forceSubmit]).toEqual([false, false, true]);
    expect(r3.leaveCount).toBe(FORCE_SUBMIT_AT);
  });
  it('lần rời ngắn xen giữa không đẩy bộ đếm', () => {
    expect(registerLeave(2, 1000).forceSubmit).toBe(false);
  });
  it('đã tự nộp thì không kích hoạt lại', () => {
    expect(registerLeave(3, 9000, true).forceSubmit).toBe(false);
  });
});

// ------------------------------------------------------------------------------------------------ final grade
describe('Điểm tổng kết', () => {
  const item = (id: string, score: number | null, submitted = score !== null) => ({ assessmentId: id, score, submitted });

  it('công thức 0.3 * AssignmentAvg + 0.4 * ContestAvg + 0.3 * ExamScore, có bỏ 1 bài tập thấp nhất', () => {
    const r = calculateFinalGrade({
      assignments: [item('a1', 80), item('a2', 90), item('a3', 40), item('a4', 100)],
      contests: [item('c1', 70), item('c2', 90)],
      exams: [item('e1', 60)],
    });
    expect(r.droppedAssignmentId).toBe('a3');
    expect(r.assignmentAvg).toBe(90);
    expect(r.contestAvg).toBe(80);
    expect(r.examScore).toBe(60);
    expect(r.finalScore).toBe(0.3 * 90 + 0.4 * 80 + 0.3 * 60);
    expect(r.letter).toBe('B');
    expect(r.locked).toBe(false);
  });

  it('chỉ có 1 bài tập thì không bỏ bài nào', () => {
    const r = calculateFinalGrade({ assignments: [item('a1', 50)], contests: [item('c1', 50)], exams: [item('e1', 50)] });
    expect(r.droppedAssignmentId).toBeNull();
    expect(r.assignmentAvg).toBe(50);
  });

  it('bỏ nộp đúng 30% chưa khóa; vượt 30% -> khóa kết quả, xếp loại F', () => {
    const ten = (missing: number) => Array.from({ length: 10 }, (_, i) => item(`a${i}`, i < missing ? null : 100, i >= missing));
    const ok = calculateFinalGrade({ assignments: ten(3), contests: [item('c', 100)], exams: [item('e', 100)] });
    expect(ok.locked).toBe(false);
    const fail = calculateFinalGrade({ assignments: ten(4), contests: [item('c', 100)], exams: [item('e', 100)] });
    expect(fail.locked).toBe(true);
    expect(fail.letter).toBe('F');
    expect(fail.lockReason).toContain('4/10');
    expect(fail.missedAssignments).toBe(4);
  });

  it('bài bỏ nộp tính 0 và thường là bài bị bỏ khi Drop Lowest', () => {
    const r = calculateFinalGrade({ assignments: [item('a1', null, false), item('a2', 80), item('a3', 100), item('a4', 90)], contests: [], exams: [] });
    expect(r.droppedAssignmentId).toBe('a1');
    expect(r.assignmentAvg).toBe(90);
  });

  it('lớp chưa tổ chức cuộc thi: trọng số chia lại cho các loại còn lại', () => {
    const r = calculateFinalGrade({ assignments: [item('a1', 80), item('a2', 80)], contests: [], exams: [item('e', 80)] });
    expect(r.weights).toEqual({ assignment: 0.5, contest: 0, exam: 0.5 });
    expect(r.finalScore).toBe(80);
  });

  it('bài đã nộp nhưng chưa công bố điểm -> kết quả tạm thời', () => {
    const r = calculateFinalGrade({ assignments: [{ assessmentId: 'a', score: null, submitted: true, pending: true }], contests: [], exams: [] });
    expect(r.provisional).toBe(true);
    expect(r.pending).toBe(1);
  });

  it('thang chữ', () => {
    expect([letterOf(85), letterOf(84.99), letterOf(70), letterOf(55), letterOf(40), letterOf(39.9)]).toEqual(['A', 'B', 'B', 'C', 'D', 'F']);
  });
});

// ------------------------------------------------------------------------------------------------ kid progress
describe('Tiến độ khối 3-5 suy ra từ block_puzzle_progress (cùng nguồn với /profile)', () => {
  const day = 24 * HOUR;
  const games = new Map<string, Set<string>>([
    ['blockly-maze', new Set(Array.from({ length: 10 }, (_, i) => `blockly-maze-level-${i + 1}`))],
    ['blockly-turtle', new Set(Array.from({ length: 10 }, (_, i) => `blockly-turtle-level-${i + 1}`))],
    ['blockly-puzzle', new Set(['blockly-puzzle'])],
  ]);
  const done = (n: number, ago = 0): CompletedLevel[] =>
    Array.from({ length: n }, (_, i) => ({ gameId: i < 10 ? 'blockly-maze' : 'blockly-turtle', slug: i < 10 ? `blockly-maze-level-${i + 1}` : `blockly-turtle-level-${i - 9}`, completedAt: at(-ago - (n - i) * MIN) }));

  it('mỗi màn hợp lệ = 1 sao; tổng màn là mẫu số của hồ sơ bé', () => {
    const r = deriveKidProgress(done(14), games, NOW);
    expect(r).toMatchObject({ starsEarned: 14, levelsDone: 14, levelsTotal: 21 });
  });

  it('cứ 3 sao lên 1 ải: 9 sao -> Ải 4, 12 -> Ải 5, 14 -> Ải 5, 15 -> Ải 6', () => {
    expect([0, 2, 3, 9, 12, 14, 15].map((n) => kidLevelOf(n))).toEqual([1, 1, 2, 4, 5, 5, 6]);
  });

  it('bỏ qua slug lạ, game không tồn tại và bản ghi trùng (giống summarizeKidProgress)', () => {
    const r = deriveKidProgress(
      [
        ...done(3),
        { gameId: 'blockly-maze', slug: 'blockly-maze-level-1', completedAt: NOW },
        { gameId: 'blockly-maze', slug: 'gian-lan', completedAt: NOW },
        { gameId: 'khong-co-game', slug: 'blockly-maze-level-2', completedAt: NOW },
      ],
      games,
      NOW,
    );
    expect(r.starsEarned).toBe(3);
  });

  it('STUCK_ALERT: đã có tiến độ, chưa phá đảo, ngừng chơi quá 3 ngày', () => {
    expect(deriveKidProgress(done(9, 5 * day), games, NOW).stuckAlert).toMatchObject({ active: true, level: 4 });
    expect(deriveKidProgress(done(9, 2 * day), games, NOW).stuckAlert.active).toBe(false);
    expect(deriveKidProgress(done(9, 3 * day + MIN), games, NOW).stuckAlert.active).toBe(true);
  });

  it('không kẹt khi chưa chơi, hoặc đã phá đảo mọi màn', () => {
    expect(deriveKidProgress([], games, NOW).stuckAlert.active).toBe(false);
    const all = [...games].flatMap(([gameId, slugs]) => [...slugs].map((slug) => ({ gameId, slug, completedAt: at(-10 * day) })));
    const r = deriveKidProgress(all, games, NOW);
    expect(r).toMatchObject({ levelsDone: 21, levelsTotal: 21 });
    expect(r.stuckAlert.active).toBe(false);
  });

  it('lastActiveAt là lần hoàn thành màn gần nhất', () => {
    const r = deriveKidProgress(done(4, 2 * day), games, NOW);
    expect(r.lastActiveAt?.getTime()).toBe(at(-2 * day - MIN).getTime());
  });
});

// ------------------------------------------------------------------------------------------------ tester rubric
describe('Rubric chuẩn Tester QA', () => {
  const full = TESTER_RUBRIC.map((c) => ({ key: c.key, score: c.maxScore }));
  const notes = 'Bao phủ tốt ca biên, bug report rõ ràng.';

  it('3 tiêu chí 40/30/30, tổng thang 100', () => {
    expect(TESTER_RUBRIC.map((c) => c.maxScore)).toEqual([40, 30, 30]);
    expect(TESTER_RUBRIC_TOTAL).toBe(100);
    expect(validateTesterGrade({ grades: full, reviewerNotes: notes }).total).toBe(100);
  });

  it('bắt buộc chấm đủ cả 3 tiêu chí', () => {
    expect(() => validateTesterGrade({ grades: full.slice(0, 2), reviewerNotes: notes })).toThrow(BadRequestException);
    expect(() => validateTesterGrade({ grades: [...full, full[0]], reviewerNotes: notes })).toThrow(BadRequestException);
    expect(() => validateTesterGrade({ grades: [...full, { key: 'cleanup', score: 1 }], reviewerNotes: notes })).toThrow(BadRequestException);
  });

  it('điểm mỗi tiêu chí trong [0, tối đa]', () => {
    expect(() => validateTesterGrade({ grades: [{ key: 'test-coverage', score: 41 }, ...full.slice(1)], reviewerNotes: notes })).toThrow(BadRequestException);
    expect(() => validateTesterGrade({ grades: [{ key: 'test-coverage', score: '40' }, ...full.slice(1)], reviewerNotes: notes })).toThrow(BadRequestException);
  });

  it('nhận xét tối thiểu 20 ký tự', () => {
    expect(() => validateTesterGrade({ grades: full, reviewerNotes: 'Tốt' })).toThrow(BadRequestException);
    expect(() => validateTesterGrade({ grades: full })).toThrow(BadRequestException);
  });

  it('tổng điểm = tổng 3 tiêu chí', () => {
    const r = validateTesterGrade({
      grades: [
        { key: 'severity-classification', score: 20 },
        { key: 'test-coverage', score: 32 },
        { key: 'bug-report-clarity', score: 25 },
      ],
      reviewerNotes: notes,
    });
    expect(r.total).toBe(77);
    expect(r.grades.map((g) => g.key)).toEqual(['test-coverage', 'bug-report-clarity', 'severity-classification']);
  });
});
