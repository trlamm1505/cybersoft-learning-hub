import axiosClient from '../common/configAxios';

export interface LeaderboardRow {
  rank: number;
  studentId: string;
  studentName: string;
  totalScore: number;
  timeMinutes: number;
  penaltyMinutes: number;
  solvedCount: number;
}

export interface LeaderboardResponse {
  contestId: string;
  computedStatus: 'UPCOMING' | 'ONGOING' | 'ENDED';
  isFrozen: boolean;
  serverTime: string;
  rows: LeaderboardRow[];
}

export interface LeaderboardRules {
  penaltyMinutesPerWrong: number;
  freezeMinutes: number;
  tieBreakOrder: string[];
  lateSubmitPolicy: string;
}

/**
 * Leaderboard is a pure read computed server-side from the ContestSubmission log —
 * never trust or cache rank/score on the client as a source of truth.
 */
export const leaderboardApi = {
  /** GET /api/contests/:id/leaderboard */
  getLeaderboard: async (contestId: string, asTeacher = false): Promise<LeaderboardResponse> => {
    return await axiosClient.get(`/contests/${contestId}/leaderboard`, { params: asTeacher ? { asTeacher: 'true' } : undefined });
  },

  /** GET /api/contests/:id/leaderboard/rules — same numbers the backend enforces, for display. */
  getRules: async (contestId: string): Promise<LeaderboardRules> => {
    return await axiosClient.get(`/contests/${contestId}/leaderboard/rules`);
  },
};

export default leaderboardApi;
