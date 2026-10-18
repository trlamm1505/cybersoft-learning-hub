/**
 * Khối lớp của câu hỏi trắc nghiệm ôn tập: '6-9' và '10-12'. Câu không khai báo gradeBands (dữ liệu cũ) hiện cho mọi khối.
 * Quy ước phân khối khi seed/backfill: EASY -> 6-9; MEDIUM -> cả hai khối; HARD -> 10-12.
 */
export type QuizGradeBand = '6-9' | '10-12';

export const gradeBandsForDifficulty = (difficulty?: string): QuizGradeBand[] =>
  difficulty === 'EASY' ? ['6-9'] : difficulty === 'HARD' ? ['10-12'] : ['6-9', '10-12'];

/**
 * 3 bộ đề công khai của /quiz (Python, HTML5, CSS3; 20 câu mỗi bộ): MỌI học viên khối 6-9 và 10-12 đều làm đủ cả bộ, KHÔNG lọc theo khối
 * (con số "20 câu hỏi" ngoài thẻ phải khớp số câu bên trong). Chỉ câu bankOnly do giảng viên soạn bị loại khỏi các bộ này.
 */
export const PUBLIC_DECK_CATEGORIES: readonly string[] = ['Python', 'HTML5', 'CSS3'];
export const isPublicDeck = (category?: string | null): boolean => !!category && PUBLIC_DECK_CATEGORIES.includes(category);

/** Khối của một câu hỏi gốc khi seed/backfill: câu thuộc bộ đề công khai dùng được cho cả hai khối; câu khác theo độ khó. */
export const gradeBandsForQuestion = (category?: string | null, difficulty?: string): QuizGradeBand[] =>
  isPublicDeck(category) ? ['6-9', '10-12'] : gradeBandsForDifficulty(difficulty);

/** Khối ôn tập của học viên theo ageGroup trong hồ sơ; khối khác (người lớn...) không lọc. */
export const quizBandOfStudent = (ageGroup?: string | null): QuizGradeBand | undefined =>
  ageGroup === '6-9' ? '6-9' : ageGroup === '10-12' ? '10-12' : undefined;
