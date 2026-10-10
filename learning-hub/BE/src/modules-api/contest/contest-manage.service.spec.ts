import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ContestManageService } from './contest-manage.service';
import { ContestService } from './contest.service';
import { ContestController } from './contest.controller';
import { ContestAttempt } from '../../modules-system/database/schemas/contest-attempt.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { Question } from '../../modules-system/database/schemas/question.schema';
import { User } from '../../modules-system/database/schemas/user.schema';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { StudentOnlyGuard } from '../../common/auth/student-only.guard';
import { ROLES_KEY } from '../../common/auth/roles.decorator';

const OID = '507f1f77bcf86cd799439011';
const ATT = '64b000000000000000000001';
const teacher = { sub: 'teacher-1', role: 'TEACHER' };

const chain = (value: unknown) => {
  const c: any = {};
  for (const m of ['select', 'sort', 'limit']) c[m] = jest.fn(() => c);
  c.lean = jest.fn().mockResolvedValue(value);
  return c;
};

describe('ContestManageService', () => {
  let service: ContestManageService;
  let attemptModel: any;
  let submissionModel: any;
  let exerciseModel: any;
  let questionModel: any;
  let contestService: { getContestForStaff: jest.Mock };
  let contest: any;

  beforeEach(async () => {
    contest = {
      _id: OID,
      slug: 'c',
      title: 'Cuộc thi',
      startTime: new Date(Date.now() - 3_600_000),
      endTime: new Date(Date.now() + 3_600_000),
      durationMinutes: 60,
      problems: [
        { slug: 'code-1', title: 'Code 1', type: 'coding', points: 60 },
        { slug: 'quiz-1', title: 'Quiz 1', type: 'quiz', points: 40 },
      ],
      registrations: [
        { studentId: 'u1', studentName: 'An', registeredAt: new Date() },
        { studentId: 'u2', studentName: 'Bình', registeredAt: new Date() },
        { studentId: 'u3', studentName: 'Chi', registeredAt: new Date() },
      ],
    };
    attemptModel = {
      find: jest.fn(),
      findById: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({}),
    };
    submissionModel = { find: jest.fn(), findOne: jest.fn(), findById: jest.fn() };
    exerciseModel = { find: jest.fn() };
    questionModel = { find: jest.fn(), distinct: jest.fn().mockResolvedValue(['Python', 'HTML']) };
    contestService = { getContestForStaff: jest.fn().mockResolvedValue(contest) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestManageService,
        { provide: ContestService, useValue: contestService },
        { provide: getModelToken(ContestAttempt.name), useValue: attemptModel },
        { provide: getModelToken(ContestSubmission.name), useValue: submissionModel },
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
        { provide: getModelToken(Question.name), useValue: questionModel },
        { provide: getModelToken(User.name), useValue: {} },
      ],
    }).compile();
    service = module.get(ContestManageService);
  });

  describe('getResults', () => {
    it('liệt kê mọi thí sinh đã đăng ký kèm trạng thái, điểm tốt nhất từng đề và tóm tắt trung thực', async () => {
      attemptModel.find.mockReturnValue(
        chain([
          {
            _id: 'a1',
            studentId: 'u1',
            startedAt: new Date(),
            finishedAt: new Date(),
            deadlineAt: new Date(Date.now() + 1000),
            integrity: {
              flag: 'REVIEW',
              reviewStatus: 'NEEDS_REVIEW',
              similarity: { score: 0.92 },
              focusSummary: { count: 6, totalAwaySeconds: 300 },
              timeline: { activeSeconds: 900 },
            },
          },
          {
            _id: 'a2',
            studentId: 'u2',
            startedAt: new Date(),
            deadlineAt: new Date(Date.now() - 60_000),
          },
        ]),
      );
      submissionModel.find.mockReturnValue(
        chain([
          { studentId: 'u1', problemSlug: 'code-1', score: 30, verdict: 'PARTIAL' },
          { studentId: 'u1', problemSlug: 'code-1', score: 60, verdict: 'AC' },
          { studentId: 'u1', problemSlug: 'quiz-1', score: 40, verdict: 'AC' },
        ]),
      );

      const res: any = await service.getResults(OID, teacher);

      expect(res.contest.maxScore).toBe(100);
      expect(res.rows.map((r: any) => [r.studentName, r.status, r.totalScore])).toEqual([
        ['An', 'FINISHED', 100],
        ['Bình', 'EXPIRED', 0],
        ['Chi', 'NOT_STARTED', 0],
      ]);
      expect(res.rows[0].perProblem).toEqual([
        { slug: 'code-1', score: 60, verdict: 'AC' },
        { slug: 'quiz-1', score: 40, verdict: 'AC' },
      ]);
      expect(res.rows[0].integrity).toMatchObject({ flag: 'REVIEW', similarityScore: 0.92, focusCount: 6, awaySeconds: 300 });
      expect(res.rows[2].integrity).toBeNull();
      expect(res.summary).toEqual({ registered: 3, started: 2, finished: 1, needsReview: 1 });
    });

    it('kiểm tra quyền sở hữu qua ContestService (giảng viên khác bị chặn)', async () => {
      contestService.getContestForStaff.mockRejectedValue(new ForbiddenException('không có quyền'));
      await expect(service.getResults(OID, { sub: 'teacher-x', role: 'TEACHER' })).rejects.toThrow(ForbiddenException);
    });
  });

  describe('xem xét trung thực của lượt thi', () => {
    const attempt = (over: Record<string, unknown> = {}) => ({
      _id: ATT,
      contestId: OID,
      studentId: 'u1',
      studentName: 'An',
      finishedAt: new Date(),
      integrity: {
        similarity: { score: 0.93, matchedSubmissionId: '64b000000000000000000002' },
        similarityProblemSlug: 'code-1',
        timeline: { submittedAt: new Date() },
      },
      ...over,
    });

    it('chi tiết: trả mã của bài và bài bị so khớp để giảng viên đối chiếu', async () => {
      attemptModel.findById.mockReturnValue(chain(attempt()));
      submissionModel.findOne.mockReturnValue(chain({ code: 'print("mine")' }));
      submissionModel.findById.mockReturnValue(
        chain({ _id: '64b000000000000000000002', studentId: 'u2', studentName: 'Bình', code: 'print("other")' }),
      );
      const d: any = await service.getIntegrityDetail(OID, ATT, teacher);
      expect(d.code).toBe('print("mine")');
      expect(d.match).toMatchObject({ code: 'print("other")', student: { id: 'u2', fullName: 'Bình' } });
      expect(d.exercise.title).toBe('Code 1');
      expect(d.student.fullName).toBe('An');
    });

    it('lượt thi của cuộc thi khác hoặc id sai → 404 (không xem chéo cuộc thi)', async () => {
      attemptModel.findById.mockReturnValue(chain(attempt({ contestId: 'cuoc-thi-khac' })));
      await expect(service.getIntegrityDetail(OID, ATT, teacher)).rejects.toThrow(NotFoundException);
      await expect(service.getIntegrityDetail(OID, 'abc', teacher)).rejects.toThrow(NotFoundException);
    });

    it('duyệt: ghi người duyệt, kết luận, lý do và CHỈ đụng tới các trường integrity.*', async () => {
      attemptModel.findById.mockReturnValue(chain(attempt()));
      const res = await service.reviewIntegrity(
        OID,
        ATT,
        { decision: 'FOLLOW_UP', note: '  Cần trao đổi thêm.  ' },
        teacher,
      );
      expect(res).toMatchObject({ reviewStatus: 'REVIEWED', decision: 'FOLLOW_UP', reviewedBy: 'teacher-1' });
      const [, update] = attemptModel.updateOne.mock.calls[0];
      expect(update.$set['integrity.reviewNote']).toBe('Cần trao đổi thêm.');
      for (const key of Object.keys(update.$set)) expect(key.startsWith('integrity.')).toBe(true);
    });

    it('từ chối kết luận lạ hoặc thiếu lý do; không ghi gì', async () => {
      attemptModel.findById.mockReturnValue(chain(attempt()));
      await expect(
        service.reviewIntegrity(OID, ATT, { decision: 'GUILTY', note: 'x' }, teacher),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.reviewIntegrity(OID, ATT, { decision: 'CLEARED', note: '  ' }, teacher),
      ).rejects.toThrow(BadRequestException);
      expect(attemptModel.updateOne).not.toHaveBeenCalled();
    });
  });

  describe('ngân hàng đề', () => {
    it('ngân hàng câu hỏi: lọc theo từ khóa an toàn (escape regex), kèm danh sách chủ đề', async () => {
      questionModel.find.mockReturnValue(
        chain([{ _id: 'q1', content: 'x'.repeat(300), category: 'Python', difficulty: 'EASY', points: 10, codeSnippet: 'a' }]),
      );
      const res = await service.listQuestionBank({ q: 'a.*(b', category: 'Python', difficulty: 'EASY' });
      const filter = questionModel.find.mock.calls[0][0];
      expect(filter.content.$regex).toBe('a\\.\\*\\(b');
      expect(filter).toMatchObject({ category: 'Python', difficulty: 'EASY' });
      expect(res.categories).toEqual(['HTML', 'Python']);
      expect(res.items[0]).toMatchObject({ id: 'q1', hasCode: true });
      expect(res.items[0].content).toHaveLength(200);
    });

    it('ngân hàng bài code: chỉ Python CODE_TEXT, bỏ bài gắn dataset (SQL/DA), kèm số test case', async () => {
      exerciseModel.find.mockReturnValue(
        chain([
          { slug: 'tong', title: 'Tổng', difficulty: 'EASY', points: 10, topic: 'Cơ bản', testCases: [{}, {}] },
          { slug: 'da', title: 'DA', resource_id: 'ds-1', testCases: [] },
        ]),
      );
      const res = await service.listExerciseBank({});
      expect(exerciseModel.find).toHaveBeenCalledWith({ type: 'CODE_TEXT' });
      expect(res).toEqual([
        { slug: 'tong', title: 'Tổng', difficulty: 'EASY', points: 10, topic: 'Cơ bản', testCaseCount: 2 },
      ]);
    });
  });
});

describe('ContestController — phân quyền các route mới', () => {
  const guardsOf = (key: string) =>
    Reflect.getMetadata(GUARDS_METADATA, (ContestController.prototype as any)[key]) ?? [];
  const rolesOf = (key: string) =>
    Reflect.getMetadata(ROLES_KEY, (ContestController.prototype as any)[key]) ?? [];

  it('vào thi, xem lượt thi, nộp bài thi: chỉ học viên', () => {
    for (const key of ['startAttempt', 'myAttempt', 'finishAttempt', 'registerContest', 'submitProblem']) {
      expect(guardsOf(key)).toEqual([JwtAuthGuard, StudentOnlyGuard]);
    }
  });

  it('kết quả, xem xét trung thực, ngân hàng đề: chỉ TEACHER/ADMIN', () => {
    for (const key of ['manageResults', 'integrityDetail', 'reviewIntegrity', 'questionBank', 'exerciseBank']) {
      expect(guardsOf(key)).toEqual([JwtAuthGuard, RolesGuard]);
      expect(rolesOf(key)).toEqual(['TEACHER', 'ADMIN']);
    }
  });
});
