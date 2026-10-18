import type { BankBand, Difficulty } from '../types/classDays';
import type { QuizBankDetail, QuizQuestionPayload } from '../types/questionBank';
import { optionLabel } from '../common/quizOptions';

/** Giới hạn khớp BE (quiz-bank.service.ts). */
export const QUIZ_MIN_OPTIONS = 2;
export const QUIZ_MAX_OPTIONS = 6;
export const QUIZ_LIMITS = { content: 2000, codeSnippet: 5000, option: 500, explanation: 2000 } as const;

export { optionLabel };

export interface QuizForm {
  content: string;
  codeSnippet: string;
  options: Array<{ text: string }>;
  correctIndex: number;
  explanation: string;
  difficulty: Difficulty;
  band: BankBand;
  points: number;
}

export const emptyQuizForm = (band: BankBand = '6-9'): QuizForm => ({
  content: '',
  codeSnippet: '',
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctIndex: 0,
  explanation: '',
  difficulty: 'EASY',
  band,
  points: 10,
});

export const quizFormFromDetail = (d: QuizBankDetail): QuizForm => ({
  content: d.content,
  codeSnippet: d.codeSnippet ?? '',
  options: d.options.map((o) => ({ text: o.text })),
  correctIndex: Math.max(0, d.options.findIndex((o) => o.isCorrect)),
  explanation: d.explanation,
  difficulty: d.difficulty,
  band: d.band ?? '6-9',
  points: d.points,
});

/** Lỗi đầu tiên của form (null nếu hợp lệ) — cùng luật với máy chủ để báo ngay, không phải chờ 400. */
export function validateQuizForm(f: QuizForm): string | null {
  if (!f.content.trim()) return 'Nhập nội dung câu hỏi.';
  if (f.content.length > QUIZ_LIMITS.content) return `Nội dung tối đa ${QUIZ_LIMITS.content} ký tự.`;
  if (f.codeSnippet.length > QUIZ_LIMITS.codeSnippet) return `Đoạn code tối đa ${QUIZ_LIMITS.codeSnippet} ký tự.`;
  if (f.options.length < QUIZ_MIN_OPTIONS || f.options.length > QUIZ_MAX_OPTIONS) return `Cần từ ${QUIZ_MIN_OPTIONS} đến ${QUIZ_MAX_OPTIONS} đáp án.`;
  const empty = f.options.findIndex((o) => !o.text.trim());
  if (empty >= 0) return `Đáp án ${optionLabel(empty)} đang trống.`;
  if (f.options.some((o) => o.text.length > QUIZ_LIMITS.option)) return `Mỗi đáp án tối đa ${QUIZ_LIMITS.option} ký tự.`;
  const texts = f.options.map((o) => o.text.trim().toLowerCase());
  if (new Set(texts).size !== texts.length) return 'Các đáp án không được trùng nhau.';
  if (f.correctIndex < 0 || f.correctIndex >= f.options.length) return 'Chọn một đáp án đúng.';
  if (!f.explanation.trim()) return 'Nhập giải thích đáp án (học sinh xem sau khi nộp bài).';
  if (!Number.isInteger(f.points) || f.points < 1 || f.points > 100) return 'Điểm của câu từ 1 đến 100.';
  return null;
}

export const quizPayload = (f: QuizForm): QuizQuestionPayload => ({
  content: f.content.trim(),
  ...(f.codeSnippet.trim() ? { codeSnippet: f.codeSnippet } : {}),
  options: f.options.map((o, i) => ({ text: o.text.trim(), isCorrect: i === f.correctIndex })),
  explanation: f.explanation.trim(),
  difficulty: f.difficulty,
  band: f.band,
  points: f.points,
});

/** Thêm/bớt đáp án, giữ đúng vị trí đáp án đúng. */
export function addOption(f: QuizForm): QuizForm {
  return f.options.length >= QUIZ_MAX_OPTIONS ? f : { ...f, options: [...f.options, { text: '' }] };
}
export function removeOption(f: QuizForm, index: number): QuizForm {
  if (f.options.length <= QUIZ_MIN_OPTIONS) return f;
  const options = f.options.filter((_, i) => i !== index);
  const correctIndex = index === f.correctIndex ? 0 : index < f.correctIndex ? f.correctIndex - 1 : f.correctIndex;
  return { ...f, options, correctIndex };
}
