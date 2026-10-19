/**
 * Cứng hóa lớp HTTP của API (Day 29: SEC-13, SEC-14).
 *  - CORS: chỉ origin trong danh sách cho phép mới được gọi kèm credentials; KHÔNG phản chiếu origin lạ.
 *  - Security headers tương đương helmet (không thêm phụ thuộc): nosniff, chống nhúng khung, CSP chặt cho API JSON…
 */

/** Origin mặc định khi chạy local: FE dev (Vite 5173) và FE preview (4173). */
export const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173'];

const normalize = (o: string) => o.trim().replace(/\/+$/, '').toLowerCase();

/**
 * Danh sách origin được phép: CORS_ORIGINS (phân cách bằng dấu phẩy) nếu có; luôn thêm FRONTEND_URL; ngoài production
 * thêm các origin FE local. Không bao giờ có '*' (không đi chung được với credentials).
 */
export function corsAllowlist(env: NodeJS.ProcessEnv = process.env): string[] {
  const fromEnv = (env.CORS_ORIGINS ?? '').split(',').map(normalize).filter(Boolean);
  const list = new Set<string>(fromEnv.filter((o) => o !== '*'));
  if (env.FRONTEND_URL) list.add(normalize(env.FRONTEND_URL));
  if (env.NODE_ENV !== 'production' && fromEnv.length === 0) DEFAULT_DEV_ORIGINS.forEach((o) => list.add(o));
  return [...list];
}

/** Hàm kiểm tra origin cho app.enableCors({ origin }). Request không có Origin (curl, server-to-server) không cần CORS. */
export function corsOriginChecker(allowlist: string[]) {
  const allowed = new Set(allowlist.map(normalize));
  return (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return cb(null, false);
    cb(null, allowed.has(normalize(origin)));
  };
}

/** Header bảo mật cho mọi phản hồi của API. CSP 'none' vì API chỉ trả JSON/tệp tải về, không bao giờ trả trang HTML. */
export function securityHeaders(isProduction: boolean): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-DNS-Prefetch-Control': 'off',
    ...(isProduction ? { 'Strict-Transport-Security': 'max-age=15552000; includeSubDomains' } : {}),
  };
}

/** Middleware Express gắn securityHeaders vào mọi phản hồi. */
export function securityHeadersMiddleware(isProduction: boolean) {
  const headers = Object.entries(securityHeaders(isProduction));
  return (_req: unknown, res: { setHeader(name: string, value: string): void; removeHeader(name: string): void }, next: () => void) => {
    for (const [k, v] of headers) res.setHeader(k, v);
    res.removeHeader('X-Powered-By');
    next();
  };
}
