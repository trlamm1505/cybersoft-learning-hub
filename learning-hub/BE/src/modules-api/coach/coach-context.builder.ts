import { Injectable, NotFoundException } from '@nestjs/common';
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
import {
  HintUsage,
  HintUsageDocument,
} from '../../modules-system/database/schemas/hint-usage.schema';
import {
  Hint,
  HintDocument,
} from '../../modules-system/database/schemas/hint.schema';
import {
  CoachMessage,
  CoachMessageDocument,
} from '../../modules-system/database/schemas/coach-message.schema';
import { CoachContext } from './coach-context.types';

// Số lượt hội thoại gần nhất đưa vào context, giữ prompt gọn để không vượt
// giới hạn token và để câu trả lời bám sát câu hỏi hiện tại thay vì trôi dạt
// theo lịch sử dài.
const MAX_HISTORY_TURNS = 6;

@Injectable()
export class CoachContextBuilder {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(HintUsage.name)
    private readonly hintUsageModel: Model<HintUsageDocument>,
    @InjectModel(Hint.name) private readonly hintModel: Model<HintDocument>,
    @InjectModel(CoachMessage.name)
    private readonly coachMessageModel: Model<CoachMessageDocument>,
  ) {}

  async build(userId: string, exerciseSlug: string): Promise<CoachContext> {
    const exercise = await this.exerciseModel
      .findOne({ slug: exerciseSlug })
      .select('title slug description difficulty testCases')
      .lean();

    if (!exercise) {
      throw new NotFoundException(`Không tìm thấy bài tập "${exerciseSlug}"`);
    }

    const allTestCases = exercise.testCases ?? [];
    const visibleTestCases = allTestCases
      .filter((t) => !t.isHidden)
      .map((t) => ({ input: t.input, expectedOutput: t.expectedOutput }));
    const hiddenTestCount = allTestCases.length - visibleTestCases.length;

    const submissions = await this.submissionModel
      .find({ exerciseId: String((exercise as any)._id), userId })
      .sort({ createdAt: -1 })
      .select('status passedCount totalCount')
      .lean();

    const attemptSummary = {
      totalAttempts: submissions.length,
      lastStatus: submissions[0]?.status ?? null,
      lastPassedCount: submissions[0]?.passedCount ?? 0,
      lastTotalCount: submissions[0]?.totalCount ?? 0,
      hasEverPassed: submissions.some((s) => s.status === 'AC'),
    };

    const hintUsages = await this.hintUsageModel
      .find({ userId, exerciseSlug })
      .sort({ level: 1 })
      .lean();

    const unlockedLevels = hintUsages.map((u) => u.level);
    const unlockedHintDocs = unlockedLevels.length
      ? await this.hintModel
          .find({ exerciseSlug, level: { $in: unlockedLevels } })
          .sort({ level: 1 })
          .select('level title content')
          .lean()
      : [];

    const unlockedHints = unlockedHintDocs.map((h) => ({
      level: h.level,
      title: h.title,
      content: h.content,
    }));

    const recentHistoryDocs = await this.coachMessageModel
      .find({ userId, exerciseSlug })
      .sort({ createdAt: -1 })
      .limit(MAX_HISTORY_TURNS)
      .select('role content')
      .lean();

    const recentHistory = recentHistoryDocs.reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const maxHintLevelUnlocked = unlockedLevels.length
      ? Math.max(...unlockedLevels)
      : 0;

    // Chính sách: chỉ cho phép trình bày lời giải đầy đủ khi học viên đã tự
    // AC bài này (đã tự làm được, hỏi để hiểu sâu hơn) HOẶC đã mở tới tầng
    // gợi ý cao nhất (tầng 3 — đã trả giá đầy đủ theo cơ chế hint hiện có).
    // Trước đó, AI chỉ được gợi ý theo hướng, không được đưa full solution.
    const allowFullSolution =
      attemptSummary.hasEverPassed || maxHintLevelUnlocked >= 3;

    return {
      userId,
      exercise: {
        slug: exercise.slug,
        title: exercise.title,
        description: exercise.description,
        difficulty: exercise.difficulty,
        visibleTestCases,
        hiddenTestCount,
      },
      attemptSummary,
      unlockedHints,
      recentHistory,
      policy: {
        allowFullSolution,
        maxHintLevelUnlocked,
      },
    };
  }
}
