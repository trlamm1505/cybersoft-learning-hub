import type { RubricCriterion, RubricGrade } from '../types/testerLab';

/** Nhận xét chấm Tester QA bắt buộc từ 20 ký tự (khớp BE). */
export const MIN_FEEDBACK_LENGTH = 20;

/** Nhãn rubric từ BE có dạng "Test Coverage: bao phủ ca biên...": phần trước dấu hai chấm là tên tiêu chí, phần sau là gợi ý. */
export const rubricTitle = (label: string): string => label.split(':')[0].trim();
export const rubricHint = (label: string): string => (label.includes(':') ? label.slice(label.indexOf(':') + 1).trim() : '');

/** Tổng điểm đang nhập trên tổng điểm tối đa của rubric; ô trống tính 0. */
export function rubricTotal(criteria: RubricCriterion[], scores: Record<string, string>): { score: number; max: number } {
  let score = 0;
  let max = 0;
  for (const c of criteria) {
    max += c.maxScore;
    const n = Number(scores[c.key]);
    if (scores[c.key] !== undefined && scores[c.key] !== '' && Number.isFinite(n)) score += Math.min(Math.max(n, 0), c.maxScore);
  }
  return { score, max };
}

/** Kiểm tra đủ mọi tiêu chí, điểm trong 0..tối đa; trả danh sách điểm gửi BE hoặc lỗi tiếng Việt. */
export function validateGrades(
  criteria: RubricCriterion[],
  scores: Record<string, string>,
): { ok: true; grades: RubricGrade[] } | { ok: false; error: string } {
  const grades: RubricGrade[] = [];
  for (const c of criteria) {
    const raw = scores[c.key];
    if (raw === undefined || raw === '') return { ok: false, error: `Chưa nhập điểm cho "${c.label}".` };
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0 || n > c.maxScore) return { ok: false, error: `Điểm "${c.label}" phải trong khoảng 0-${c.maxScore}.` };
    grades.push({ key: c.key, score: n });
  }
  return { ok: true, grades };
}
