import { BadRequestException } from '@nestjs/common';
import type { RubricCriterion } from '../../../modules-system/database/schemas/tester-lab.schema';

/**
 * Rubric chuẩn cho mọi bài Tester QA Lab (thang 100 = tổng 3 tiêu chí, điểm mỗi tiêu chí chính là trọng số):
 * - Test Coverage 40: bao phủ ca kiểm thử biên và kịch bản lỗi.
 * - Bug Report Clarity 30: các bước tái hiện, Actual vs Expected rõ ràng.
 * - Severity Classification 30: phân loại đúng mức Blocker / Critical / Major / Minor.
 */
export const TESTER_RUBRIC: RubricCriterion[] = [
  { key: 'test-coverage', label: 'Test Coverage: bao phủ ca biên và kịch bản lỗi', maxScore: 40, kind: 'quality' },
  { key: 'bug-report-clarity', label: 'Bug Report Clarity: Steps to Reproduce, Actual vs Expected', maxScore: 30, kind: 'quality' },
  { key: 'severity-classification', label: 'Severity Classification: Blocker / Critical / Major / Minor', maxScore: 30, kind: 'severity' },
];

export const TESTER_RUBRIC_TOTAL = TESTER_RUBRIC.reduce((s, c) => s + c.maxScore, 0);
export const MIN_TESTER_FEEDBACK_LENGTH = 20;
export const SEVERITY_LEVELS = ['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR'] as const;

export interface TesterGradeInput {
  grades?: unknown;
  reviewerNotes?: unknown;
}

export interface TesterGradeResult {
  grades: Array<{ key: string; score: number }>;
  total: number;
  max: number;
  notes: string;
}

/**
 * Chỉ cho chuyển sang GRADED khi: chấm đủ cả 3 tiêu chí (không thiếu, không trùng, không lạ), mỗi điểm là số trong [0, tối đa],
 * và có nhận xét từ 20 ký tự. Trả tổng điểm thang 100.
 */
export function validateTesterGrade(input: TesterGradeInput): TesterGradeResult {
  const bad = (code: string, message: string) => new BadRequestException({ code, message });
  if (!Array.isArray(input.grades)) throw bad('E400_RUBRIC_REQUIRED', 'grades phải là mảng điểm theo 3 tiêu chí.');
  const byKey = new Map(TESTER_RUBRIC.map((c) => [c.key, c]));
  const seen = new Map<string, number>();
  for (const g of input.grades as Array<{ key?: unknown; score?: unknown }>) {
    const key = typeof g?.key === 'string' ? g.key : '';
    const c = byKey.get(key);
    if (!c) throw bad('E400_RUBRIC_UNKNOWN', `Tiêu chí không thuộc rubric chuẩn: ${key || '(trống)'}.`);
    if (seen.has(key)) throw bad('E400_RUBRIC_DUPLICATE', `Tiêu chí bị chấm trùng: ${c.label}.`);
    const score = g.score;
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > c.maxScore) {
      throw bad('E400_RUBRIC_SCORE', `Điểm "${c.label}" phải là số từ 0 đến ${c.maxScore}.`);
    }
    seen.set(key, score);
  }
  const missing = TESTER_RUBRIC.filter((c) => !seen.has(c.key));
  if (missing.length) throw bad('E400_RUBRIC_INCOMPLETE', `Phải chấm đủ 3 tiêu chí, còn thiếu: ${missing.map((c) => c.label).join('; ')}.`);
  const notes = typeof input.reviewerNotes === 'string' ? input.reviewerNotes.trim() : '';
  if (notes.length < MIN_TESTER_FEEDBACK_LENGTH) {
    throw bad('E400_FEEDBACK_TOO_SHORT', `Nhận xét bắt buộc, tối thiểu ${MIN_TESTER_FEEDBACK_LENGTH} ký tự.`);
  }
  const grades = TESTER_RUBRIC.map((c) => ({ key: c.key, score: seen.get(c.key) as number }));
  return { grades, total: grades.reduce((s, g) => s + g.score, 0), max: TESTER_RUBRIC_TOTAL, notes };
}
