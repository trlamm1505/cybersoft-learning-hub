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
   * POST /api/quiz/start
   */
  startQuiz: async (userId: string, testId: string): Promise<QuizStartResponse> => {
    return await axiosClient.post('/quiz/start', { userId, testId });
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
   * GET /api/quiz/:attemptId/review?userId=...&policy=...
   */
  reviewQuiz: async (
    attemptId: string,
    userId: string,
    policy: string = 'AFTER_SUBMISSION'
  ): Promise<QuizReviewResponse> => {
    return await axiosClient.get(`/quiz/${attemptId}/review`, {
      params: { userId, policy },
    });
  },
};

export default quizApi;
