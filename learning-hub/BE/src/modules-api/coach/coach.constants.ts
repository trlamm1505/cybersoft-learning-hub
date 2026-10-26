export const COACH_LLM_CLIENT = 'COACH_LLM_CLIENT';

/** Giới hạn token đầu ra mỗi lượt của AI Coach: tiết kiệm chi phí và tránh model tự viết cả bài code dài. */
export const COACH_MAX_OUTPUT_TOKENS = 250;

/** Tối đa số lần nhờ AI phân tích lỗi (Debug Loop) cho mỗi bài tập của mỗi học viên. */
export const MAX_DEBUG_ANALYSES_PER_EXERCISE = 5;

export const DEBUG_ANALYSES_EXHAUSTED_MESSAGE =
  'Bạn đã hết 5 lượt nhờ AI phân tích lỗi cho bài này, hãy tự suy nghĩ hoặc dùng Hint';
