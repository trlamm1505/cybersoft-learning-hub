import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearAuthSession, getStoredToken, isTokenExpired } from './authSession';

const jwt = (payload: object) =>
  `h.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}.sig`;

describe('[L2] authSession', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('token hết hạn, token còn hạn, token hỏng', () => {
    const now = Math.floor(Date.now() / 1000);
    expect(isTokenExpired(jwt({ sub: 'u', exp: now - 10 }))).toBe(true);
    expect(isTokenExpired(jwt({ sub: 'u', exp: now + 3600 }))).toBe(false);
    expect(isTokenExpired('rác')).toBe(true);
  });

  it('clearAuthSession xoá token và user nhưng giữ dữ liệu khác', () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('accessToken', 't2');
    localStorage.setItem('app_auth_user', '{}');
    localStorage.setItem('app_code_playground_completed_u1', '[1]');

    clearAuthSession();

    expect(getStoredToken()).toBeNull();
    expect(localStorage.getItem('app_auth_user')).toBeNull();
    expect(localStorage.getItem('app_code_playground_completed_u1')).toBe('[1]');
  });
});
