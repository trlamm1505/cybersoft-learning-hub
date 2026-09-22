import axiosClient from '../common/configAxios';
import type { CoachChatPayload, CoachChatResponse, CoachHistoryResponse } from '../types/coach';

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
};

export default coachApi;
