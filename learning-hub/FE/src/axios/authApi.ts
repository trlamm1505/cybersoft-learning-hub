import axiosClient from '../common/configAxios';
import type { AuthResponse, RegisterPayload, LoginPayload } from '../types/auth';

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
};

export default authApi;
