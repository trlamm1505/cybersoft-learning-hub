import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { map, Observable } from 'rxjs';
import { ACCESS_COOKIE, CSRF_COOKIE, isProduction, serializeCookie } from '../../common/security/cookies';

const SESSION_MS = 7 * 24 * 3600 * 1000;

/**
 * Sau đăng nhập/đăng ký: đặt token truy cập vào cookie httpOnly + SameSite=Strict (Secure ở production) và cấp mã CSRF
 * (cookie đọc được + trả trong body để client gửi lại ở header x-csrf-token). Body vẫn có `accessToken` để client cũ chạy được.
 */
@Injectable()
export class SessionCookieInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<{ append: (k: string, v: string) => void }>();
    return next.handle().pipe(
      map((body: { accessToken?: string } & Record<string, unknown>) => {
        if (!body?.accessToken) return body;
        const csrfToken = randomBytes(32).toString('hex');
        const secure = isProduction() || process.env.COOKIE_SECURE === 'true' || process.env.COOKIE_SAMESITE === 'None';
        res.append('Set-Cookie', serializeCookie(ACCESS_COOKIE, body.accessToken, { maxAgeMs: SESSION_MS, httpOnly: true, secure }));
        res.append('Set-Cookie', serializeCookie(CSRF_COOKIE, csrfToken, { maxAgeMs: SESSION_MS, httpOnly: false, secure }));
        return { ...body, csrfToken };
      }),
    );
  }
}
