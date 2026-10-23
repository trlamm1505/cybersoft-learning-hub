import axiosClient, { readCsrfToken } from '../common/configAxios';
import type {
  AuthUser,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  SetAgeGroupPayload,
  AgeGroup,
} from '../types/auth';

/**
 * Auth API Service Layer
 * Wraps NestJS Backend Auth API calls using configured Axios Client
 */
export const authApi = {
  /**
   * POST /api/auth/register
   */
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    return await axiosClient.post('/auth/register', payload);
  },

  /**
   * POST /api/auth/login
   */
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    return await axiosClient.post('/auth/login', payload);
  },

  /**
   * POST /api/auth/logout — thu hồi token phía server (jti vào blacklist) và xóa cookie phiên.
   */
  logout: async (): Promise<{ success: boolean }> => {
    // Chụp mã CSRF ngay lúc gọi: interceptor chạy bất đồng bộ, còn phiên cục bộ sắp bị xoá. JWT đi bằng cookie httpOnly.
    const csrf = readCsrfToken();
    return await axiosClient.post('/auth/logout', undefined, {
      headers: { ...(csrf ? { 'x-csrf-token': csrf } : {}) },
    });
  },

  /**
   * GET /api/auth/me — hồ sơ theo token (vai trò đọc từ DB), dùng khi khởi động app.
   */
  me: async (): Promise<AuthUser> => {
    return await axiosClient.get('/auth/me');
  },

  /**
   * PUT /api/auth/age-group — đặt nhóm tuổi cho chính tài khoản đang đăng
   * nhập (modal bắt buộc ngay sau lần đăng nhập đầu tiên).
   */
  setAgeGroup: async (payload: SetAgeGroupPayload): Promise<{ ageGroup: AgeGroup }> => {
    return await axiosClient.put('/auth/age-group', payload);
  },

  /**
   * PUT /api/auth/avatar — đặt ảnh đại diện (URL hoặc data URL đã thu nhỏ); null để xóa.
   */
  setAvatar: async (avatar: string | null): Promise<{ avatar: string | null }> => {
    return await axiosClient.put('/auth/avatar', { avatar });
  },

  /**
   * PUT /api/auth/profile — cập nhật họ tên, số điện thoại, giới thiệu của chính mình. Không có email: email bị khóa.
   */
  updateProfile: async (payload: { fullName?: string; phone?: string; bio?: string }): Promise<AuthUser> => {
    return await axiosClient.put('/auth/profile', payload);
  },

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ success?: boolean; message: string; devResetLink?: string }> => {
    return await axiosClient.post('/auth/forgot-password', payload);
  },

  /**
   * POST /api/auth/reset-password
   */
  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    return await axiosClient.post('/auth/reset-password', payload);
  },
};

export default authApi;
