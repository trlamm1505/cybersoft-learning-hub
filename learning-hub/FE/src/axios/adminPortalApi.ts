import axiosClient from '../common/configAxios';
import type {
  AgeGroupKey,
  AuditLogList,
  BulkStatusResult,
  ConfigsResponse,
  DashboardSummary,
  GeminiTestResult,
  HealthReport,
  PortalClassDetail,
  PortalClassRow,
  PortalUserList,
  PortalUserRow,
} from '../types/adminPortal';
import type { UserRole, UserStatus } from '../types/teacherAnalytics';

export interface PortalUserQuery {
  role?: UserRole;
  status?: UserStatus;
  ageGroup?: AgeGroupKey;
  q?: string;
  page?: number;
  pageSize?: number;
}

/** API Admin Portal v2 (chỉ ADMIN). Khóa API không bao giờ được trả về dạng rõ: chỉ có `masked`. */
export const adminPortalApi = {
  summary: async (): Promise<DashboardSummary> => await axiosClient.get('/admin/dashboard/summary'),

  health: async (): Promise<HealthReport> => await axiosClient.get('/admin/health-check', { timeout: 15000 }),

  classes: async (): Promise<PortalClassRow[]> => await axiosClient.get('/admin/portal/classes'),

  classDetail: async (classId: string): Promise<PortalClassDetail> =>
    await axiosClient.get(`/admin/portal/classes/${encodeURIComponent(classId)}`),

  /** Lưu trữ (đã bế giảng) hoặc kích hoạt lại lớp/khóa. */
  setArchived: async (classId: string, archived: boolean) =>
    await axiosClient.put(`/admin/classes/${encodeURIComponent(classId)}/archive`, { archived }),

  assignTeachers: async (classId: string, teacherIds: string[]) =>
    await axiosClient.put(`/admin/classes/${encodeURIComponent(classId)}/teachers`, { teacherIds }),

  /** Gỡ một giảng viên (được gỡ cả thẻ duy nhất nếu là tài khoản không còn tồn tại hoặc đang bị khóa). */
  removeTeacher: async (classId: string, teacherId: string) =>
    await axiosClient.delete(`/admin/classes/${encodeURIComponent(classId)}/teachers/${encodeURIComponent(teacherId)}`),

  configs: async (): Promise<ConfigsResponse> => await axiosClient.get('/admin/configs'),

  saveConfig: async (key: string, value: string): Promise<{ key: string; masked?: string; updated?: boolean }> =>
    await axiosClient.put('/admin/configs', { key, value }),

  testGemini: async (apiKey?: string): Promise<GeminiTestResult> =>
    await axiosClient.post('/admin/configs/test-gemini', apiKey ? { apiKey } : {}, { timeout: 8000 }),

  auditLogs: async (q: { page?: number; pageSize?: number; action?: string; actorEmail?: string }): Promise<AuditLogList> =>
    await axiosClient.get('/admin/audit-logs', { params: q }),

  users: async (q: PortalUserQuery = {}): Promise<PortalUserList> => await axiosClient.get('/admin/users', { params: q }),

  createUser: async (input: {
    fullName: string;
    email: string;
    password: string;
    role: UserRole;
    ageGroup?: AgeGroupKey;
  }): Promise<PortalUserRow> => await axiosClient.post('/admin/users', input),

  updateUser: async (id: string, input: { fullName?: string; ageGroup?: AgeGroupKey; password?: string }) =>
    await axiosClient.put(`/admin/users/${encodeURIComponent(id)}`, input),

  setStatus: async (id: string, status: UserStatus): Promise<PortalUserRow> =>
    await axiosClient.put(`/admin/users/${encodeURIComponent(id)}/status`, { status }),

  bulkStatus: async (userIds: string[], isActive: boolean): Promise<BulkStatusResult> =>
    await axiosClient.patch('/admin/users/bulk-status', { userIds, isActive }),
};

export default adminPortalApi;
