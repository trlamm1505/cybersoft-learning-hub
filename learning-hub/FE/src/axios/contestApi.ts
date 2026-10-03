import axiosClient from '../common/configAxios';
import type { ContestItem, ContestStatusResponse } from '../types/contest';

/**
 * Contest API — studentId/authorId are never sent by the client; the backend
 * derives them from the JWT (@CurrentUser()). Guarded endpoints require login,
 * so axiosClient (which attaches the Bearer token) is used throughout.
 */
export const contestApi = {
  /** GET /api/contests — public list; pass isAuthenticated to get isRegistered flags computed server-side. */
  getContests: async (): Promise<ContestItem[]> => {
    return await axiosClient.get('/contests');
  },

  getContestById: async (id: string): Promise<ContestItem> => {
    return await axiosClient.get(`/contests/${id}`);
  },

  createContest: async (dto: Partial<ContestItem>): Promise<ContestItem> => {
    return await axiosClient.post('/contests', dto);
  },

  updateContest: async (id: string, dto: Partial<ContestItem>): Promise<ContestItem> => {
    return await axiosClient.put(`/contests/${id}`, dto);
  },

  /** POST /api/contests/:id/register — requires login; studentId comes from the JWT. */
  registerContest: async (
    id: string,
  ): Promise<{ success: boolean; message: string; isRegistered: boolean }> => {
    return await axiosClient.post(`/contests/${id}/register`, {});
  },

  checkContestStatus: async (id: string): Promise<ContestStatusResponse> => {
    return await axiosClient.get(`/contests/${id}/status`);
  },

  deleteContest: async (id: string): Promise<{ success: boolean; message: string }> => {
    return await axiosClient.delete(`/contests/${id}`);
  },
};
