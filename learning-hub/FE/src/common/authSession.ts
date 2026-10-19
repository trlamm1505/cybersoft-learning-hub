/** Khóa localStorage cũ từng chứa JWT thô (trước Day 29); chỉ còn dùng để dọn dẹp/chuyển đổi. */
export const TOKEN_KEYS = ['token', 'accessToken'] as const;
export const AUTH_USER_KEY = 'app_auth_user';
/** Dấu phiên đăng nhập (KHÔNG phải JWT): chỉ chứa thời điểm hết hạn `exp`. */
export const SESSION_KEY = 'app_session';

const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const decodePayload = (token: string): { exp?: unknown } | null => {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
};

/**
 * Day 29 (SEC-18, PRV-05): JWT thật nằm trong cookie httpOnly do BE đặt khi đăng nhập (JS không đọc được). localStorage chỉ giữ
 * một dấu phiên KHÔNG bí mật — cùng dạng "a.<payload>.b" như JWT nhưng payload chỉ có `exp`, không chữ ký, không định danh —
 * để giao diện biết còn phiên hay đã hết hạn mà không phải gọi API.
 */
export function sessionMarkerFrom(accessToken: string): string {
  const exp = decodePayload(accessToken)?.exp;
  return `session.${b64url(JSON.stringify({ exp: typeof exp === 'number' ? exp : 0 }))}.`;
}

/** Dấu phiên hiện có (null nếu chưa đăng nhập). Tên giữ nguyên cho các chỗ gọi cũ. */
export const getStoredToken = (): string | null => localStorage.getItem(SESSION_KEY);

/** Ghi nhận đăng nhập: chỉ lưu dấu phiên, KHÔNG BAO GIỜ lưu JWT vào localStorage. */
export function saveSession(accessToken: string): void {
  localStorage.setItem(SESSION_KEY, sessionMarkerFrom(accessToken));
  TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
}

/** Trình duyệt còn JWT thô từ phiên bản cũ: đổi sang dấu phiên và xóa JWT khỏi localStorage. */
export function migrateLegacyToken(): void {
  const legacy = TOKEN_KEYS.map((k) => localStorage.getItem(k)).find(Boolean);
  if (legacy) saveSession(legacy);
}

/** Xoá phiên đăng nhập; giữ nguyên tiến độ học tập lưu theo id tài khoản. */
export function clearAuthSession() {
  TOKEN_KEYS.forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('csrf_token');
  localStorage.removeItem(AUTH_USER_KEY);
}

/** Token (hoặc dấu phiên) đã hết hạn theo trường `exp` (chỉ đọc payload, việc xác thực chữ ký là của BE). */
export function isTokenExpired(token: string): boolean {
  const payload = decodePayload(token);
  if (!payload) return true;
  return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
}
