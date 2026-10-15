import { Inject, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import { MasteryService } from './mastery.service';
import { buildRecommendations } from './recommendation.engine';
import { computeLearnerStats, type LearnerStats } from './learner-stats';
import {
  buildAdvicePrompt,
  buildHistorySummary,
  parseAdvice,
  ruleBasedAdvice,
  type LearnerAdvice,
} from './learner-advice';
import { LEARNER_ADVISOR, type LearnerAdvisor } from './learner-advisor';
import { ExerciseSummary, RecommendedExercise, TagMastery } from './recommendation.types';

const MAX_RECOMMENDATIONS = 3;

/** Cùng một lịch sử làm bài thì dùng lại lời khuyên trong khoảng này, tiết kiệm quota Gemini. */
const ADVICE_CACHE_MS = 10 * 60 * 1000;

export interface LearnerAdviceResult extends LearnerAdvice {
  /** 'gemini': do Gemini đề xuất; 'rules': dự phòng theo luật (chưa cấu hình/lỗi Gemini/chưa có dữ liệu). */
  source: 'gemini' | 'rules';
  generatedAt: string;
  totalAttempts: number;
}

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    private readonly masteryService: MasteryService,
    // Không cấu hình GEMINI_API_KEY thì chỉ dùng lời khuyên theo luật.
    @Optional()
    @Inject(LEARNER_ADVISOR)
    private readonly advisor?: LearnerAdvisor | null,
  ) {}

  private readonly adviceCache = new Map<string, { key: string; at: number; value: LearnerAdviceResult }>();

  async getProgress(
    userId: string,
  ): Promise<{ tagMastery: TagMastery[]; totalAttempts: number }> {
    const attempts = await this.masteryService.getGradedAttempts(userId);
    const tagMastery = await this.masteryService.getTagMastery(userId);
    return { tagMastery, totalAttempts: attempts.length };
  }

  /**
   * Thống kê cho trang Tiến độ: lượt nộp AC/WA/TLE/RE/CE và tỷ lệ hoàn thành theo chủ đề trong danh sách bài của đúng khối
   * học viên (6-9, 10-12; nhóm khác tính toàn bộ bài). userId lấy từ JWT.
   */
  private bandFilterFor(ageGroup?: string) {
    return ageGroup === '6-9'
      ? { $or: [{ gradeBand: '6-9' }, { targetGroup: 'K6_9' }] }
      : ageGroup === '10-12'
        ? { $or: [{ gradeBand: { $in: ['9-12', '10-12'] } }, { targetGroup: 'K10_12' }] }
        : {};
  }

  /**
   * Gợi ý bài tập bằng Gemini thật dựa trên lịch sử làm bài của chính học viên: chủ đề hay sai nhất (WA/RE)
   * kèm lời khuyên ôn ngắn, và 1-2 bài tiếp theo kèm lý do. Slug do model đề xuất bị kiểm tra với danh sách
   * ứng viên thật; lỗi/thiếu cấu hình thì dùng lời khuyên theo luật. userId lấy từ JWT.
   */
  async getAiAdvice(userId: string, ageGroup?: string, now: Date = new Date()): Promise<LearnerAdviceResult> {
    const [attempts, exercises] = await Promise.all([
      this.masteryService.getGradedAttempts(userId),
      this.exerciseModel
        .find({ resource_id: { $exists: false }, ...this.bandFilterFor(ageGroup) })
        .select('title slug difficulty tags')
        .lean(),
    ]);
    const summary = buildHistorySummary(
      attempts.map((a) => ({ exerciseId: a.exerciseId, status: a.status })),
      exercises.map((e) => ({
        id: String(e._id),
        slug: e.slug,
        title: e.title,
        difficulty: e.difficulty,
        tags: e.tags ?? [],
      })),
    );

    const cacheKey = `${summary.totalAttempts}:${summary.solvedCount}:${summary.candidates.map((c) => c.slug).join(',')}`;
    const cached = this.adviceCache.get(userId);
    if (cached && cached.key === cacheKey && now.getTime() - cached.at < ADVICE_CACHE_MS) {
      return cached.value;
    }

    let advice: LearnerAdvice | null = null;
    let source: LearnerAdviceResult['source'] = 'rules';
    // Chưa có lượt nộp nào thì không có gì để phân tích: không tốn lượt gọi Gemini.
    if (this.advisor && summary.totalAttempts > 0 && summary.candidates.length > 0) {
      const text = await this.advisor.advise(buildAdvicePrompt(summary));
      advice = text ? parseAdvice(text, summary) : null;
      if (advice) source = 'gemini';
    }
    const result: LearnerAdviceResult = {
      ...(advice ?? ruleBasedAdvice(summary)),
      source,
      generatedAt: now.toISOString(),
      totalAttempts: summary.totalAttempts,
    };
    // Chỉ nhớ kết quả của Gemini thật; kết quả dự phòng được thử lại ở lần mở trang sau.
    if (source === 'gemini') this.adviceCache.set(userId, { key: cacheKey, at: now.getTime(), value: result });
    return result;
  }

  async getStats(userId: string, ageGroup?: string): Promise<LearnerStats> {
    const bandFilter = this.bandFilterFor(ageGroup);
    const [attempts, exercises] = await Promise.all([
      this.masteryService.getGradedAttempts(userId),
      this.exerciseModel
        .find({ resource_id: { $exists: false }, ...bandFilter })
        .select('tags slug title')
        .lean(),
    ]);
    return computeLearnerStats(
      attempts.map((a) => ({ exerciseId: a.exerciseId, status: a.status })),
      exercises.map((e) => ({ id: String(e._id), tags: e.tags ?? [], slug: e.slug, title: e.title })),
    );
  }

  async getRecommendations(userId: string): Promise<RecommendedExercise[]> {
    const [tagMastery, solvedExerciseIds, exercises] = await Promise.all([
      this.masteryService.getTagMastery(userId),
      this.masteryService.getSolvedExerciseIds(userId),
      // Chỉ gợi ý bài Python: bài DA Lab (có resource_id) học viên không
      // làm được ở Playground và không nộp được qua judge Python.
      this.exerciseModel
        .find({ resource_id: { $exists: false } })
        .select('title slug difficulty tags prerequisiteSlug')
        .lean(),
    ]);

    const exerciseSummaries: ExerciseSummary[] = exercises.map((ex) => ({
      id: String(ex._id),
      slug: ex.slug,
      title: ex.title,
      difficulty: ex.difficulty,
      tags: ex.tags ?? [],
      prerequisiteSlug: ex.prerequisiteSlug,
    }));

    const recommendations = buildRecommendations(
      tagMastery,
      exerciseSummaries,
      solvedExerciseIds,
    );

    return recommendations.slice(0, MAX_RECOMMENDATIONS);
  }
}
