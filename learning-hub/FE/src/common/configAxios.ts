import axios from 'axios';

// Get Base URL from Vite environment variable or fallback to NestJS Backend API endpoint
const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Pre-configured Axios Instance for CyberSoft Learning & Contest Hub
 */
export const axiosClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10s request timeout
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor:
 * Automatically attaches JWT Authorization Bearer Token if available in localStorage
 */
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (token && config.headers) {
      (config.headers as any).Authorization = `Bearer ${token}`;
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
    if (error.response) {
      const { status, data } = error.response as { status: number; data: any };

      switch (status) {
        case 401:
          console.warn('⚠️ [Axios 401]: Access token expired or invalid.');
          break;
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
