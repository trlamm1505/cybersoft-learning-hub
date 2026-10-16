import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import { AiLabSubmission } from '../../modules-system/database/schemas/ai-lab-submission.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import { INITIAL_AI_LABS } from '../../data/initial-ai-labs';
import { AiLabGraderService } from './ai-lab-grader.service';
import type { AiLabRunInput } from './ai-lab-grader.service';
import { CONFIG_LIMITS, EMBEDDING_MODELS, LLM_MODELS } from './ai-lab.catalog';
import type { AiLabSpec } from './ai-lab.catalog';

export const AI_LAB_TOPIC = 'ai-lab-pack';
/** Số lần chạy gần nhất giữ trong lịch sử thí nghiệm của mỗi học viên × bài. */
export const AI_LAB_HISTORY_LIMIT = 5;
/** Số câu của evaluation set cho học viên xem trước (không kèm đáp án chuẩn). */
export const EVAL_PREVIEW_SIZE = 3;

const LIST_FIELDS =
  'title slug description type difficulty points orderInTopic resource_id';

@Injectable()
export class AiLabsService implements OnModuleInit {
  private readonly logger = new Logger(AiLabsService.name);

  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(AiLabSubmission.name)
    // Kiểu raw thay vì `& Document`: trường `model` trùng tên method Document.model().
    private readonly submissionModel: Model<AiLabSubmission>,
    private readonly datasets: DatasetIntegrationService,
    private readonly grader: AiLabGraderService,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Tự nạp bộ lab khi khởi động. Bài AI lab do hệ thống quản lý (giảng viên
   * không sửa qua Authoring), nên đồng bộ lại đề, đặc tả chấm và gợi ý mỗi lần
   * khởi động thay vì chỉ chèn khi thiếu.
   */
  async onModuleInit() {
    const res = await this.exerciseModel.bulkWrite(
      INITIAL_AI_LABS.map((lab) => ({
        updateOne: {
          filter: { slug: lab.slug },
          update: {
            $set: { ...lab, topic: AI_LAB_TOPIC, tags: ['ai-lab'] },
          },
          upsert: true,
        },
      })),
    );
    if (res.upsertedCount > 0 || res.modifiedCount > 0) {
      this.logger.log(
        `Đồng bộ bài AI lab: thêm ${res.upsertedCount}, cập nhật ${res.modifiedCount}.`,
      );
    }
  }

  listLabs() {
    return this.exerciseModel
      .find({ topic: AI_LAB_TOPIC, type: 'AI_LAB' })
      .select(LIST_FIELDS)
      .sort({ orderInTopic: 1 })
      .lean();
  }

  /** Đề bài + đặc tả công khai (không kèm regex chấm) + danh mục model, giới hạn config. */
  async getLab(slug: string) {
    const lab = await this.findLab(slug);
    const spec = lab.aiLabSpec as unknown as AiLabSpec;
    const { aiLabSpec: _spec, ...rest } = lab as any;
    return {
      ...rest,
      spec: {
        rag: spec.rag,
        passQuality: spec.passQuality,
        budget: spec.budget,
        techniques: spec.techniques.map(({ id, label, hint }) => ({
          id,
          label,
          hint,
        })),
      },
      catalog: {
        models: Object.values(LLM_MODELS),
        embeddingModels: Object.values(EMBEDDING_MODELS),
        configLimits: CONFIG_LIMITS,
      },
    };
  }

  /** Xem trước một phần evaluation set của TTS 01: câu hỏi và loại câu, KHÔNG có đáp án chuẩn. */
  async getEvaluationPreview(slug: string) {
    const lab = await this.findLab(slug);
    const evalSet = await this.datasets.fetchEvaluationSet(lab.resource_id!);
    const categories: Record<string, number> = {};
    for (const item of evalSet.items) {
      categories[item.category] = (categories[item.category] ?? 0) + 1;
    }
    return {
      resource_id: evalSet.resource_id,
      name: evalSet.name,
      version: evalSet.version,
      corpus_id: evalSet.corpus_id,
      total: evalSet.items.length,
      categories,
      preview: evalSet.items
        .slice(0, EVAL_PREVIEW_SIZE)
        .map(({ question_id, query, category, expected_behavior }) => ({
          question_id,
          query,
          category,
          expected_behavior,
        })),
    };
  }

  /** Chấm rồi lưu prompt + model + config + run manifest cùng bài nộp. */
  async submit(slug: string, input: AiLabRunInput, userId: string) {
    const lab = await this.findLab(slug);
    const result = await this.grader.grade(
      {
        resource_id: lab.resource_id!,
        points: lab.points,
        aiLabSpec: lab.aiLabSpec as unknown as AiLabSpec,
      },
      input,
    );

    const exerciseId = String((lab as any)._id);
    const now = new Date();
    const latest = {
      prompt: result.normalized.prompt,
      model: result.normalized.model,
      config: result.normalized.config,
      runManifest: result.runManifest,
      qualityScore: result.qualityScore,
      cost: result.cost,
      latency: result.latency,
      score: result.score,
      maxScore: result.maxScore,
      status: result.status,
    };
    const asBest = {
      score: result.score,
      qualityScore: result.qualityScore,
      cost: result.cost,
      latency: result.latency,
      status: result.status,
      prompt: result.normalized.prompt,
      model: result.normalized.model,
      config: result.normalized.config,
      runAt: now,
    };

    const promptHash = (result.runManifest as { promptSha256: string })
      .promptSha256;
    // Một lần chạy trong lịch sử thí nghiệm (đủ để xem lại manifest và chạy lại).
    const historyEntry = {
      promptHash,
      prompt: result.normalized.prompt,
      model: result.normalized.model,
      config: result.normalized.config,
      score: result.score,
      qualityScore: result.qualityScore,
      cost: result.cost,
      latency: result.latency,
      status: result.status,
      runManifest: result.runManifest,
      createdAt: now,
    };
    const latestSubmission = {
      submittedAt: now,
      promptHash,
      score: result.score,
      qualityScore: result.qualityScore,
      status: result.status,
    };

    // Mỗi học viên một bản ghi cho mỗi bài: lần chạy mới nhất ở các trường cấp
    // gốc, lần điểm cao nhất ở `best`, và lịch sử tối đa AI_LAB_HISTORY_LIMIT lần
    // gần nhất ($push + $slice, không phình vô hạn).
    const existing = await this.submissionModel
      .findOne({ userId, exerciseId })
      .sort({ updatedAt: -1 })
      .lean();
    let submissionId: string;
    let totalAttempts: number;
    let best: typeof asBest;
    let bestQualityScore: number;
    let history: (typeof historyEntry)[];
    if (existing) {
      const previousBest = existing.best ?? {
        ...asBest,
        score: existing.score,
        runAt: (existing as any).createdAt,
      };
      best =
        result.score > previousBest.score
          ? asBest
          : (previousBest as typeof asBest);
      // Bản ghi trước khi có lịch sử dùng `attemptCount`.
      totalAttempts =
        (existing.totalAttempts ?? (existing as any).attemptCount ?? 1) + 1;
      bestQualityScore = Math.max(
        existing.bestQualityScore ?? existing.qualityScore ?? 0,
        result.qualityScore,
      );
      history = [
        ...((existing.history ?? []) as (typeof historyEntry)[]),
        historyEntry,
      ].slice(-AI_LAB_HISTORY_LIMIT);
      await this.submissionModel.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...latest,
            best,
            bestQualityScore,
            latestSubmission,
            totalAttempts,
          },
          $unset: { attemptCount: '' },
          $push: {
            history: { $each: [historyEntry], $slice: -AI_LAB_HISTORY_LIMIT },
          },
        },
      );
      submissionId = String(existing._id);
    } else {
      best = asBest;
      totalAttempts = 1;
      bestQualityScore = result.qualityScore;
      history = [historyEntry];
      const created = await this.submissionModel.create({
        userId,
        exerciseId,
        exerciseSlug: lab.slug,
        ...latest,
        best,
        bestQualityScore,
        latestSubmission,
        totalAttempts,
        history,
      });
      submissionId = String(created._id);
    }

    const { normalized: _n, ...publicResult } = result;
    return {
      ...publicResult,
      submissionId,
      submittedAt: now,
      totalAttempts,
      best,
      bestQualityScore,
      history,
    };
  }

  /** Lần chạy mới nhất của học viên cho bài này (để nạp lại cấu hình); null nếu chưa chạy. */
  async getMySubmission(slug: string, userId: string) {
    const lab = await this.findLab(slug);
    const latest = await this.submissionModel
      .findOne({ exerciseId: String((lab as any)._id), userId })
      .sort({ updatedAt: -1 })
      .lean();
    if (!latest) return null;
    const {
      _id,
      createdAt: _c,
      userId: _u,
      __v: _v,
      updatedAt,
      attemptCount,
      ...rest
    } = latest as any;
    return {
      submissionId: String(_id),
      submittedAt: updatedAt,
      ...rest,
      totalAttempts: rest.totalAttempts ?? attemptCount ?? 1,
      history: rest.history ?? [],
    };
  }

  /** Bài AI Lab của mọi học viên cho giảng viên/quản trị viên (không kèm chi tiết từng câu). */
  async listSubmissionsForStaff(limit = 200) {
    const docs = await this.submissionModel
      .find({})
      .select('-runManifest -history')
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    if (docs.length === 0) return [];
    const userIds = [...new Set(docs.map((d) => d.userId))];
    const users = await this.userModel
      .find({ _id: { $in: userIds } })
      .select('fullName email')
      .lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));
    return docs.map((d: any) => {
      const user = userById.get(d.userId);
      return {
        id: String(d._id),
        exerciseSlug: d.exerciseSlug,
        status: d.status,
        score: d.score,
        maxScore: d.maxScore,
        qualityScore: d.qualityScore,
        cost: d.cost,
        latency: d.latency,
        model: d.model,
        config: d.config,
        prompt: d.prompt,
        totalAttempts: d.totalAttempts ?? d.attemptCount ?? 1,
        bestQualityScore: d.bestQualityScore ?? d.qualityScore,
        best: d.best ?? null,
        updatedAt: d.updatedAt,
        student: user
          ? { id: d.userId, fullName: user.fullName, email: user.email }
          : { id: d.userId },
      };
    });
  }

  private async findLab(slug: string) {
    const lab = await this.exerciseModel
      .findOne({ slug, topic: AI_LAB_TOPIC, type: 'AI_LAB' })
      .lean();
    if (!lab || !lab.resource_id || !lab.aiLabSpec) {
      throw new NotFoundException(`Không tìm thấy bài AI lab "${slug}"`);
    }
    return lab;
  }
}
