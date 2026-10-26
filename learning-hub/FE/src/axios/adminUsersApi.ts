import axiosClient from '../common/configAxios';
import type {
  AdminUserList,
  AdminUserProfile,
  AdminUserRow,
  UserRole,
  UserStatus,
} from '../types/teacherAnalytics';

export interface UserQuery {
  role?: UserRole;
  status?: UserStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

/** API quản lý người dùng: chỉ ADMIN (BE trả 403 cho giảng viên và học viên). */
export const adminUsersApi = {
  list: async (query: UserQuery = {}): Promise<AdminUserList> => {
    return await axiosClient.get('/admin/users', { params: query });
  },

  create: async (input: { fullName: string; email: string; password: string; role: UserRole }): Promise<AdminUserRow> => {
    return await axiosClient.post('/admin/users', input);
  },

  setRole: async (id: string, role: UserRole): Promise<AdminUserRow> => {
    return await axiosClient.put(`/admin/users/${encodeURIComponent(id)}/role`, { role });
  },

  /** Thu hồi quyền giảng viên: hạ về học viên hoặc khóa, hủy phiên đăng nhập. 409 kèm `classes` nếu còn phụ trách lớp. */
  revokeTeacher: async (id: string, mode: 'STUDENT' | 'LOCK'): Promise<AdminUserRow> => {
    return await axiosClient.post(`/admin/users/${encodeURIComponent(id)}/revoke-teacher`, { mode });
  },

  setStatus: async (id: string, status: UserStatus): Promise<AdminUserRow> => {
    return await axiosClient.put(`/admin/users/${encodeURIComponent(id)}/status`, { status });
  },

  profile: async (id: string): Promise<AdminUserProfile> => {
    return await axiosClient.get(`/admin/users/${encodeURIComponent(id)}/profile`, {
      params: { tzOffset: -new Date().getTimezoneOffset() },
    });
  },
};

export default adminUsersApi;
