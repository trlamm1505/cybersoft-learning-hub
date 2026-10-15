/**
 * Khối lớp của câu hỏi trắc nghiệm ôn tập: '6-9' và '10-12'. Câu không khai báo gradeBands (dữ liệu cũ) hiện cho mọi khối.
 * Quy ước phân khối khi seed/backfill: EASY -> 6-9; MEDIUM -> cả hai khối; HARD -> 10-12.
 */
export type QuizGradeBand = '6-9' | '10-12';

export const gradeBandsForDifficulty = (difficulty?: string): QuizGradeBand[] =>
  difficulty === 'EASY' ? ['6-9'] : difficulty === 'HARD' ? ['10-12'] : ['6-9', '10-12'];

/** Khối ôn tập của học viên theo ageGroup trong hồ sơ; khối khác (người lớn...) không lọc. */
export const quizBandOfStudent = (ageGroup?: string | null): QuizGradeBand | undefined =>
  ageGroup === '6-9' ? '6-9' : ageGroup === '10-12' ? '10-12' : undefined;
