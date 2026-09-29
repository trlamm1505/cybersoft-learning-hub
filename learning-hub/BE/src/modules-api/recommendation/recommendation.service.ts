import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import { MasteryService } from './mastery.service';
import { buildRecommendations } from './recommendation.engine';
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

  async getRecommendations(userId: string): Promise<RecommendedExercise[]> {
    const [tagMastery, solvedExerciseIds, exercises] = await Promise.all([
      this.masteryService.getTagMastery(userId),
      this.masteryService.getSolvedExerciseIds(userId),
      this.exerciseModel
        .find()
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
