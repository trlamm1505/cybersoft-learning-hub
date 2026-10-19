import { corsAllowlist, corsOriginChecker, securityHeaders, securityHeadersMiddleware } from './http-hardening';

/** Day 29: SEC-13 (security headers) và SEC-14 (CORS không phản chiếu origin lạ). */
const decide = (allowlist: string[], origin?: string) =>
  new Promise<boolean | undefined>((resolve) => corsOriginChecker(allowlist)(origin, (_e, allow) => resolve(allow)));

describe('CORS allowlist', () => {
  it('dev mặc định: chỉ FE local (5173/4173) và FRONTEND_URL; không có *', () => {
    const list = corsAllowlist({ NODE_ENV: 'development', FRONTEND_URL: 'http://localhost:5173/' } as never);
    expect(list).toContain('http://localhost:5173');
    expect(list).toContain('http://localhost:4173');
    expect(list).not.toContain('*');
    expect(list).not.toContain('http://127.0.0.1:3000');
  });

  it('production: chỉ CORS_ORIGINS + FRONTEND_URL, bỏ qua *', () => {
    const list = corsAllowlist({ NODE_ENV: 'production', CORS_ORIGINS: 'https://hub.example.vn, *', FRONTEND_URL: 'https://hub.example.vn' } as never);
    expect(list).toEqual(['https://hub.example.vn']);
  });

  it('origin lạ (evil, 127.0.0.1:3000) bị từ chối; origin hợp lệ được phép; không Origin thì không gắn CORS', async () => {
    const list = corsAllowlist({ NODE_ENV: 'development' } as never);
    await expect(decide(list, 'https://evil.example')).resolves.toBe(false);
    await expect(decide(list, 'http://127.0.0.1:3000')).resolves.toBe(false);
    await expect(decide(list, 'http://localhost:5173')).resolves.toBe(true);
    await expect(decide(list, undefined)).resolves.toBe(false);
  });
});

describe('security headers', () => {
  it('đủ nosniff, X-Frame-Options DENY, CSP; HSTS chỉ ở production', () => {
    const dev = securityHeaders(false);
    expect(dev).toMatchObject({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' });
    expect(dev['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(dev['Strict-Transport-Security']).toBeUndefined();
    expect(securityHeaders(true)['Strict-Transport-Security']).toContain('max-age=');
  });

  it('middleware gắn header lên mọi phản hồi và bỏ X-Powered-By', () => {
    const set: Record<string, string> = {};
    const res = { setHeader: (k: string, v: string) => (set[k] = v), removeHeader: jest.fn() };
    const next = jest.fn();
    securityHeadersMiddleware(false)({}, res, next);
    expect(set['X-Content-Type-Options']).toBe('nosniff');
    expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
    expect(next).toHaveBeenCalled();
  });
});
