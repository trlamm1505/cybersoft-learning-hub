import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { fakeModel } from '../teacher-analytics/fake-model';
import { AssessmentService } from './assessment.service';
import { KidProgressService } from './kid-progress.service';
import { SubmissionState as S } from './domain/submission-state';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const CLASS = OID(1);
const OTHER_CLASS = OID(2);
const KID_CLASS = OID(3);
const T1: JwtPayload = { sub: OID(90), email: 't1@x', role: 'TEACHER' };
const T2: JwtPayload = { sub: OID(91), email: 't2@x', role: 'TEACHER' };
const ADMIN: JwtPayload = { sub: OID(99), email: 'a@x', role: 'ADMIN' };
const ST1: JwtPayload = { sub: OID(11), email: 's1@x', role: 'STUDENT' };
const ST2: JwtPayload = { sub: OID(12), email: 's2@x', role: 'STUDENT' };
const OUTSIDER: JwtPayload = { sub: OID(13), email: 'o@x', role: 'STUDENT' };
const KID: JwtPayload = { sub: OID(14), email: 'k@x', role: 'STUDENT' };

const MIN = 60_000;
const HOUR = 60 * MIN;
const NOW = new Date();
const at = (ms: number) => new Date(NOW.getTime() + ms);

function build() {
  const classes = fakeModel([
    { _id: CLASS, name: 'K10-12', ageGroup: '10-12', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: [ST1.sub, ST2.sub] },
    { _id: OTHER_CLASS, name: 'Lớp khác', ageGroup: '6-9', teacherId: T2.sub, teacherIds: [T2.sub], studentIds: [OUTSIDER.sub] },
    { _id: KID_CLASS, name: 'K3-5', ageGroup: '3-5', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: [KID.sub] },
  ]);
  const users = fakeModel([
    { _id: KID.sub, fullName: 'Bé An', role: 'STUDENT', ageGroup: '3-5' },
  ]);
  const assessments = fakeModel([]);
  const submissions = fakeModel([]);
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const service = new AssessmentService(assessments as any, submissions as any, classes as any, users as any, audit as any);
  return { service, submissions, assessments, audit };
}

const assignment = (over: Record<string, unknown> = {}) => ({ assessmentType: 'ASSIGNMENT', title: 'Bài tập tuần 1', dueDate: at(2 * HOUR).toISOString(), ...over });

async function submitted(service: AssessmentService, assessmentId: string, user = ST1, now = NOW) {
  const draft: any = await service.saveDraft(user, assessmentId, { code: 'print(1)' }, now);
  await service.submit(user, String(draft._id), now);
  return String(draft._id);
}

async function toPublished(service: AssessmentService, sid: string, rawScore = 80) {
  await service.startGrading(T1, sid);
  await service.grade(T1, sid, { rawScore, feedback: 'Làm tốt' });
  return service.publish(T1, sid);
}

describe('AssessmentService: phân quyền tạo bài đánh giá', () => {
  it('chỉ giảng viên phụ trách lớp tạo được; giảng viên lớp khác và Admin bị 403', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    expect(a).toMatchObject({ assessmentType: 'ASSIGNMENT', maxAttempts: 3, gracePeriodMs: 5 * MIN });
    await expect(service.createAssessment(T2, CLASS, assignment(), NOW)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.createAssessment(ADMIN, CLASS, assignment(), NOW)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('dueDate của bài tập tuần phải sau hiện tại hơn 1 giờ', async () => {
    const { service } = build();
    await expect(service.createAssessment(T1, CLASS, assignment({ dueDate: at(30 * MIN).toISOString() }), NOW)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AssessmentService: vòng đời bài nộp', () => {
  it('học viên ngoài lớp không làm bài được', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    await expect(service.saveDraft(OUTSIDER, String(a._id), {}, NOW)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('chỉ học viên sở hữu nộp được bản nháp của mình', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const draft: any = await service.saveDraft(ST1, String(a._id), { code: 'x' }, NOW);
    await expect(service.submit(ST2, String(draft._id), NOW)).rejects.toMatchObject({ response: { code: 'E403_NOT_OWNER' } });
    await expect(service.submit(T1 as JwtPayload, String(draft._id), NOW)).rejects.toBeInstanceOf(ForbiddenException);
    const res: any = await service.submit(ST1, String(draft._id), NOW);
    expect(res.state).toBe(S.SUBMITTED);
  });

  it('giảng viên không phụ trách lớp không chấm được (403); học viên không tự chấm được', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const sid = await submitted(service, String(a._id));
    await expect(service.startGrading(T2, sid)).rejects.toMatchObject({ response: { code: 'E403_CLASS_NOT_OWNED' } });
    await expect(service.startGrading(ST1, sid)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('nộp sau ân hạn 5 phút -> LATE, điểm tự chặn trần 90%', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const lateAt = at(2 * HOUR + 10 * MIN);
    const draft: any = await service.saveDraft(ST1, String(a._id), { code: 'x' }, lateAt);
    const res: any = await service.submit(ST1, String(draft._id), lateAt);
    expect(res.state).toBe(S.LATE);
    await service.startGrading(T1, String(draft._id));
    const graded: any = await service.grade(T1, String(draft._id), { rawScore: 100, feedback: 'Đúng hết nhưng nộp trễ' });
    expect(graded).toMatchObject({ state: S.GRADED, rawScore: 100, score: 90 });
  });

  it('nộp trong 5 phút ân hạn vẫn đúng hạn; quá 24h bị từ chối', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const graceAt = at(2 * HOUR + 4 * MIN);
    const d: any = await service.saveDraft(ST1, String(a._id), {}, graceAt);
    expect(((await service.submit(ST1, String(d._id), graceAt)) as any).state).toBe(S.SUBMITTED);
    const tooLate = at(2 * HOUR + 25 * HOUR);
    const d2: any = await service.saveDraft(ST2, String(a._id), {}, tooLate);
    await expect(service.submit(ST2, String(d2._id), tooLate)).rejects.toMatchObject({ response: { code: 'E403_DEADLINE_PASSED' } });
  });

  it('chỉ chấm điểm khi đang GRADING; điểm ngoài khoảng bị từ chối', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const sid = await submitted(service, String(a._id));
    await expect(service.grade(T1, sid, { rawScore: 80 })).rejects.toMatchObject({ response: { code: 'E400_NOT_GRADING' } });
    await service.startGrading(T1, sid);
    await expect(service.grade(T1, sid, { rawScore: 101 })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.grade(T1, sid, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('phúc khảo -> giữ điểm và chốt -> FINALIZED khóa cứng mọi thao tác của cả giảng viên lẫn học viên', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const sid = await submitted(service, String(a._id));
    await toPublished(service, sid, 70);
    await expect(service.appeal(ST1, sid, 'ngắn')).rejects.toBeInstanceOf(BadRequestException);
    expect(((await service.appeal(ST1, sid, 'Em nghĩ câu 3 bị chấm nhầm')) as any).state).toBe(S.APPEALING);
    expect(((await service.resolveAppeal(T1, sid, 'REJECT', 'Đã xem lại, giữ nguyên điểm')) as any).state).toBe(S.FINALIZED);

    const locked = { response: { code: 'E403_SUBMISSION_FINALIZED' } };
    await expect(service.startGrading(T1, sid)).rejects.toMatchObject(locked);
    await expect(service.grade(T1, sid, { rawScore: 100 })).rejects.toMatchObject(locked);
    await expect(service.invalidate(T1, sid, 'Thử hủy bài đã chốt điểm')).rejects.toMatchObject(locked);
    await expect(service.appeal(ST1, sid, 'Em muốn phúc khảo lần nữa')).rejects.toMatchObject(locked);
    await expect(service.saveDraft(ST1, String(a._id), {}, NOW)).rejects.toMatchObject(locked);
  });

  it('phúc khảo được chấp nhận -> chấm lại -> công bố lại', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const sid = await submitted(service, String(a._id));
    await toPublished(service, sid, 60);
    await service.appeal(ST1, sid, 'Câu 2 em làm đúng theo đề');
    expect(((await service.resolveAppeal(T1, sid, 'REGRADE')) as any).state).toBe(S.GRADING);
    const regraded: any = await service.grade(T1, sid, { rawScore: 75 });
    expect(regraded.score).toBe(75);
    const pub: any = await service.publish(T1, sid);
    expect(pub.history.map((h: any) => h.to)).toEqual([S.DRAFT, S.SUBMITTED, S.GRADING, S.GRADED, S.PUBLISHED, S.APPEALING, S.GRADING, S.GRADED, S.PUBLISHED]);
  });

  it('bài tập tuần tối đa 3 lượt nộp; lượt thứ 4 bị chặn', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    for (let i = 0; i < 3; i++) await submitted(service, String(a._id));
    await expect(service.saveDraft(ST1, String(a._id), {}, NOW)).rejects.toMatchObject({ response: { code: 'E403_MAX_ATTEMPTS' } });
  });

  it('hủy kết quả: bắt buộc lý do >= 10 ký tự, điểm về 0 và ghi audit log', async () => {
    const { service, audit } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const sid = await submitted(service, String(a._id));
    await toPublished(service, sid, 95);
    await expect(service.invalidate(T1, sid, undefined)).rejects.toMatchObject({ response: { code: 'E400_REASON_REQUIRED' } });
    expect(audit.record).not.toHaveBeenCalled();
    const res: any = await service.invalidate(T1, sid, 'Phát hiện chép bài của bạn cùng lớp');
    expect(res).toMatchObject({ state: S.INVALIDATED, score: 0 });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ sub: T1.sub }), 'SUBMISSION_INVALIDATE', 'SUBMISSION', sid, expect.anything(), expect.anything(), 'Phát hiện chép bài của bạn cùng lớp');
  });

  it('thao tác đồng thời: trạng thái trong CSDL đã đổi thì 409, không ghi đè', async () => {
    const { service, submissions } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const sid = await submitted(service, String(a._id));
    const original = submissions.updateOne.getMockImplementation()!;
    submissions.updateOne.mockImplementationOnce(async () => ({ modifiedCount: 0 }));
    await expect(service.startGrading(T1, sid)).rejects.toBeInstanceOf(ConflictException);
    submissions.updateOne.mockImplementation(original);
  });
});

describe('AssessmentService: Exam và Contest', () => {
  it('Exam chỉ nộp 1 lần và không trả chi tiết test case/đáp án cho học viên', async () => {
    const { service } = build();
    const e: any = await service.createAssessment(T1, CLASS, { assessmentType: 'EXAM', title: 'Thi cuối kỳ', dueDate: at(3 * HOUR).toISOString() }, NOW);
    const sid = await submitted(service, String(e._id));
    await service.startGrading(T1, sid);
    await service.grade(T1, sid, { rawScore: 66, details: { tests: [{ input: '1', expected: '2', passed: false }] } });
    await service.publish(T1, sid);
    const mine: any = await service.getMine(ST1, sid);
    expect(mine.score).toBe(66);
    expect(mine).not.toHaveProperty('details');
    await expect(service.saveDraft(ST1, String(e._id), {}, NOW)).rejects.toMatchObject({ response: { code: 'E403_MAX_ATTEMPTS' } });
  });

  it('học viên không thấy điểm trước khi công bố', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const sid = await submitted(service, String(a._id));
    await service.startGrading(T1, sid);
    await service.grade(T1, sid, { rawScore: 50 });
    expect(await service.getMine(ST1, sid)).not.toHaveProperty('score');
  });

  it('Contest: rời màn hình >= 3 lần (mỗi lần >= 5s) -> hệ thống tự nộp và gắn cờ', async () => {
    const { service } = build();
    const start = at(HOUR);
    const c: any = await service.createAssessment(T1, CLASS, { assessmentType: 'CONTEST', title: 'Đấu trường 1', startTime: start.toISOString(), durationMinutes: 60 }, NOW);
    const during = at(HOUR + 10 * MIN);
    await expect(service.saveDraft(ST1, String(c._id), {}, NOW)).rejects.toMatchObject({ response: { code: 'E403_CONTEST_NOT_STARTED' } });
    const d: any = await service.saveDraft(ST1, String(c._id), { code: 'x' }, during);
    const sid = String(d._id);
    expect(await service.recordContestLeave(ST1, sid, 3000)).toMatchObject({ counted: false, leaveCount: 0 });
    expect(await service.recordContestLeave(ST1, sid, 6000)).toMatchObject({ counted: true, leaveCount: 1, forceSubmitted: false });
    expect(await service.recordContestLeave(ST1, sid, 7000)).toMatchObject({ leaveCount: 2, forceSubmitted: false });
    expect(await service.recordContestLeave(ST1, sid, 9000)).toMatchObject({ leaveCount: 3, forceSubmitted: true });
    const view: any = await service.getMine(ST1, sid);
    expect(view).toMatchObject({ state: S.SUBMITTED, forceSubmitted: true, flags: ['OUT_TAB_FORCE_SUBMIT'] });
    expect(view.history.at(-1)).toMatchObject({ actor: 'SYSTEM', to: S.SUBMITTED });
    // đã nộp: báo rời thêm không đổi gì
    expect(await service.recordContestLeave(ST1, sid, 9000)).toMatchObject({ counted: false, forceSubmitted: true });
  });

  it('bài tập tuần không giám sát rời màn hình', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    const d: any = await service.saveDraft(ST1, String(a._id), {}, NOW);
    await expect(service.recordContestLeave(ST1, String(d._id), 9000)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AssessmentService: điểm tổng kết', () => {
  it('lấy lượt cao nhất của bài tập, bỏ bài thấp nhất, áp công thức 0.3/0.4/0.3', async () => {
    const { service, assessments } = build();
    const a1: any = await service.createAssessment(T1, CLASS, assignment({ title: 'Tuần 1' }), NOW);
    const a2: any = await service.createAssessment(T1, CLASS, assignment({ title: 'Tuần 2' }), NOW);
    const a3: any = await service.createAssessment(T1, CLASS, assignment({ title: 'Tuần 3' }), NOW);
    const e: any = await service.createAssessment(T1, CLASS, { assessmentType: 'EXAM', title: 'Thi cuối kỳ', dueDate: at(3 * HOUR).toISOString() }, NOW);
    // Contest đã diễn ra: đặt startTime về quá khứ trực tiếp trong dữ liệu để nộp được.
    const c: any = await service.createAssessment(T1, CLASS, { assessmentType: 'CONTEST', title: 'Đấu trường', startTime: at(HOUR).toISOString(), durationMinutes: 60 }, NOW);

    const s1 = await submitted(service, String(a1._id));
    await toPublished(service, s1, 60);
    const s1b = await submitted(service, String(a1._id));
    await toPublished(service, s1b, 90); // lượt 2 cao hơn -> được ghi nhận
    await toPublished(service, await submitted(service, String(a2._id)), 40);
    await toPublished(service, await submitted(service, String(a3._id)), 100);
    await toPublished(service, await submitted(service, String(e._id)), 70);
    const during = at(HOUR + 5 * MIN);
    const cd: any = await service.saveDraft(ST1, String(c._id), {}, during);
    await service.submit(ST1, String(cd._id), during);
    await toPublished(service, String(cd._id), 80);

    const r = await service.calculateFinalGrade(T1, CLASS, ST1.sub);
    expect(r.assignmentAvg).toBe(95); // (90 + 100) / 2, bỏ 40
    expect(r.contestAvg).toBe(80);
    expect(r.examScore).toBe(70);
    expect(r.finalScore).toBe(Math.round((0.3 * 95 + 0.4 * 80 + 0.3 * 70) * 100) / 100);
    expect(r.locked).toBe(false);
    expect(assessments.rows).toHaveLength(5);
  });

  it('bỏ nộp > 30% bài tập tuần -> khóa kết quả, F', async () => {
    const { service } = build();
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) ids.push(String(((await service.createAssessment(T1, CLASS, assignment({ title: `Tuần ${i + 1}` }), NOW)) as any)._id));
    // ST1 bỏ 1/4 = 25% (chưa vượt 30%); ST2 bỏ 2/4 = 50%.
    for (const id of ids.slice(0, 3)) await toPublished(service, await submitted(service, id), 100);
    for (const id of ids.slice(0, 2)) await toPublished(service, await submitted(service, id, ST2), 100);
    const ok = await service.calculateFinalGrade(T1, CLASS, ST1.sub);
    expect(ok).toMatchObject({ locked: false, missedAssignments: 1, letter: 'A' });
    const r = await service.calculateFinalGrade(T1, CLASS, ST2.sub);
    expect(r).toMatchObject({ locked: true, letter: 'F', missedAssignments: 2 });
  });

  it('bảng điểm cả lớp: đủ mọi học viên, cùng kết quả với từng học viên; giảng viên lớp khác bị 403', async () => {
    const { service } = build();
    const a: any = await service.createAssessment(T1, CLASS, assignment(), NOW);
    await toPublished(service, await submitted(service, String(a._id)), 70);
    const all = await service.calculateClassFinalGrades(T1, CLASS);
    expect(all.assessmentCount).toBe(1);
    expect(all.students.map((s) => s.studentId)).toEqual([ST1.sub, ST2.sub]);
    const one = await service.calculateFinalGrade(T1, CLASS, ST1.sub);
    expect(all.students[0]).toMatchObject({ finalScore: one.finalScore, letter: one.letter });
    expect(all.students[1]).toMatchObject({ locked: true, letter: 'F' });
    await expect(service.calculateClassFinalGrades(T2, CLASS)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('chỉ giảng viên phụ trách, Admin hoặc chính học viên xem được điểm tổng kết', async () => {
    const { service } = build();
    await expect(service.calculateFinalGrade(T2, CLASS, ST1.sub)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.calculateFinalGrade(ST2, CLASS, ST1.sub)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.calculateFinalGrade(ST1, CLASS, ST1.sub)).resolves.toMatchObject({ studentId: ST1.sub });
    await expect(service.calculateFinalGrade(ADMIN, CLASS, ST1.sub)).resolves.toBeDefined();
  });
});

describe('KidProgressService: đọc cùng nguồn block_puzzle_progress với hồ sơ của bé', () => {
  const slugN = (n: number) => `blockly-maze-level-${n}`;
  const rows = (userId: string, n: number, agoMs: number) =>
    Array.from({ length: n }, (_, i) => ({ userId, lessonSlug: slugN(i + 1), gameId: 'blockly-maze', completedAt: new Date(NOW.getTime() - agoMs - (n - i) * MIN).toISOString() }));

  function buildKids(progressRows: any[]) {
    const b = build();
    const people = [KID.sub, OID(15), OID(16)];
    const kidClass = fakeModel([
      { _id: KID_CLASS, name: 'K3-5', ageGroup: '3-5', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: people },
      { _id: CLASS, name: 'K10-12', ageGroup: '10-12', teacherId: T1.sub, teacherIds: [T1.sub], studentIds: [] },
    ]);
    const kidUsers = fakeModel([
      { _id: KID.sub, fullName: 'Bé An', role: 'STUDENT' },
      { _id: OID(15), fullName: 'Bé Hân', role: 'STUDENT' },
      { _id: OID(16), fullName: 'Bé Mới', role: 'STUDENT' },
    ]);
    const svc = new KidProgressService(fakeModel(progressRows) as any, kidClass as any, fakeModel([]) as any, kidUsers as any);
    return { svc, b };
  }

  it('sao = số màn bé đã hoàn thành (đúng bằng số hồ sơ bé hiển thị); bé chưa chơi hiện 0 sao, Ải 1', async () => {
    const { svc } = buildKids([...rows(KID.sub, 10, 0), ...rows(OID(15), 4, 0)]);
    const list = await svc.listForTeacher(T1, KID_CLASS, NOW);
    expect(list.map((k) => [k.fullName, k.starsEarned, k.currentLevel])).toEqual([
      ['Bé An', 10, 4],
      ['Bé Hân', 4, 2],
      ['Bé Mới', 0, 1],
    ]);
  });

  it('bé kẹt (ngừng chơi > 3 ngày, chưa phá đảo) đứng đầu danh sách kèm STUCK_ALERT', async () => {
    const { svc } = buildKids([...rows(KID.sub, 10, 0), ...rows(OID(15), 9, 5 * 24 * 3600_000)]);
    const list = await svc.listForTeacher(T1, KID_CLASS, NOW);
    expect(list[0]).toMatchObject({ fullName: 'Bé Hân', starsEarned: 9, currentLevel: 4, stuckAlert: { active: true, level: 4 } });
    expect(list[1].stuckAlert.active).toBe(false);
  });

  it('slug giả không làm tăng sao', async () => {
    const { svc } = buildKids([...rows(KID.sub, 2, 0), { userId: KID.sub, lessonSlug: 'gian-lan', gameId: 'blockly-maze', completedAt: NOW.toISOString() }]);
    expect((await svc.listForTeacher(T1, KID_CLASS, NOW)).find((k) => k.fullName === 'Bé An')?.starsEarned).toBe(2);
  });

  it('chỉ lớp khối 3-5 và chỉ giảng viên phụ trách', async () => {
    const { svc } = buildKids([]);
    await expect(svc.listForTeacher(T1, CLASS, NOW)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.listForTeacher(T2, KID_CLASS, NOW)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
