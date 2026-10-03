import axiosClient from '../common/configAxios';
import type {
  QuizStartResponse,
  QuizSubmitPayload,
  QuizSubmitResponse,
  QuizReviewResponse,
} from '../types/quiz';

/**
 * Quiz API Service Layer
 * Wraps NestJS Backend Quiz Engine API calls using configured Axios Client from FE/src/common/configAxios
 */
export const quizApi = {
  /**
   * 1. Start Attempt (Khởi tạo bài thi trắc nghiệm)
   * POST /api/quiz/start — userId không còn gửi trong body, Backend lấy từ
   * Bearer token (đã gắn tự động qua interceptor của axiosClient).
   */
  startQuiz: async (testId: string, category?: string): Promise<QuizStartResponse> => {
    return await axiosClient.post('/quiz/start', { testId, category });
  },

  /**
   * 2. Submit Attempt (Nộp bài thi & Tự động chấm điểm)
   * POST /api/quiz/:attemptId/submit
   */
  submitQuiz: async (
    attemptId: string,
    payload: QuizSubmitPayload
  ): Promise<QuizSubmitResponse> => {
    return await axiosClient.post(`/quiz/${attemptId}/submit`, payload);
  },

  /**
   * 3. Review Attempt (Xem lại bài làm & Giải thích chi tiết)
   * GET /api/quiz/:attemptId/review — userId lấy từ Bearer token; policy do server quyết định.
   */
  reviewQuiz: async (attemptId: string): Promise<QuizReviewResponse> => {
    return await axiosClient.get(`/quiz/${attemptId}/review`);
  },
};

export default quizApi;
