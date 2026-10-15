import axiosClient from '../common/configAxios';
import type { ServerRecord } from '../common/kidProgress';

export interface BlockPuzzleProgressResponse {
  completedSlugs: string[];
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  /** Họ và tên đầy đủ của bé (không có email). */
  fullName: string;
  levelsCompleted: number;
  totalLevels: number;
  firstCompletedAt: string;
  lastCompletedAt: string;
  isMe: boolean;
}

export interface LeaderboardResponse {
  gameId: string;
  /** Số màn của game: chỉ bé phá đảo đủ số màn này mới lên bảng. */
  totalLevels: number;
  /** Số bé đã phá đảo (có hạng). */
  total: number;
  top: LeaderboardRow[];
  /** Dòng của chính bé khi đã phá đảo nhưng nằm ngoài top. */
  me?: LeaderboardRow;
  /** Khi bé xem chưa phá đảo hết: tiến độ hiện tại. */
  myProgress?: { levelsCompleted: number; totalLevels: number };
}

export interface KidCardResponse {
  userId: string;
  fullName: string;
  avatar: string | null;
  ageGroup: '3-5' | '6-9' | '10-12' | null;
  completedSlugs: string[];
}

export interface BlockPuzzleRecordsResponse {
  records: ServerRecord[];
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

  /** GET /api/block-puzzle/leaderboard/:gameId — bảng vinh danh của một game. */
  getLeaderboard: async (gameId: string): Promise<LeaderboardResponse> => {
    return await axiosClient.get(`/block-puzzle/leaderboard/${encodeURIComponent(gameId)}`);
  },

  /** GET /api/block-puzzle/kids/:userId — thẻ thông tin một bạn đang có tên trên bảng vinh danh. */
  getKidCard: async (userId: string): Promise<KidCardResponse> => {
    return await axiosClient.get(`/block-puzzle/kids/${encodeURIComponent(userId)}`);
  },

  /** GET /api/block-puzzle/records — kỷ lục cá nhân của chính bé. */
  getRecords: async (): Promise<BlockPuzzleRecordsResponse> => {
    return await axiosClient.get('/block-puzzle/records');
  },

  /** POST /api/block-puzzle/progress/complete */
  markCompleted: async (payload: CompleteLessonPayload): Promise<CompleteLessonResponse> => {
    return await axiosClient.post('/block-puzzle/progress/complete', payload);
  },
};

export default blockPuzzleApi;
