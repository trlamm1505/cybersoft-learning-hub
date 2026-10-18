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
import { playgroundBandOf, playgroundFilter, playgroundStatuses } from '../exercise/playground-catalog';

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
   * Lộ trình Playground chuẩn của học viên Khối 6-9 / 10-12, đã sắp #1..#N (cùng bộ lọc và thứ tự với GET /exercises/playground).
   * null = học viên không có lộ trình Playground (nhóm khác). Đây là danh sách duy nhất làm mẫu số cho "Bài đã giải X/N".
   */
  private async playgroundTrack(ageGroup?: string) {
    const band = playgroundBandOf(ageGroup);
    if (!band) return null;
    const docs = await this.exerciseModel
      .find(playgroundFilter(band))
      .select('title slug difficulty tags prerequisiteSlug orderInTopic')
      .lean();
    return [...docs].sort((a, b) => (a.orderInTopic ?? 0) - (b.orderInTopic ?? 0) || a.slug.localeCompare(b.slug));
  }

  /** Id các bài trên lộ trình theo trạng thái (cùng hàm mở khóa với /exercises/playground). */
  private idsByStatus(track: Array<{ _id: unknown }>, solvedIds: ReadonlySet<string>, wanted: ReadonlyArray<'completed' | 'available' | 'locked'>): Set<string> {
    const ids = track.map((t) => String(t._id));
    const status = playgroundStatuses(ids, solvedIds);
    return new Set(ids.filter((_, i) => wanted.includes(status[i])));
  }

  /**
   * Thống kê cho trang Tiến độ: lượt nộp AC/WA/TLE/RE/CE và tỷ lệ hoàn thành theo chủ đề. Học viên 6-9 / 10-12 tính trên ĐÚNG lộ
   * trình Playground của khối (X/N khớp 100% với /playground); nhóm khác tính trên các bài của khối. userId lấy từ JWT.
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
    const [attempts, track, bandExercises] = await Promise.all([
      this.masteryService.getGradedAttempts(userId),
      this.playgroundTrack(ageGroup),
      playgroundBandOf(ageGroup)
        ? Promise.resolve(null)
        : this.exerciseModel
            .find({ resource_id: { $exists: false }, ...this.bandFilterFor(ageGroup) })
            .select('title slug difficulty tags')
            .lean(),
    ]);
    const exercises = track ?? bandExercises ?? [];
    // Lộ trình Playground: chỉ đề xuất bài đang mở khóa và chưa hoàn thành (bài còn khóa thì nộp sẽ bị từ chối).
    const candidateIds = track ? this.idsByStatus(track, await this.masteryService.getPlaygroundSolvedIds(userId), ['available']) : undefined;
    const summary = buildHistorySummary(
      attempts.map((a) => ({ exerciseId: a.exerciseId, status: a.status })),
      exercises.map((e) => ({
        id: String(e._id),
        slug: e.slug,
        title: e.title,
        difficulty: e.difficulty,
        tags: e.tags ?? [],
      })),
      candidateIds,
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
    const [attempts, track] = await Promise.all([this.masteryService.getGradedAttempts(userId), this.playgroundTrack(ageGroup)]);
    // Học viên có lộ trình: "đã giải" tính theo đúng định nghĩa của Playground để X/N khớp 100% (xem PRACTICE_AC_FILTER).
    const playgroundSolved = track ? await this.masteryService.getPlaygroundSolvedIds(userId) : undefined;
    const exercises =
      track ??
      (await this.exerciseModel
        .find({ resource_id: { $exists: false }, ...bandFilter })
        .select('tags slug title')
        .lean());
    return computeLearnerStats(
      attempts.map((a) => ({ exerciseId: a.exerciseId, status: a.status })),
      exercises.map((e) => ({ id: String(e._id), tags: e.tags ?? [], slug: e.slug, title: e.title })),
      playgroundSolved,
    );
  }

  async getRecommendations(userId: string, ageGroup?: string): Promise<RecommendedExercise[]> {
    const track = await this.playgroundTrack(ageGroup);
    const [tagMastery, solvedExerciseIds, allExercises] = await Promise.all([
      this.masteryService.getTagMastery(userId),
      track ? this.masteryService.getPlaygroundSolvedIds(userId) : this.masteryService.getSolvedExerciseIds(userId),
      // Chỉ gợi ý bài Python: bài DA Lab (có resource_id) học viên không
      // làm được ở Playground và không nộp được qua judge Python.
      track
        ? Promise.resolve(track)
        : this.exerciseModel
            .find({ resource_id: { $exists: false } })
            .select('title slug difficulty tags prerequisiteSlug')
            .lean(),
    ]);
    // Học viên 6-9 / 10-12: chỉ gợi ý bài trong lộ trình Playground và đang mở khóa (không gợi ý bài khóa, bài khối khác, bài Ngân hàng đề).
    const unlocked = track ? this.idsByStatus(track, new Set([...solvedExerciseIds].map(String)), ['completed', 'available']) : null;
    const exercises = unlocked ? allExercises.filter((e) => unlocked.has(String(e._id))) : allExercises;

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
