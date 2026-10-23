import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import { computeTagMastery } from './mastery.calculator';
import { PRACTICE_AC_FILTER } from '../exercise/playground-catalog';
import { GradedAttempt, TagMastery } from './recommendation.types';

@Injectable()
export class MasteryService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
  ) {}

  /**
   * Lấy toàn bộ submission của một học viên, gắn tag của exercise tương ứng,
   * rồi gom thành mastery theo tag. Query theo userId lấy từ JWT
   * (@CurrentUser) ở controller — KHÔNG bao giờ nhận userId từ client.
   */
  async getTagMastery(userId: string): Promise<TagMastery[]> {
    const attempts = await this.getGradedAttempts(userId);
    return computeTagMastery(attempts);
  }

  /**
   * Danh sách attempt đã gắn tag, dùng chung cho cả mastery và recommendation
   * (tránh 2 query submissions riêng lẻ cho cùng một request).
   */
  async getGradedAttempts(userId: string): Promise<GradedAttempt[]> {
    const submissions = await this.submissionModel
      .find({ userId })
      .select('exerciseId status passedCount totalCount createdAt')
      .lean();

    if (submissions.length === 0) return [];

    const exerciseIds = [...new Set(submissions.map((s) => s.exerciseId))];
    const exercises = await this.exerciseModel
      .find({ _id: { $in: exerciseIds } })
      .select('tags')
      .lean();
    const tagsByExerciseId = new Map(
      exercises.map((ex) => [String(ex._id), ex.tags ?? []]),
    );

    return submissions.map((s) => ({
      exerciseId: s.exerciseId,
      tags: tagsByExerciseId.get(s.exerciseId) ?? [],
      status: s.status,
      passedCount: s.passedCount,
      totalCount: s.totalCount,
      createdAt: (s as any).createdAt ?? new Date(),
    }));
  }

  /** Tập exerciseId mà học viên đã AC ít nhất một lần — dùng để loại khỏi gợi ý. */
  /** Id bài đã hoàn thành ở Code Playground (AC luyện tập tự do, không tính bài giao của lớp, không tính bài nộp nhảy cóc cũ). */
  async getPlaygroundSolvedIds(userId: string): Promise<Set<string>> {
    const rows = await this.submissionModel.find({ userId, ...PRACTICE_AC_FILTER }).select('exerciseId').lean();
    return new Set(rows.map((s) => String(s.exerciseId)));
  }

  async getSolvedExerciseIds(userId: string): Promise<Set<string>> {
    const solved = await this.submissionModel
      .find({ userId, status: 'AC' })
      .select('exerciseId')
      .lean();
    return new Set(solved.map((s) => s.exerciseId));
  }
}
