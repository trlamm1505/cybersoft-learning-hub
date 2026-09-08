import axiosClient from '../common/configAxios';
import type { GetHintsResponse, UnlockHintPayload, UnlockHintResponse } from '../types/hint';

/**
 * Hint Engine API Service Layer
 * Wraps NestJS Backend Hint API calls using configured Axios Client
 */
export const hintApi = {
  /**
   * GET /api/hints/exercise/:slug?userId=...
   */
  getHintsByExercise: async (exerciseSlug: string, userId: string = 'student-demo'): Promise<GetHintsResponse> => {
    return await axiosClient.get(`/hints/exercise/${exerciseSlug}?userId=${userId}`);
  },

  /**
   * POST /api/hints/unlock
   */
  unlockHint: async (payload: UnlockHintPayload): Promise<UnlockHintResponse> => {
    return await axiosClient.post('/hints/unlock', payload);
  },

  /**
   * GET /api/hints/sample-30
   */
  get30SampleHints: async () => {
    return await axiosClient.get('/hints/sample-30');
  },
};

export default hintApi;
