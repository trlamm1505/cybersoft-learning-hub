import axiosClient from '../common/configAxios';
import type {
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
   * PUT /api/auth/age-group — đặt nhóm tuổi cho chính tài khoản đang đăng
   * nhập (modal bắt buộc ngay sau lần đăng nhập đầu tiên).
   */
  setAgeGroup: async (payload: SetAgeGroupPayload): Promise<{ ageGroup: AgeGroup }> => {
    return await axiosClient.put('/auth/age-group', payload);
  },

  /**
   * POST /api/auth/forgot-password
   */
  forgotPassword: async (payload: ForgotPasswordPayload): Promise<{ message: string }> => {
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
