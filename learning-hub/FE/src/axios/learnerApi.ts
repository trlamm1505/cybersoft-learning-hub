import axiosClient from '../common/configAxios';
import type { LearnerProgress, LearnerRecommendations } from '../types/learner';

/**
 * Learner Progress & Recommendation API Service Layer (Ngày 20)
 * Wraps NestJS Backend /learner/* API using configured Axios Client.
 */
export const learnerApi = {
  /** GET /api/learner/progress — mastery theo tag của học viên đang đăng nhập. */
  getProgress: async (): Promise<LearnerProgress> => {
    return await axiosClient.get('/learner/progress');
  },

  /** GET /api/learner/recommendations — tối đa 3 gợi ý kèm reason. */
  getRecommendations: async (): Promise<LearnerRecommendations> => {
    return await axiosClient.get('/learner/recommendations');
  },
};

export default learnerApi;
