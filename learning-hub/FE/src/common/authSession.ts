/** Khóa localStorage của phiên đăng nhập (token cũ có thể mang tên `accessToken`). */
export const TOKEN_KEYS = ['token', 'accessToken'] as const;
export const AUTH_USER_KEY = 'app_auth_user';

export const getStoredToken = (): string | null =>
  localStorage.getItem('token') || localStorage.getItem('accessToken');

/** Xoá phiên đăng nhập; giữ nguyên tiến độ học tập lưu theo id tài khoản. */
export function clearAuthSession() {
  TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem(AUTH_USER_KEY);
}

/** Token đã hết hạn theo trường `exp` (chỉ đọc payload, việc xác thực chữ ký là của BE). */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
