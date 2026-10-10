import axiosClient from '../common/configAxios';
import type { LearnerActivity, LearnerProgress, LearnerRecommendations } from '../types/learner';

/**
 * Learner Progress & Recommendation API Service Layer (Ngày 20)
 * Wraps NestJS Backend /learner/* API using configured Axios Client.
 */
export const learnerApi = {
  /** GET /api/learner/progress — mastery theo tag của học viên đang đăng nhập. */
  getProgress: async (): Promise<LearnerProgress> => {
    return await axiosClient.get('/learner/progress');
  },

  /**
   * GET /api/learner/activity — số lượt nộp bài theo ngày trong khoảng thời gian gần đây (mặc định 280 ngày, đủ phủ biểu đồ 40 tuần).
   * Gửi kèm độ lệch múi giờ của trình duyệt để ngày được chia theo giờ địa phương.
   */
  getActivity: async (days = 280): Promise<LearnerActivity> => {
    return await axiosClient.get('/learner/activity', {
      params: { days, tzOffset: -new Date().getTimezoneOffset() },
    });
  },

  /** GET /api/learner/recommendations — tối đa 3 gợi ý kèm reason. */
  getRecommendations: async (): Promise<LearnerRecommendations> => {
    return await axiosClient.get('/learner/recommendations');
  },
};

export default learnerApi;
