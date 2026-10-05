import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  ATTEMPT_GRACE_MS,
  ContestAttemptService,
} from './contest-attempt.service';
import { ContestService } from './contest.service';
import { Contest } from '../../modules-system/database/schemas/contest.schema';
import { ContestAttempt } from '../../modules-system/database/schemas/contest-attempt.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';
import { User } from '../../modules-system/database/schemas/user.schema';

const OID = '507f1f77bcf86cd799439011';
const student = { sub: 'student-1', role: 'STUDENT' };

/** Query giả: vừa `.lean()` được vừa `await` trực tiếp được. */
const query = (value: unknown) => ({
  lean: jest.fn().mockResolvedValue(value),
  then: (res: any, rej: any) => Promise.resolve(value).then(res, rej),
});
const sortedQuery = (value: unknown) => {
  const q: any = {};
  for (const m of ['select', 'sort', 'limit']) q[m] = jest.fn(() => q);
  q.lean = jest.fn().mockResolvedValue(value);
  return q;
};

const CODE = `
total = 0
for i in range(10):
    total += i * 2
print(total)
values = [x for x in range(30)]
print(sum(values))
`;

describe('ContestAttemptService', () => {
  let service: ContestAttemptService;
  let attemptModel: any;
  let submissionModel: any;
  let userModel: any;
  let contestService: { findVisible: jest.Mock };
  let contest: any;

  beforeEach(async () => {
    contest = {
      _id: OID,
      durationMinutes: 30,
      startTime: new Date(Date.now() - 10 * 60_000),
      endTime: new Date(Date.now() + 50 * 60_000),
      registrations: [{ studentId: 'student-1' }],
      problems: [
        { slug: 'code-1', title: 'Code', type: 'coding', points: 60 },
        { slug: 'quiz-1', title: 'Quiz', type: 'quiz', points: 40 },
      ],
    };
    attemptModel = {
      findOne: jest.fn().mockReturnValue(query(null)),
      create: jest.fn(async (doc) => ({ ...doc, toObject: () => doc })),
      updateOne: jest.fn().mockResolvedValue({}),
    };
    submissionModel = { find: jest.fn() };
    userModel = {
      findById: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({ fullName: 'Nguyen Van A' }),
        }),
      }),
    };
    contestService = { findVisible: jest.fn().mockResolvedValue(contest) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContestAttemptService,
        { provide: getModelToken(Contest.name), useValue: {} },
        { provide: getModelToken(ContestAttempt.name), useValue: attemptModel },
        { provide: getModelToken(ContestSubmission.name), useValue: submissionModel },
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: ContestService, useValue: contestService },
      ],
    }).compile();
    service = module.get(ContestAttemptService);
  });

  describe('start — đồng hồ cá nhân do máy chủ giữ', () => {
    it('học viên chưa đăng ký không vào thi được', async () => {
      await expect(
        service.start(OID, { sub: 'nguoi-la', role: 'STUDENT' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(attemptModel.create).not.toHaveBeenCalled();
    });

    it('chưa tới giờ hoặc đã hết giờ cuộc thi thì không bắt đầu được', async () => {
      contest.startTime = new Date(Date.now() + 60_000);
      await expect(service.start(OID, student)).rejects.toThrow('chưa bắt đầu');
      contest.startTime = new Date(Date.now() - 120_000);
      contest.endTime = new Date(Date.now() - 60_000);
      await expect(service.start(OID, student)).rejects.toThrow('đã kết thúc');
    });

    it('tạo lượt thi với hạn = bắt đầu + thời lượng cá nhân', async () => {
      const view = await service.start(OID, student);
      const created = attemptModel.create.mock.calls[0][0];
      expect(created).toMatchObject({ contestId: OID, studentId: 'student-1', studentName: 'Nguyen Van A' });
      expect(created.deadlineAt.getTime() - created.startedAt.getTime()).toBe(30 * 60_000);
      expect(view.finishedAt).toBeNull();
      expect(view.integrityEnabled).toBe(true);
    });

    it('hạn không vượt quá giờ kết thúc cuộc thi', async () => {
      contest.endTime = new Date(Date.now() + 5 * 60_000);
      await service.start(OID, student);
      const created = attemptModel.create.mock.calls[0][0];
      expect(created.deadlineAt.getTime()).toBe(contest.endTime.getTime());
    });

    it('gọi lại (tải lại trang, đổi máy, xóa localStorage) trả lượt cũ, KHÔNG cấp thêm giờ', async () => {
      const startedAt = new Date(Date.now() - 20 * 60_000);
      attemptModel.findOne.mockReturnValue(
        query({ startedAt, deadlineAt: new Date(startedAt.getTime() + 30 * 60_000) }),
      );
      const view = await service.start(OID, student);
      expect(view.startedAt).toBe(startedAt.toISOString());
      expect(attemptModel.create).not.toHaveBeenCalled();
    });

    it('hai request cùng lúc: bản trùng chỉ mục unique dùng lại lượt đã tạo', async () => {
      const existing = { startedAt: new Date(), deadlineAt: new Date(Date.now() + 1000) };
      attemptModel.findOne
        .mockReturnValueOnce(query(null))
        .mockReturnValueOnce(query(existing));
      attemptModel.create.mockRejectedValue({ code: 11000 });
      const view = await service.start(OID, student);
      expect(view.startedAt).toBe(existing.startedAt.toISOString());
    });
  });

  describe('requireActive', () => {
    const attempt = (over: Record<string, unknown> = {}) => ({
      startedAt: new Date(Date.now() - 10 * 60_000),
      deadlineAt: new Date(Date.now() + 20 * 60_000),
      ...over,
    });

    it('đang trong giờ: trả lượt thi', async () => {
      attemptModel.findOne.mockReturnValue(query(attempt()));
      await expect(service.requireActive(contest, 'student-1', new Date())).resolves.toBeDefined();
    });

    it('chưa vào thi / đã nộp bài thi / hết giờ cá nhân đều bị từ chối', async () => {
      await expect(service.requireActive(contest, 'student-1', new Date())).rejects.toThrow('chưa bắt đầu');
      attemptModel.findOne.mockReturnValue(query(attempt({ finishedAt: new Date() })));
      await expect(service.requireActive(contest, 'student-1', new Date())).rejects.toThrow('đã nộp bài thi');
      attemptModel.findOne.mockReturnValue(
        query(attempt({ deadlineAt: new Date(Date.now() - ATTEMPT_GRACE_MS - 1000) })),
      );
      await expect(service.requireActive(contest, 'student-1', new Date())).rejects.toThrow('hết thời gian');
    });

    it('nộp trễ vài giây do mạng vẫn được chấp nhận (trong thời gian ân hạn)', async () => {
      attemptModel.findOne.mockReturnValue(
        query(attempt({ deadlineAt: new Date(Date.now() - 2000) })),
      );
      await expect(service.requireActive(contest, 'student-1', new Date())).resolves.toBeDefined();
    });
  });

  describe('finish', () => {
    const live = () => ({
      _id: 'att1',
      startedAt: new Date(Date.now() - 5 * 60_000),
      deadlineAt: new Date(Date.now() + 25 * 60_000),
    });

    beforeEach(() => {
      submissionModel.find.mockReturnValue(sortedQuery([]));
    });

    it('chưa vào thi thì không nộp bài thi được', async () => {
      await expect(service.finish(OID, student)).rejects.toThrow('chưa bắt đầu');
    });

    it('nộp thủ công: ghi giờ nộp, lý do MANUAL', async () => {
      attemptModel.findOne.mockReturnValue(query(live()));
      await service.finish(OID, student, { startedAt: new Date().toISOString(), focusEvents: [] });
      const finishCall = attemptModel.updateOne.mock.calls.find(([, u]: any[]) => u.$set.finishedAt);
      expect(finishCall[1].$set.finishReason).toBe('MANUAL');
    });

    it('hết giờ cá nhân: lý do TIMEOUT', async () => {
      attemptModel.findOne.mockReturnValue(
        query({ ...live(), deadlineAt: new Date(Date.now() - 500) }),
      );
      await service.finish(OID, student);
      const finishCall = attemptModel.updateOne.mock.calls.find(([, u]: any[]) => u.$set.finishedAt);
      expect(finishCall[1].$set.finishReason).toBe('TIMEOUT');
    });

    it('nộp lần hai không đổi giờ nộp', async () => {
      attemptModel.findOne.mockReturnValue(query({ ...live(), finishedAt: new Date() }));
      await service.finish(OID, student);
      expect(attemptModel.updateOne).not.toHaveBeenCalled();
    });

    it('cuộc thi tắt giám sát thì không ghi tín hiệu liêm chính', async () => {
      contest.integrityEnabled = false;
      attemptModel.findOne.mockReturnValue(query(live()));
      await service.finish(OID, student, { startedAt: new Date().toISOString(), focusEvents: [] });
      const integrityCall = attemptModel.updateOne.mock.calls.find(([, u]: any[]) => u.$set.integrity);
      expect(integrityCall).toBeUndefined();
    });
  });

  describe('getMine — kết quả lấy từ máy chủ', () => {
    const startedAt = new Date(Date.now() - 5 * 60_000);
    beforeEach(() => {
      attemptModel.findOne.mockReturnValue(
        query({ startedAt, deadlineAt: new Date(Date.now() + 25 * 60_000) }),
      );
    });

    it('chưa vào thi: không có lượt, không có kết quả', async () => {
      attemptModel.findOne.mockReturnValue(query(null));
      expect(await service.getMine(OID, student)).toMatchObject({ attempt: null, results: [] });
    });

    it('lấy bài tốt nhất mỗi đề; điểm trắc nghiệm bị ẩn khi cuộc thi chưa kết thúc', async () => {
      submissionModel.find.mockReturnValue(
        sortedQuery([
          { problemSlug: 'code-1', score: 20, verdict: 'PARTIAL', passedCount: 1, totalCount: 3 },
          { problemSlug: 'code-1', score: 60, verdict: 'AC', passedCount: 3, totalCount: 3 },
          { problemSlug: 'quiz-1', score: 40, verdict: 'AC', passedCount: 4, totalCount: 4 },
        ]),
      );
      const res: any = await service.getMine(OID, student);
      const code = res.results.find((r: any) => r.slug === 'code-1');
      const quiz = res.results.find((r: any) => r.slug === 'quiz-1');
      expect(code).toMatchObject({ submitted: true, score: 60, verdict: 'AC' });
      expect(quiz).toMatchObject({ submitted: true, resultHidden: true, score: null, verdict: null });
      expect(res.totalScore).toBe(60);
      expect(res.maxScore).toBe(100);
      expect(res.scoreHidden).toBe(true);
    });

    it('sau khi cuộc thi kết thúc thì công bố điểm trắc nghiệm', async () => {
      contest.endTime = new Date(Date.now() - 1000);
      submissionModel.find.mockReturnValue(
        sortedQuery([{ problemSlug: 'quiz-1', score: 40, verdict: 'AC', passedCount: 4, totalCount: 4 }]),
      );
      const res: any = await service.getMine(OID, student);
      expect(res.results.find((r: any) => r.slug === 'quiz-1')).toMatchObject({ score: 40, resultHidden: false });
      expect(res.totalScore).toBe(40);
    });

    it('đề chưa nộp được đánh dấu submitted=false', async () => {
      submissionModel.find.mockReturnValue(sortedQuery([]));
      const res: any = await service.getMine(OID, student);
      expect(res.results.every((r: any) => r.submitted === false && r.score === null)).toBe(true);
    });
  });

  describe('similarityFor', () => {
    it('so với bài của học viên KHÁC cùng đề, mỗi người chỉ tính bài mới nhất, bỏ mã khung', async () => {
      submissionModel.find.mockReturnValue(
        sortedQuery([
          { _id: 's-new', studentId: 'u2', code: CODE },
          { _id: 's-old', studentId: 'u2', code: 'print(1)' },
          { _id: 's-3', studentId: 'u3', code: 'x = 1' },
        ]),
      );
      const hit = await service.similarityFor(OID, 'code-1', 'student-1', CODE, '');
      expect(submissionModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ contestId: OID, problemSlug: 'code-1', studentId: { $ne: 'student-1' } }),
      );
      expect(hit).toMatchObject({ score: 1, submissionId: 's-new', userId: 'u2', problemSlug: 'code-1' });
    });

    it('không có bài nào khác: điểm 0', async () => {
      submissionModel.find.mockReturnValue(sortedQuery([]));
      expect((await service.similarityFor(OID, 'code-1', 'student-1', CODE, '')).score).toBe(0);
    });
  });

  describe('recordIntegrity', () => {
    const NOW = new Date();
    const startedAt = new Date(NOW.getTime() - 20 * 60_000);
    const mkAttempt = (integrity?: unknown) => ({ _id: 'att1', startedAt, integrity }) as any;
    const saved = () => attemptModel.updateOne.mock.calls[0][1].$set.integrity;
    const leaves = (n: number, away: number) =>
      Array.from({ length: n }, (_, i) => ({
        leftAt: new Date(NOW.getTime() - (1100 - i * 100) * 1000).toISOString(),
        returnedAt: new Date(NOW.getTime() - (1100 - i * 100 - away) * 1000).toISOString(),
      }));

    it('giờ bắt đầu lấy từ máy chủ, bỏ qua giờ client tự khai', async () => {
      await service.recordIntegrity(
        contest,
        mkAttempt(),
        { startedAt: new Date(NOW.getTime() - 1000).toISOString(), focusEvents: [] },
        null,
        NOW,
      );
      expect(saved().timeline.startedAt).toEqual(startedAt);
      expect(saved().timeline.totalSeconds).toBe(1200);
    });

    it('[false-positive] chuyển tab ít/ngắn → không gắn cờ, trạng thái bình thường', async () => {
      await service.recordIntegrity(contest, mkAttempt(), { focusEvents: leaves(2, 20) }, null, NOW);
      expect(saved()).toMatchObject({ flag: 'NONE', reviewStatus: 'NORMAL' });
    });

    it('[false-positive] nộp bài rất nhanh → chỉ ghi mốc, không gắn cờ', async () => {
      const fast = { _id: 'att1', startedAt: new Date(NOW.getTime() - 8000) } as any;
      await service.recordIntegrity(contest, fast, {}, null, NOW);
      expect(saved()).toMatchObject({ flag: 'NONE', reasons: [] });
      expect(saved().timeline.totalSeconds).toBe(8);
    });

    it('rời màn hình nhiều lần và lâu → cần xem xét (chưa kết luận)', async () => {
      await service.recordIntegrity(contest, mkAttempt(), { focusEvents: leaves(6, 50) }, null, NOW);
      expect(saved()).toMatchObject({ flag: 'REVIEW', reviewStatus: 'NEEDS_REVIEW' });
      expect(saved().decision).toBeUndefined();
    });

    it('giữ điểm tương đồng CAO NHẤT qua các đề; đề sau thấp hơn không ghi đè', async () => {
      const prev = {
        similarity: { score: 0.95, matchedSubmissionId: 'old', matchedUserId: 'u9', flagged: true },
        similarityProblemSlug: 'code-1',
        focusEvents: [],
        timeline: { editMarks: [] },
        flag: 'REVIEW',
      };
      await service.recordIntegrity(
        contest,
        mkAttempt(prev),
        {},
        { score: 0.3, submissionId: 'new', userId: 'u2', problemSlug: 'code-2' },
        NOW,
      );
      expect(saved().similarity).toMatchObject({ score: 0.95, matchedSubmissionId: 'old' });
      expect(saved().similarityProblemSlug).toBe('code-1');
    });

    it('đề sau giống hơn thì cập nhật bài bị so khớp', async () => {
      await service.recordIntegrity(
        contest,
        mkAttempt({ similarity: { score: 0.2 }, focusEvents: [], timeline: { editMarks: [] } }),
        {},
        { score: 0.9, submissionId: 'new', userId: 'u2', problemSlug: 'code-2' },
        NOW,
      );
      expect(saved().similarity).toMatchObject({ score: 0.9, matchedSubmissionId: 'new', flagged: true });
      expect(saved().similarityProblemSlug).toBe('code-2');
    });

    it('không có payload mới (nộp đề trắc nghiệm) thì giữ nguyên dữ liệu rời màn hình đã ghi', async () => {
      const prev = {
        similarity: { score: 0 },
        focusEvents: leaves(6, 50).map((e) => ({ ...e, awaySeconds: 50 })),
        timeline: { editMarks: [] },
      };
      await service.recordIntegrity(contest, mkAttempt(prev), undefined, null, NOW);
      expect(saved().focusSummary.count).toBe(6);
      expect(saved().flag).toBe('REVIEW');
    });

    it('giữ nguyên kết luận đã duyệt của giảng viên khi có tín hiệu mới', async () => {
      const reviewedAt = new Date();
      const prev = {
        similarity: { score: 0.9 },
        focusEvents: [],
        timeline: { editMarks: [] },
        reviewStatus: 'REVIEWED',
        decision: 'CLEARED',
        reviewNote: 'Cùng mã khung',
        reviewedBy: 'teacher-1',
        reviewedAt,
      };
      await service.recordIntegrity(contest, mkAttempt(prev), {}, null, NOW);
      expect(saved()).toMatchObject({
        reviewStatus: 'REVIEWED',
        decision: 'CLEARED',
        reviewNote: 'Cùng mã khung',
        reviewedBy: 'teacher-1',
      });
    });

    it('cuộc thi tắt giám sát: không ghi gì', async () => {
      contest.integrityEnabled = false;
      await service.recordIntegrity(contest, mkAttempt(), {}, null, NOW);
      expect(attemptModel.updateOne).not.toHaveBeenCalled();
    });
  });
});
