import axiosClient from '../common/configAxios';
import type {
  ContestAttemptView,
  ContestItem,
  ContestManageResults,
  ContestMyAttempt,
  ContestStatusResponse,
  ExerciseBankItem,
  QuestionBank,
} from '../types/contest';
import type {
  IntegrityClientPayload,
  IntegrityDecision,
  IntegrityDetail,
} from '../types/integrity';

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

  /** POST /api/contests/:id/start — bắt đầu lượt thi; đồng hồ cá nhân do máy chủ giữ (gọi lại trả lượt cũ). */
  startAttempt: async (id: string): Promise<ContestAttemptView> => {
    return await axiosClient.post(`/contests/${id}/start`, {});
  },

  /** GET /api/contests/:id/my-attempt — lượt thi và kết quả từng đề của chính mình. */
  getMyAttempt: async (id: string): Promise<ContestMyAttempt> => {
    return await axiosClient.get(`/contests/${id}/my-attempt`);
  },

  /** POST /api/contests/:id/finish — nộp bài thi, kèm tín hiệu liêm chính tối thiểu (nếu có). */
  finishAttempt: async (id: string, integrity?: IntegrityClientPayload | null): Promise<ContestMyAttempt> => {
    return await axiosClient.post(`/contests/${id}/finish`, integrity ? { integrity } : {});
  },

  // ---- Giảng viên ----
  getManageResults: async (id: string): Promise<ContestManageResults> => {
    return await axiosClient.get(`/contests/${id}/manage/results`);
  },

  getIntegrityDetail: async (id: string, attemptId: string): Promise<IntegrityDetail> => {
    return await axiosClient.get(`/contests/${id}/manage/integrity/${attemptId}`);
  },

  reviewIntegrity: async (id: string, attemptId: string, decision: IntegrityDecision, note: string) => {
    return await axiosClient.put(`/contests/${id}/manage/integrity/${attemptId}/review`, { decision, note });
  },

  getQuestionBank: async (params: { q?: string; category?: string; difficulty?: string }): Promise<QuestionBank> => {
    return await axiosClient.get('/contests/bank/questions', { params });
  },

  getExerciseBank: async (params: { q?: string }): Promise<ExerciseBankItem[]> => {
    return await axiosClient.get('/contests/bank/exercises', { params });
  },
};
