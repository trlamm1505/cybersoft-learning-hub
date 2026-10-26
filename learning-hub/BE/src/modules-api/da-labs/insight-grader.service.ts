import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { detectPromptInjection } from '../coach/coach-injection-guard';
import { SqlGraderService } from './sql-grader.service';
import {
  applyOutputGuardrails,
  checkAnswerIsArgument,
} from './insight-guardrails';
import type {
  GuardedCriterion,
  InsightRubricCriterion,
} from './insight-guardrails';
import { INSIGHT_LLM_CLIENT } from './insight-llm.client';
import type { InsightLlmClient } from './insight-llm.client';

export const MAX_INSIGHT_CHARS = 4_000;
const GROUND_TRUTH_ROWS = 30;

export type InsightGradeStatus = 'GRADED' | 'PENDING_REVIEW' | 'REJECTED';

export interface InsightGradeResult {
  status: InsightGradeStatus;
  score: number;
  maxScore: number;
  feedback: string;
  criteria: GuardedCriterion[];
}

export interface GradableInsightExercise {
  resource_id: string;
  description: string;
  solutionCode: string;
  points: number;
  insightRubric: InsightRubricCriterion[];
}

@Injectable()
export class InsightGraderService {
  constructor(
    private readonly sqlGrader: SqlGraderService,
    @Inject(INSIGHT_LLM_CLIENT) private readonly llm: InsightLlmClient,
  ) {}

  async grade(
    exercise: GradableInsightExercise,
    answer: string,
  ): Promise<InsightGradeResult> {
    const maxScore = exercise.points;
    const reject = (feedback: string): InsightGradeResult => ({
      status: 'REJECTED',
      score: 0,
      maxScore,
      feedback,
      criteria: [],
    });

    const text = (answer ?? '').trim();
    if (text.length > MAX_INSIGHT_CHARS) {
      return reject(`Câu trả lời dài quá ${MAX_INSIGHT_CHARS} ký tự.`);
    }
    if (detectPromptInjection(text).suspicious) {
      return reject('Câu trả lời chứa nội dung điều khiển hệ thống chấm, không được chấm.');
    }
    const argument = checkAnswerIsArgument(text);
    if (!argument.ok) return reject(argument.reason);

    // Dữ liệu tham chiếu lấy trực tiếp từ sandbox của TTS 01 qua cùng đường chạy SQL.
    const reference = await this.sqlGrader.run(
      exercise.resource_id,
      exercise.solutionCode,
    );
    if (reference.status !== 'OK' || !reference.result) {
      throw new InternalServerErrorException(
        `Câu tham chiếu của bài Insight không chạy được: ${reference.error}`,
      );
    }
    const { columns, rows } = reference.result;
    const groundTruth = [columns.join(' | ')]
      .concat(rows.slice(0, GROUND_TRUTH_ROWS).map((r) => r.map(String).join(' | ')))
      .join('\n');

    const raw = await this.llm.grade({
      question: exercise.description,
      rubric: exercise.insightRubric,
      groundTruth,
      answer: text,
    });
    const criteria = applyOutputGuardrails(text, exercise.insightRubric, raw);
    if (!criteria) {
      return {
        status: 'PENDING_REVIEW',
        score: 0,
        maxScore,
        feedback:
          'Chưa chấm tự động được (chưa cấu hình model hoặc kết quả AI không hợp lệ). Hệ thống không chấm thay bằng từ khóa; bài này cần giảng viên chấm.',
        criteria: [],
      };
    }

    const score = criteria.reduce((sum, c) => sum + c.score, 0);
    return {
      status: 'GRADED',
      score,
      maxScore,
      feedback: raw?.overall_feedback ?? '',
      criteria,
    };
  }
}
