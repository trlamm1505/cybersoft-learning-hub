import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import { ACCESS_COOKIE, CSRF_COOKIE, CSRF_HEADER, readCookie } from './cookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
/** Các route trước khi có phiên: chưa có CSRF token để gửi. */
const PUBLIC_AUTH = /\/auth\/(login|register|forgot-password|reset-password)\/?$/;

const sameToken = (a: string, b: string): boolean => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * Double Submit Cookie: request đổi trạng thái đi kèm cookie phiên phải gửi thêm header `x-csrf-token`
 * trùng với cookie `csrf_token`. Trang lạ không đọc được cookie của ta nên không thể giả header.
 * Request chỉ dùng `Authorization: Bearer` (không có cookie phiên) không bị trình duyệt tự đính kèm nên không thuộc diện CSRF.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<{
      method: string;
      originalUrl?: string;
      url?: string;
      headers: Record<string, string | undefined>;
    }>();
    if (SAFE_METHODS.has(req.method.toUpperCase())) return true;
    if (PUBLIC_AUTH.test((req.originalUrl ?? req.url ?? '').split('?')[0])) return true;
    const cookieHeader = req.headers.cookie;
    if (!readCookie(cookieHeader, ACCESS_COOKIE)) return true;
    const cookie = readCookie(cookieHeader, CSRF_COOKIE);
    const header = req.headers[CSRF_HEADER];
    if (!cookie || !header || !sameToken(cookie, String(header))) {
      throw new ForbiddenException({ code: 'E403_CSRF', message: 'Yêu cầu bị từ chối: thiếu hoặc sai mã CSRF.' });
    }
    return true;
  }
}
