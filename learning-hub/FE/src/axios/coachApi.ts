import axiosClient from '../common/configAxios';
import type {
  CoachChatPayload,
  CoachChatResponse,
  CoachHistoryResponse,
  DebugLoopPayload,
  DebugLoopResponse,
} from '../types/coach';

/**
 * AI Coach API Service Layer
 * Wraps NestJS Backend Coach API calls using configured Axios Client
 */
export const coachApi = {
  /**
   * POST /api/coach/chat
   */
  chat: async (payload: CoachChatPayload): Promise<CoachChatResponse> => {
    return await axiosClient.post('/coach/chat', payload);
  },

  /**
   * GET /api/coach/history/:userId/:exerciseSlug
   */
  getHistory: async (userId: string, exerciseSlug: string): Promise<CoachHistoryResponse> => {
    return await axiosClient.get(`/coach/history/${userId}/${exerciseSlug}`);
  },

  /**
   * POST /api/coach/debug-loop
   * Phân tích kết quả test THẬT của một submission đã lưu, không nhận mô tả
   * lỗi tự do — tránh AI phản hồi dựa trên dữ liệu bịa.
   */
  debugLoop: async (payload: DebugLoopPayload): Promise<DebugLoopResponse> => {
    return await axiosClient.post('/coach/debug-loop', payload);
  },
};

export default coachApi;
