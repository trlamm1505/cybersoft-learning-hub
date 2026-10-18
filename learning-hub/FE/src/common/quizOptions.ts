/**
 * Nhãn đáp án trắc nghiệm theo VỊ TRÍ hiển thị (Day 30, TC_UI_02): máy chủ xáo thứ tự đáp án nên key gốc có thể là
 * C, A, D, B; học sinh luôn thấy A, B, C, D từ trên xuống, còn bài nộp vẫn gửi đúng key gốc để chấm.
 */
export const optionLabel = (index: number): string => String.fromCharCode(65 + index);

export type AnswerStatus = 'correct' | 'wrong' | 'blank';

/** Trạng thái một câu trong trang kết quả (Day 30, DEF-061): bỏ trống được tách riêng khỏi câu làm sai. */
export const answerStatus = (q: { isCorrect?: boolean; selectedOptionKey?: string | null }): AnswerStatus =>
  q.isCorrect ? 'correct' : q.selectedOptionKey ? 'wrong' : 'blank';

/** Đếm số câu đúng / sai / bỏ trống. */
export function countAnswerStatuses(questions: Array<{ isCorrect?: boolean; selectedOptionKey?: string | null }>): Record<AnswerStatus, number> {
  const out: Record<AnswerStatus, number> = { correct: 0, wrong: 0, blank: 0 };
  for (const q of questions) out[answerStatus(q)] += 1;
  return out;
}
