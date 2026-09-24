import axiosClient from '../common/configAxios';

export interface BlockPuzzleProgressResponse {
  completedSlugs: string[];
}

export interface CompleteLessonPayload {
  lessonSlug: string;
  gameId: string;
}

export interface CompleteLessonResponse {
  alreadyCompleted: boolean;
  completedAt: string;
}

/**
 * Tiến độ Block Puzzle lưu thật trên MongoDB theo tài khoản (không còn chỉ
 * localStorage) — userId lấy từ Bearer token ở Backend, không gửi trong
 * payload. Chỉ dùng được khi đã đăng nhập (JwtAuthGuard).
 */
export const blockPuzzleApi = {
  /** GET /api/block-puzzle/progress */
  getProgress: async (): Promise<BlockPuzzleProgressResponse> => {
    return await axiosClient.get('/block-puzzle/progress');
  },

  /** POST /api/block-puzzle/progress/complete */
  markCompleted: async (payload: CompleteLessonPayload): Promise<CompleteLessonResponse> => {
    return await axiosClient.post('/block-puzzle/progress/complete', payload);
  },
};

export default blockPuzzleApi;
