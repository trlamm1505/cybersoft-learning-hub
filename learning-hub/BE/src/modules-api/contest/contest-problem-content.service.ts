import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ContestProblem } from '../../modules-system/database/schemas/contest.schema';
import {
  Lesson,
  LessonDocument,
} from '../../modules-system/database/schemas/lesson.schema';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  Question,
  QuestionDocument,
} from '../../modules-system/database/schemas/question.schema';

export const DEFAULT_CODING_TIME_LIMIT_MS = 2000;

export interface ResolvedQuestion {
  content: string;
  codeSnippet?: string;
  points?: number;
  options: Array<{ key: string; text: string; isCorrect?: boolean }>;
}

export interface ResolvedProblemContent {
  /** Đề bài (Markdown/text) của bài code. */
  content: string;
  starterCode: string;
  testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>;
  quizQuestions: ResolvedQuestion[];
  timeLimitMs: number;
}

const EMPTY: ResolvedProblemContent = {
  content: '',
  starterCode: '',
  testCases: [],
  quizQuestions: [],
  timeLimitMs: DEFAULT_CODING_TIME_LIMIT_MS,
};

/**
 * Một đề của cuộc thi có thể đến từ bài giảng viên soạn (lesson), Code
 * Playground (exercise) hoặc phần trắc nghiệm ghép từ ngân hàng câu hỏi
 * (bank). Lớp này đưa cả ba về cùng một dạng để chấm và hiển thị.
 */
@Injectable()
export class ContestProblemContentService {
  constructor(
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
  ) {}

  async resolve(problem: ContestProblem): Promise<ResolvedProblemContent> {
    const source = problem.source ?? 'lesson';

    if (source === 'exercise') {
      const ex: any = await this.exerciseModel
        .findOne({ slug: problem.exerciseSlug ?? problem.slug })
        .lean();
      if (!ex) return { ...EMPTY };
      return {
        content: ex.description ?? '',
        starterCode: ex.starterCode ?? '',
        testCases: (ex.testCases ?? []).map((tc: any) => ({
          input: tc.input ?? '',
          expectedOutput: tc.expectedOutput ?? '',
          isHidden: !!tc.isHidden,
        })),
        quizQuestions: [],
        timeLimitMs: ex.timeLimitMs ?? DEFAULT_CODING_TIME_LIMIT_MS,
      };
    }

    if (source === 'bank') {
      const ids = problem.questionIds ?? [];
      const found: any[] = ids.length
        ? await this.questionModel.find({ _id: { $in: ids } }).lean()
        : [];
      // Giữ đúng thứ tự giảng viên đã chọn.
      const byId = new Map(found.map((q) => [String(q._id), q]));
      const quizQuestions = ids
        .map((id) => byId.get(String(id)))
        .filter(Boolean)
        .map((q: any) => ({
          content: q.content,
          codeSnippet: q.codeSnippet,
          points: q.points,
          options: (q.options ?? []).map((o: any) => ({
            key: o.key,
            text: o.text,
            isCorrect: !!o.isCorrect,
          })),
        }));
      return { ...EMPTY, quizQuestions };
    }

    let lesson: any = null;
    if (problem.lessonId) {
      try {
        lesson = await this.lessonModel.findById(problem.lessonId).lean();
      } catch {
        lesson = null; // id không đúng định dạng: coi như không có bài
      }
    }
    if (!lesson) return { ...EMPTY };
    return {
      content: lesson.content ?? '',
      starterCode: lesson.starterCode ?? '',
      testCases: (lesson.testCases ?? []).map((tc: any) => ({
        input: tc.input ?? '',
        expectedOutput: tc.expectedOutput ?? '',
        isHidden: !!tc.isHidden,
      })),
      quizQuestions: (lesson.quizQuestions ?? []).map((q: any) => ({
        content: q.content,
        codeSnippet: q.codeSnippet,
        points: q.points,
        options: (q.options ?? []).map((o: any) => ({
          key: o.key,
          text: o.text,
          isCorrect: !!o.isCorrect,
        })),
      })),
      timeLimitMs: DEFAULT_CODING_TIME_LIMIT_MS,
    };
  }
}
