import { BadRequestException, ForbiddenException, HttpStatus, NotFoundException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';
import { readCookie, serializeCookie } from './cookies';
import { TokenRevocationList } from './token-revocation';
import { buildErrorEnvelope } from './trace-error.filter';
import { sanitizeFeedback } from '../utils/sanitize-feedback.util';

const ctx = (method: string, url: string, headers: Record<string, string> = {}) =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ method, originalUrl: url, headers }) }),
  }) as unknown as ExecutionContext;

describe('CsrfGuard (Double Submit Cookie)', () => {
  const guard = new CsrfGuard();
  const session = 'access_token=jwt; csrf_token=abc123';

  it('GET không cần mã CSRF', () => {
    expect(guard.canActivate(ctx('GET', '/api/teacher/classes', { cookie: session }))).toBe(true);
  });

  it('POST có cookie phiên nhưng thiếu header -> 403', () => {
    expect(() => guard.canActivate(ctx('POST', '/api/teacher/classes/1/invalidate', { cookie: session }))).toThrow(ForbiddenException);
  });

  it('POST có header sai -> 403', () => {
    expect(() => guard.canActivate(ctx('PUT', '/api/x', { cookie: session, 'x-csrf-token': 'sai' }))).toThrow(ForbiddenException);
  });

  it('POST có header khớp cookie -> cho qua', () => {
    expect(guard.canActivate(ctx('DELETE', '/api/x', { cookie: session, 'x-csrf-token': 'abc123' }))).toBe(true);
  });

  it('chỉ dùng Bearer (không cookie phiên) thì không thuộc diện CSRF', () => {
    expect(guard.canActivate(ctx('POST', '/api/x', { authorization: 'Bearer t' }))).toBe(true);
  });

  it('đăng nhập/đăng ký được miễn dù còn cookie cũ', () => {
    expect(guard.canActivate(ctx('POST', '/api/auth/login', { cookie: session }))).toBe(true);
  });
});

describe('cookie phiên', () => {
  it('httpOnly + SameSite=Strict, Secure khi production', () => {
    const c = serializeCookie('access_token', 'a b', { maxAgeMs: 60_000, httpOnly: true, secure: true });
    expect(c).toContain('HttpOnly');
    expect(c).toContain('SameSite=Strict');
    expect(c).toContain('Secure');
    expect(readCookie(c.split(';')[0], 'access_token')).toBe('a b');
  });
});

describe('thu hồi token khi đăng xuất', () => {
  it('token bị thu hồi từ chối ngay, hết TTL thì tự gỡ', () => {
    const list = new TokenRevocationList();
    const now = 1_000_000;
    list.revoke('jti-1', Math.floor(now / 1000) + 60, now);
    expect(list.isRevoked('jti-1', now + 1000)).toBe(true);
    expect(list.isRevoked('jti-2', now)).toBe(false);
    expect(list.isRevoked('jti-1', now + 61_000)).toBe(false);
  });
});

describe('phản hồi lỗi chuẩn + traceId', () => {
  it('HttpException -> { success:false, code, message, traceId }', () => {
    const { status, body } = buildErrorEnvelope(new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Không có quyền' }), 'tid');
    expect(status).toBe(403);
    expect(body).toEqual({ success: false, code: 'E403_CLASS_NOT_OWNED', message: 'Không có quyền', traceId: 'tid' });
  });

  it('mã mặc định theo HTTP status và gộp message dạng mảng', () => {
    const { body } = buildErrorEnvelope(new BadRequestException(['a sai', 'b sai']), 't');
    expect(body.code).toBe('E400_BAD_REQUEST');
    expect(body.message).toBe('a sai; b sai');
    expect(buildErrorEnvelope(new NotFoundException('x'), 't').body.code).toBe('E404_NOT_FOUND');
  });

  it('lỗi lạ -> 500, không lộ stack hay message nội bộ', () => {
    const { status, body } = buildErrorEnvelope(new Error('mongo://user:pass@host timeout'), 't');
    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(JSON.stringify(body)).not.toMatch(/mongo|stack|pass/);
    expect(body.code).toBe('E500_INTERNAL');
  });
});

describe('sanitizeFeedback (XSS)', () => {
  it('bỏ thẻ script và mọi thẻ HTML', () => {
    expect(sanitizeFeedback('Tốt <script>alert(1)</script> lắm <b>nhé</b>', 500)).toBe('Tốt  lắm nhé');
    expect(sanitizeFeedback('<img src=x onerror=alert(1)>ok', 500)).toBe('ok');
    expect(sanitizeFeedback('<a href="javascript:alert(1)">x</a>', 500)).not.toMatch(/<|javascript:/i);
  });
});
