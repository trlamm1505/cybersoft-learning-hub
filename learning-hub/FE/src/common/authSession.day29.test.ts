import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getStoredToken, isTokenExpired, migrateLegacyToken, saveSession, sessionMarkerFrom } from './authSession';

/** Day 29 (SEC-18, PRV-05): không còn JWT thô trong localStorage. */
const jwt = (payload: object) => `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify(payload)).replace(/=+$/, '')}.SECRET_SIGNATURE`;

describe('dấu phiên thay cho JWT', () => {
  let store: Map<string, string>;
  beforeEach(() => {
    store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('saveSession chỉ lưu exp: không chữ ký, không sub/email/role; hạn dùng vẫn đọc được', () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    saveSession(jwt({ sub: 'u1', email: 'a@b.vn', role: 'ADMIN', exp }));
    const all = [...store.values()].join(' ');
    expect(all).not.toContain('SECRET_SIGNATURE');
    expect(all).not.toContain('eyJhbGci');
    expect(atob(getStoredToken()!.split('.')[1])).toBe(JSON.stringify({ exp }));
    expect(isTokenExpired(getStoredToken()!)).toBe(false);
    expect(isTokenExpired(sessionMarkerFrom(jwt({ exp: 1 })))).toBe(true);
  });

  it('JWT thô của bản cũ trong localStorage bị đổi sang dấu phiên và xóa', () => {
    store.set('token', jwt({ sub: 'u1', exp: 9999999999 }));
    migrateLegacyToken();
    expect(store.has('token')).toBe(false);
    expect(getStoredToken()).toMatch(/^session\./);
  });
});
