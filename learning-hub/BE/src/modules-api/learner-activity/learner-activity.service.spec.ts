import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { LearnerActivityService } from './learner-activity.service';
import { LearnerActivityController } from './learner-activity.controller';
import {
  clampDays,
  DEFAULT_ACTIVITY_DAYS,
  formatTzOffset,
  localDateKey,
  MAX_ACTIVITY_DAYS,
  tzOffsetMinutes,
} from './activity-window';
import { Submission } from '../../modules-system/database/schemas/submission.schema';
import { QuizAttempt } from '../../modules-system/database/schemas/quiz-attempt.schema';
import { ContestSubmission } from '../../modules-system/database/schemas/contest-submission.schema';
import { DaLabSubmission } from '../../modules-system/database/schemas/da-lab-submission.schema';
import { AiLabSubmission } from '../../modules-system/database/schemas/ai-lab-submission.schema';
import { TesterLabSubmission } from '../../modules-system/database/schemas/tester-lab-submission.schema';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ROLES_KEY } from '../../common/auth/roles.decorator';

describe('activity-window', () => {
  it('clampDays: mặc định 371, chặn trên 400, giá trị rác về mặc định', () => {
    expect(clampDays(undefined)).toBe(DEFAULT_ACTIVITY_DAYS);
    expect(clampDays('abc')).toBe(DEFAULT_ACTIVITY_DAYS);
    expect(clampDays(-5)).toBe(DEFAULT_ACTIVITY_DAYS);
    expect(clampDays('90')).toBe(90);
    expect(clampDays(99999)).toBe(MAX_ACTIVITY_DAYS);
  });

  it('formatTzOffset: UTC+7 → +07:00, âm, lẻ phút; ngoài khoảng hoặc rác → UTC', () => {
    expect(formatTzOffset('420')).toBe('+07:00');
    expect(formatTzOffset(-300)).toBe('-05:00');
    expect(formatTzOffset(330)).toBe('+05:30');
    expect(formatTzOffset(0)).toBe('+00:00');
    expect(formatTzOffset(99999)).toBe('+00:00');
    expect(formatTzOffset('"; drop')).toBe('+00:00');
    expect(formatTzOffset(undefined)).toBe('+00:00');
  });

  it('tzOffsetMinutes là nghịch đảo của formatTzOffset', () => {
    for (const m of [420, -300, 330, 0, 840, -720]) expect(tzOffsetMinutes(formatTzOffset(m))).toBe(m);
    expect(tzOffsetMinutes('xấu')).toBe(0);
  });

  it('localDateKey: 18:00 UTC ngày 5 đã là ngày 6 ở UTC+7', () => {
    const now = new Date('2026-10-05T18:00:00Z');
    expect(localDateKey(now, 0)).toBe('2026-10-05');
    expect(localDateKey(now, 420)).toBe('2026-10-06');
    expect(localDateKey(now, -300)).toBe('2026-10-05');
  });
});

describe('LearnerActivityService', () => {
  const USER = '507f1f77bcf86cd799439011';
  const NOW = new Date('2026-10-05T10:00:00Z');
  let models: Record<string, { aggregate: jest.Mock }>;
  let service: LearnerActivityService;

  const mk = () => ({ aggregate: jest.fn().mockResolvedValue([]) });

  beforeEach(async () => {
    models = {
      submission: mk(),
      quiz: mk(),
      contest: mk(),
      da: mk(),
      ai: mk(),
      tester: mk(),
    };
    const module = await Test.createTestingModule({
      providers: [
        LearnerActivityService,
        { provide: getModelToken(Submission.name), useValue: models.submission },
        { provide: getModelToken(QuizAttempt.name), useValue: models.quiz },
        { provide: getModelToken(ContestSubmission.name), useValue: models.contest },
        { provide: getModelToken(DaLabSubmission.name), useValue: models.da },
        { provide: getModelToken(AiLabSubmission.name), useValue: models.ai },
        { provide: getModelToken(TesterLabSubmission.name), useValue: models.tester },
      ],
    }).compile();
    service = module.get(LearnerActivityService);
  });

  it('chưa có lượt nộp nào: trả cửa sổ đủ 371 ngày với danh sách rỗng', async () => {
    const r = await service.getActivity(USER, {}, NOW);
    expect(r).toEqual({ from: '2025-09-30', to: '2026-10-05', total: 0, activeDays: 0, days: [] });
  });

  it('cộng dồn lượt nộp từ mọi nguồn theo ngày, sắp xếp tăng dần', async () => {
    models.submission.aggregate.mockResolvedValue([{ _id: '2026-10-03', count: 2 }, { _id: '2026-10-01', count: 1 }]);
    models.quiz.aggregate.mockResolvedValue([{ _id: '2026-10-03', count: 1 }]);
    models.contest.aggregate.mockResolvedValue([{ _id: '2026-10-04', count: 3 }]);
    models.da.aggregate.mockResolvedValue([{ _id: '2026-10-04', count: 1 }]);

    const r = await service.getActivity(USER, {}, NOW);

    expect(r.days).toEqual([
      { date: '2026-10-01', count: 1 },
      { date: '2026-10-03', count: 3 },
      { date: '2026-10-04', count: 4 },
    ]);
    expect(r.total).toBe(8);
    expect(r.activeDays).toBe(3);
  });

  it('userId luôn là của người gọi: mỗi nguồn lọc đúng trường định danh của nó', async () => {
    await service.getActivity(USER, {}, NOW);
    const matchOf = (m: { aggregate: jest.Mock }) => m.aggregate.mock.calls[0][0][0].$match;
    expect(matchOf(models.submission).userId).toBe(USER);
    expect(matchOf(models.contest).studentId).toBe(USER);
    expect(matchOf(models.da).userId).toBe(USER);
    expect(String(matchOf(models.quiz).userId)).toBe(USER); // ObjectId
  });

  it('nhóm theo múi giờ của người dùng và mốc bắt đầu quy về UTC đúng', async () => {
    await service.getActivity(USER, { days: 7, tzOffset: 420 }, NOW);
    const [match, group] = models.submission.aggregate.mock.calls[0][0];
    expect(group.$group._id.$dateToString.timezone).toBe('+07:00');
    // 7 ngày kết thúc 2026-10-05 (giờ VN) → bắt đầu 2026-09-29 00:00 giờ VN = 28/09 17:00 UTC.
    expect(match.$match.createdAt.$gte.toISOString()).toBe('2026-09-28T17:00:00.000Z');
  });

  it('loại ngày nằm ngoài cửa sổ do lệch múi giờ và một nguồn lỗi không làm mất cả biểu đồ', async () => {
    models.submission.aggregate.mockResolvedValue([{ _id: '2020-01-01', count: 9 }, { _id: '2026-10-05', count: 1 }]);
    models.ai.aggregate.mockRejectedValue(new Error('db lỗi'));
    const r = await service.getActivity(USER, {}, NOW);
    expect(r.days).toEqual([{ date: '2026-10-05', count: 1 }]);
  });

  it('id không phải ObjectId: bỏ nguồn trắc nghiệm (khóa ObjectId) nhưng các nguồn khác vẫn chạy', async () => {
    await service.getActivity('khong-phai-objectid', {}, NOW);
    expect(models.quiz.aggregate).not.toHaveBeenCalled();
    expect(models.submission.aggregate).toHaveBeenCalled();
  });
});

describe('LearnerActivityController — phân quyền', () => {
  it('chỉ học viên đã đăng nhập mới xem được (RolesGuard, STUDENT)', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, LearnerActivityController)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, LearnerActivityController)).toEqual(['STUDENT']);
  });
});
