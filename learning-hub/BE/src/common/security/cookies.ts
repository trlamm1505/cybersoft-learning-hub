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
}

/** Cookie phiên luôn SameSite=Strict; Secure bật ở production. */
export function serializeCookie(name: string, value: string, o: CookieOptionsInput): string {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${Math.floor(o.maxAgeMs / 1000)}`, 'SameSite=Strict'];
  if (o.httpOnly) parts.push('HttpOnly');
  if (o.secure) parts.push('Secure');
  return parts.join('; ');
}

export const isProduction = (): boolean => process.env.NODE_ENV === 'production';
