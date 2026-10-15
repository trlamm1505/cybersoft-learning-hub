import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import { MasteryService } from './mastery.service';
import { buildRecommendations } from './recommendation.engine';
import { computeLearnerStats, type LearnerStats } from './learner-stats';
import { ExerciseSummary, RecommendedExercise, TagMastery } from './recommendation.types';

const MAX_RECOMMENDATIONS = 3;

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    private readonly masteryService: MasteryService,
  ) {}

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
  async getStats(userId: string, ageGroup?: string): Promise<LearnerStats> {
    const bandFilter =
      ageGroup === '6-9'
        ? { $or: [{ gradeBand: '6-9' }, { targetGroup: 'K6_9' }] }
        : ageGroup === '10-12'
          ? { $or: [{ gradeBand: { $in: ['9-12', '10-12'] } }, { targetGroup: 'K10_12' }] }
          : {};
    const [attempts, exercises] = await Promise.all([
      this.masteryService.getGradedAttempts(userId),
      this.exerciseModel
        .find({ resource_id: { $exists: false }, ...bandFilter })
        .select('tags')
        .lean(),
    ]);
    return computeLearnerStats(
      attempts.map((a) => ({ exerciseId: a.exerciseId, status: a.status })),
      exercises.map((e) => ({ id: String(e._id), tags: e.tags ?? [] })),
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
