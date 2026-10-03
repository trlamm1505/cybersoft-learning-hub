import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import { INITIAL_DA_LABS, SALES_RESOURCE_ID } from '../../data/initial-da-labs';
import {
  DaLabSubmission,
  DaLabSubmissionDocument,
} from '../../modules-system/database/schemas/da-lab-submission.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import { sanitizeFreeformText } from '../../common/utils/sanitize-text-input.util';
import { SqlGraderService } from './sql-grader.service';
import {
  InsightGraderService,
  MAX_INSIGHT_CHARS,
} from './insight-grader.service';
import type { InsightGradeResult } from './insight-grader.service';

export const DA_LAB_TOPIC = 'da-lab-pack';
export const MAX_TEACHER_COMMENT_LENGTH = 2000;

export interface TeacherReviewInput {
  score?: unknown;
  teacherComment?: unknown;
}

// Không bao giờ trả `solutionCode` (câu tham chiếu = đáp án) cho học viên.
const PUBLIC_FIELDS =
  'title slug description type difficulty points starterCode orderInTopic resource_id insightRubric';

@Injectable()
export class DaLabsService implements OnModuleInit {
  private readonly logger = new Logger(DaLabsService.name);

  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    private readonly datasets: DatasetIntegrationService,
    private readonly sqlGrader: SqlGraderService,
    private readonly insightGrader: InsightGraderService,
    @InjectModel(DaLabSubmission.name)
    private readonly submissionModel: Model<DaLabSubmissionDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /** Tự nạp bộ lab khi khởi động: chỉ chèn bài còn thiếu, không ghi đè. */
  async onModuleInit() {
    const res = await this.exerciseModel.bulkWrite(
      INITIAL_DA_LABS.map((lab) => ({
        updateOne: {
          filter: { slug: lab.slug },
          update: {
            $setOnInsert: {
              ...lab,
              resource_id: SALES_RESOURCE_ID,
              topic: DA_LAB_TOPIC,
              tags: ['da-lab', lab.type === 'SQL_LAB' ? 'sql' : 'insight'],
            },
          },
          upsert: true,
        },
      })),
    );
    if (res.upsertedCount > 0) {
      this.logger.log(`Đã nạp ${res.upsertedCount} bài DA lab mặc định.`);
    }
  }

  listLabs() {
    return this.exerciseModel
      .find({ topic: DA_LAB_TOPIC, resource_id: { $exists: true } })
      .select(PUBLIC_FIELDS)
      .sort({ orderInTopic: 1 })
      .lean();
  }

  async getLab(slug: string) {
    const lab = await this.exerciseModel
      .findOne({ slug, topic: DA_LAB_TOPIC })
      .select(PUBLIC_FIELDS)
      .lean();
    if (!lab) throw new NotFoundException(`Không tìm thấy bài lab "${slug}"`);
    return lab;
  }

  /** Schema / data dictionary của dataset mà bài lab dùng, lấy từ TTS 01. */
  async getLabDataset(slug: string) {
    const lab = await this.getLab(slug);
    return this.datasets.fetchPublicDatasetInfo(lab.resource_id!);
  }

  async runSql(slug: string, sql: string) {
    const lab = await this.getLab(slug);
    return this.sqlGrader.run(lab.resource_id!, this.requireText(sql, 'sql'));
  }

  async submitSql(slug: string, sql: string) {
    const lab = await this.getFullLab(slug, 'SQL_LAB');
    return this.sqlGrader.grade(
      {
        resource_id: lab.resource_id!,
        solutionCode: lab.solutionCode!,
        points: lab.points,
      },
      this.requireText(sql, 'sql'),
    );
  }

  /**
   * Chấm Insight rồi LUÔN lưu bài nộp. AI chấm được thì GRADED; còn lại (bài
   * bị guardrail từ chối, chưa có model, đầu ra AI không hợp lệ, lỗi hệ thống
   * như sandbox mất kết nối) thì PENDING_REVIEW để giảng viên chấm tay.
   */
  async submitInsight(slug: string, answer: string, userId: string) {
    const lab = await this.getFullLab(slug, 'DA_INSIGHT');
    const content = this.requireText(answer, 'answer');

    let result: InsightGradeResult;
    try {
      result = await this.insightGrader.grade(
        {
          resource_id: lab.resource_id!,
          description: lab.description,
          solutionCode: lab.solutionCode!,
          points: lab.points,
          insightRubric: lab.insightRubric ?? [],
        },
        content,
      );
    } catch (err) {
      this.logger.error(
        `Chấm Insight "${slug}" lỗi hệ thống, chuyển giảng viên chấm: ${(err as Error).message}`,
      );
      result = {
        status: 'PENDING_REVIEW',
        score: 0,
        maxScore: lab.points,
        feedback:
          'Hệ thống chấm tự động đang gặp sự cố. Bài của bạn đã được lưu và sẽ do giảng viên chấm.',
        criteria: [],
      };
    }

    const graded = result.status === 'GRADED';
    const saved = await this.submissionModel.create({
      userId,
      exerciseId: String((lab as any)._id),
      exerciseSlug: lab.slug,
      // Bài quá dài đã bị grader từ chối; chỉ lưu phần đầu để giới hạn kích thước bản ghi.
      content: content.slice(0, MAX_INSIGHT_CHARS * 2),
      status: graded ? 'GRADED' : 'PENDING_REVIEW',
      score: graded ? result.score : 0,
      maxScore: result.maxScore,
      aiExplanation: result.feedback,
      criteria: result.criteria,
    });

    return {
      ...result,
      // Bài không được AI chấm giờ đã thực sự nằm trong hàng chờ giảng viên.
      ...(graded
        ? {}
        : {
            status: 'PENDING_REVIEW' as const,
            feedback: `${result.feedback} Bài đã được lưu để giảng viên chấm.`,
          }),
      submissionId: String(saved._id),
    };
  }

  /**
   * Bài nộp Insight mới nhất của chính học viên cho một bài tập (userId lấy
   * từ JWT ở controller). Trả null nếu chưa từng nộp. Không trả reviewedBy
   * (id nội bộ của giảng viên).
   */
  async getMySubmission(exerciseId: string, userId: string) {
    const latest = await this.submissionModel
      .findOne({ exerciseId, userId })
      .sort({ createdAt: -1 })
      .select(
        'exerciseId exerciseSlug content status score maxScore aiExplanation criteria teacherComment reviewedAt createdAt',
      )
      .lean();
    if (!latest) return null;
    const { _id, createdAt, ...rest } = latest as any;
    return { id: String(_id), submittedAt: createdAt, ...rest };
  }

  /**
   * Giảng viên chấm tay một bài Insight: lưu điểm, nhận xét, người chấm và
   * chuyển sang GRADED. Cho chấm lại cả bài AI đã chấm (ghi đè điểm AI).
   */
  async reviewSubmission(
    id: string,
    input: TeacherReviewInput,
    reviewerId: string,
  ) {
    // id sai định dạng ObjectId thì Mongoose ném CastError (500): coi như không tồn tại.
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Không tìm thấy bài nộp.');
    }
    const submission = await this.submissionModel.findById(id);
    if (!submission) throw new NotFoundException('Không tìm thấy bài nộp.');

    const score = input?.score;
    if (
      typeof score !== 'number' ||
      !Number.isFinite(score) ||
      score < 0 ||
      score > submission.maxScore
    ) {
      throw new BadRequestException(
        `Điểm phải là số từ 0 đến ${submission.maxScore}.`,
      );
    }

    submission.status = 'GRADED';
    submission.score = score;
    submission.teacherComment = sanitizeFreeformText(
      input?.teacherComment,
      MAX_TEACHER_COMMENT_LENGTH,
    );
    submission.reviewedBy = reviewerId;
    submission.reviewedAt = new Date();
    await submission.save();

    return {
      id: String(submission._id),
      status: submission.status,
      score: submission.score,
      maxScore: submission.maxScore,
      teacherComment: submission.teacherComment,
      reviewedAt: submission.reviewedAt,
    };
  }

  /** Bài Insight chờ giảng viên chấm, cũ nhất trước, kèm thông tin học viên và bài tập. */
  async listPendingReviews(limit = 100) {
    const pending = await this.submissionModel
      .find({ status: 'PENDING_REVIEW' })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();
    if (pending.length === 0) return [];

    const userIds = [...new Set(pending.map((p) => p.userId))];
    const exerciseIds = [...new Set(pending.map((p) => p.exerciseId))];
    const [users, exercises] = await Promise.all([
      this.userModel.find({ _id: { $in: userIds } }).select('fullName email').lean(),
      this.exerciseModel
        .find({ _id: { $in: exerciseIds } })
        .select('title slug points insightRubric')
        .lean(),
    ]);
    const userById = new Map(users.map((u) => [String(u._id), u]));
    const exerciseById = new Map(exercises.map((e) => [String(e._id), e]));

    return pending.map((p) => {
      const user = userById.get(p.userId);
      const exercise = exerciseById.get(p.exerciseId);
      return {
        id: String(p._id),
        status: p.status,
        content: p.content,
        aiExplanation: p.aiExplanation,
        criteria: p.criteria,
        maxScore: p.maxScore,
        submittedAt: (p as any).createdAt,
        student: user
          ? { id: p.userId, fullName: user.fullName, email: user.email }
          : { id: p.userId },
        exercise: exercise
          ? {
              id: p.exerciseId,
              slug: exercise.slug,
              title: exercise.title,
              points: exercise.points,
              insightRubric: exercise.insightRubric ?? [],
            }
          : { id: p.exerciseId, slug: p.exerciseSlug },
      };
    });
  }

  private async getFullLab(slug: string, type: 'SQL_LAB' | 'DA_INSIGHT') {
    const lab = await this.exerciseModel
      .findOne({ slug, topic: DA_LAB_TOPIC })
      .lean();
    if (!lab) throw new NotFoundException(`Không tìm thấy bài lab "${slug}"`);
    if (lab.type !== type) {
      throw new BadRequestException(`Bài "${slug}" không phải dạng ${type}.`);
    }
    if (!lab.resource_id || !lab.solutionCode) {
      throw new BadRequestException(`Bài "${slug}" thiếu resource_id hoặc câu tham chiếu.`);
    }
    return lab;
  }

  private requireText(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`Thiếu trường "${field}".`);
    }
    return value;
  }
}
