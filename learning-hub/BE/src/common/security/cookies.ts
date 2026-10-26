/** Tên cookie phiên: token truy cập (httpOnly) và token CSRF (đọc được bằng JS để gửi lại trong header). */
export const ACCESS_COOKIE = 'access_token';
export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

/** Đọc cookie từ header `Cookie` (không cần cookie-parser). */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      try {
        return decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export interface CookieOptionsInput {
  maxAgeMs: number;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/** Cookie phiên: mặc định SameSite=Strict; cho phép cấu hình qua COOKIE_SAMESITE (None khi FE và BE khác domain). */
export function serializeCookie(name: string, value: string, o: CookieOptionsInput): string {
  const sameSite = o.sameSite ?? (process.env.COOKIE_SAMESITE as 'Strict' | 'Lax' | 'None') ?? 'Strict';
  const secure = o.secure || sameSite === 'None';
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${Math.floor(o.maxAgeMs / 1000)}`, `SameSite=${sameSite}`];
  if (o.httpOnly) parts.push('HttpOnly');
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
