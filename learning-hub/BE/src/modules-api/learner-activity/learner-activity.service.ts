import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import {
  QuizAttempt,
  QuizAttemptDocument,
} from '../../modules-system/database/schemas/quiz-attempt.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
} from '../../modules-system/database/schemas/contest-submission.schema';
import {
  DaLabSubmission,
  DaLabSubmissionDocument,
} from '../../modules-system/database/schemas/da-lab-submission.schema';
import { AiLabSubmission } from '../../modules-system/database/schemas/ai-lab-submission.schema';
import {
  TesterLabSubmission,
  TesterLabSubmissionDocument,
} from '../../modules-system/database/schemas/tester-lab-submission.schema';
import {
  clampDays,
  formatTzOffset,
  localDateKey,
  tzOffsetMinutes,
} from './activity-window';

export interface ActivityResult {
  /** Ngày bắt đầu và kết thúc của cửa sổ (YYYY-MM-DD, theo múi giờ người dùng). */
  from: string;
  to: string;
  total: number;
  activeDays: number;
  /** Chỉ các ngày có hoạt động, tăng dần theo ngày. */
  days: Array<{ date: string; count: number }>;
}

interface Source {
  model: Model<any>;
  match: Record<string, unknown>;
  field: string;
}

/**
 * Tổng hợp lượt nộp bài của MỘT học viên theo ngày để vẽ biểu đồ hoạt động
 * (userId luôn lấy từ token, không nhận từ client). Mỗi lượt nộp ở các nơi sau
 * tính là một hoạt động: bài code (judge), bài trắc nghiệm đã nộp, bài cuộc thi,
 * DA Lab, AI Lab, Tester Lab. Bản ghi gộp theo (học viên, bài) của lab chỉ tính
 * lần nộp đầu tiên của bài đó.
 */
@Injectable()
export class LearnerActivityService {
  constructor(
    @InjectModel(Submission.name)
    private readonly submissions: Model<SubmissionDocument>,
    @InjectModel(QuizAttempt.name)
    private readonly quizAttempts: Model<QuizAttemptDocument>,
    @InjectModel(ContestSubmission.name)
    private readonly contestSubmissions: Model<ContestSubmissionDocument>,
    @InjectModel(DaLabSubmission.name)
    private readonly daSubmissions: Model<DaLabSubmissionDocument>,
    @InjectModel(AiLabSubmission.name)
    private readonly aiSubmissions: Model<AiLabSubmission>,
    @InjectModel(TesterLabSubmission.name)
    private readonly testerSubmissions: Model<TesterLabSubmissionDocument>,
  ) {}

  async getActivity(
    userId: string,
    query: { days?: unknown; tzOffset?: unknown } = {},
    now: Date = new Date(),
  ): Promise<ActivityResult> {
    const days = clampDays(query.days);
    const tz = formatTzOffset(query.tzOffset);
    const offsetMinutes = tzOffsetMinutes(tz);

    const to = localDateKey(now, offsetMinutes);
    const fromDate = new Date(`${to}T00:00:00.000Z`);
    fromDate.setUTCDate(fromDate.getUTCDate() - (days - 1));
    const from = fromDate.toISOString().slice(0, 10);
    // Mốc bắt đầu theo giờ địa phương của người dùng, đổi về UTC để so với trường ngày trong DB.
    const since = new Date(fromDate.getTime() - offsetMinutes * 60_000);

    const sources: Source[] = [
      { model: this.submissions, match: { userId }, field: 'createdAt' },
      {
        model: this.contestSubmissions,
        match: { studentId: userId },
        field: 'submittedAt',
      },
      { model: this.daSubmissions, match: { userId }, field: 'createdAt' },
      { model: this.aiSubmissions, match: { userId }, field: 'createdAt' },
      { model: this.testerSubmissions, match: { userId }, field: 'createdAt' },
    ];
    if (Types.ObjectId.isValid(userId)) {
      sources.push({
        model: this.quizAttempts,
        match: { userId: new Types.ObjectId(userId) },
        field: 'submittedAt',
      });
    }

    const perSource = await Promise.all(
      sources.map(async ({ model, match, field }) => {
        try {
          return (await model.aggregate([
            { $match: { ...match, [field]: { $gte: since } } },
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: `$${field}`,
                    timezone: tz,
                  },
                },
                count: { $sum: 1 },
              },
            },
          ])) as Array<{ _id: string; count: number }>;
        } catch {
          // Một nguồn lỗi không làm mất cả biểu đồ.
          return [];
        }
      }),
    );

    const byDate = new Map<string, number>();
    for (const rows of perSource) {
      for (const r of rows) {
        if (r._id >= from && r._id <= to) {
          byDate.set(r._id, (byDate.get(r._id) ?? 0) + r.count);
        }
      }
    }
    const daysList = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      from,
      to,
      total: daysList.reduce((sum, d) => sum + d.count, 0),
      activeDays: daysList.length,
      days: daysList,
    };
  }
}
