import axios from 'axios';
import { browserSessionGuard } from './sessionGuard';

// Get Base URL from Vite environment variable or fallback to NestJS Backend API endpoint
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

/** BE trả 401 kèm `code: 'ACCOUNT_LOCKED'` khi Admin khóa tài khoản đang đăng nhập. */
export const isAccountLocked = (data: unknown): boolean => (data as { code?: string } | undefined)?.code === 'ACCOUNT_LOCKED';

/** Mã CSRF: ưu tiên cookie `csrf_token` (BE đặt, đọc được bằng JS), dự phòng bản lưu khi đăng nhập. */
export function readCsrfToken(): string | null {
  const m = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  try {
    return localStorage.getItem('csrf_token');
  } catch {
    return null;
  }
}

/**
 * Pre-configured Axios Instance for CyberSoft Learning & Contest Hub
 */
export const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10s request timeout
  // Cookie phiên httpOnly (access_token) do BE đặt khi đăng nhập; trình duyệt chỉ gửi kèm khi bật cờ này.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor:
 * Automatically attaches JWT Authorization Bearer Token if available in localStorage
 */
const PUBLIC_AUTH_URL = /\/auth\/(login|register|forgot-password|reset-password)/;

axiosClient.interceptors.request.use(
  (config) => {
    // Phiên đã hết hạn/bị từ chối: hủy request ngay ở client (không gọi API), tránh dội 401 liên tục khi đang chờ chuyển về /login.
    if (!browserSessionGuard.allowRequest(PUBLIC_AUTH_URL.test(config.url ?? ''))) {
      return Promise.reject(new axios.CanceledError('Phiên đăng nhập đã kết thúc'));
    }
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    // Double Submit Cookie: request đổi trạng thái gửi lại mã CSRF (cookie `csrf_token`) trong header x-csrf-token.
    const method = (config.method ?? 'get').toLowerCase();
    if (config.headers && !['get', 'head', 'options'].includes(method) && !(config.headers as any)['x-csrf-token']) {
      const csrf = readCsrfToken();
      if (csrf) (config.headers as any)['x-csrf-token'] = csrf;
    }
    return config;
  },
  (error) => {
    console.error('❌ [Axios Request Error]:', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor:
 * Unwraps data directly and handles global HTTP errors (401, 403, 500)
 */
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Request bị hủy chủ động (phiên đã kết thúc): không phải lỗi mạng, không log.
    if (axios.isCancel(error)) return Promise.reject(error);
    if (error.response) {
      const { status, data } = error.response as { status: number; data: any };

      switch (status) {
        case 401: {
          console.warn('⚠️ [Axios 401]: Access token expired or invalid.');
          // Sai mật khẩu ở form đăng nhập/đăng ký cũng trả 401: để form tự báo lỗi.
          const url: string = error.config?.url ?? '';
          const isAuthForm = PUBLIC_AUTH_URL.test(url);
          if (!isAuthForm) {
            // Token hết hạn, đổi mật khẩu hoặc Admin khóa tài khoản: xóa phiên, về /login một lần, các request còn lại bị hủy.
            browserSessionGuard.end(isAccountLocked(data) ? 'locked' : 'expired');
          }
          break;
        }
        case 403:
          console.warn('⚠️ [Axios 403]: Access Forbidden - insufficient permissions.');
          break;
        case 404:
          console.warn('⚠️ [Axios 404]: Requested API endpoint not found.');
          break;
        case 500:
          console.error('❌ [Axios 500]: Internal Server Error.', data?.message);
          break;
        default:
          console.error(`❌ [Axios ${status}]:`, data?.message || error.message);
          break;
      }
    } else if (error.request) {
      console.error('❌ [Axios Network Error]: No response received from server at', BASE_URL);
    } else {
      console.error('❌ [Axios Error]:', error.message);
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
