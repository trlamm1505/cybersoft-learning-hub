import { describe, expect, it, vi } from 'vitest';
import { createSessionGuard, loginUrlFor, SESSION_NOTICE } from './sessionGuard';

const jwt = (payload: object) => `h.${btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_')}.s`;
const future = () => jwt({ exp: Math.floor(Date.now() / 1000) + 600 });
const past = () => jwt({ exp: Math.floor(Date.now() / 1000) - 10 });

function make(token: string | null, path = '/teacher/classes') {
  const clear = vi.fn();
  const redirect = vi.fn();
  const guard = createSessionGuard({ clear, redirect, currentPath: () => path, getToken: () => token });
  return { guard, clear, redirect };
}

describe('sessionGuard: chống treo token / bão request khi 401', () => {
  it('token còn hạn: cho request đi', () => {
    const { guard, clear, redirect } = make(future());
    expect(guard.allowRequest(false)).toBe(true);
    expect(clear).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('token đã hết hạn: không gọi API, xóa phiên và chuyển /login?expired=1 đúng một lần', () => {
    const { guard, clear, redirect } = make(past());
    expect(guard.allowRequest(false)).toBe(false);
    expect(guard.allowRequest(false)).toBe(false);
    expect(guard.allowRequest(false)).toBe(false);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith('/login?expired=1');
  });

  it('gặp 401 từ BE: kết thúc phiên một lần, các request đang chờ bị hủy', () => {
    const { guard, clear, redirect } = make(future());
    guard.end('expired');
    guard.end('expired');
    expect(guard.allowRequest(false)).toBe(false);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledTimes(1);
  });

  it('đã ở trang /login thì không chuyển hướng lại (tránh vòng lặp)', () => {
    const { guard, redirect, clear } = make(past(), '/login');
    expect(guard.allowRequest(false)).toBe(false);
    expect(clear).toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('request công khai (đăng nhập, quên mật khẩu) không bị chặn dù token cũ đã hết hạn', () => {
    const { guard, clear } = make(past());
    expect(guard.allowRequest(true)).toBe(true);
    expect(clear).not.toHaveBeenCalled();
  });

  it('khách chưa có token không bị coi là hết phiên', () => {
    const { guard } = make(null);
    expect(guard.allowRequest(false)).toBe(true);
  });

  it('tài khoản bị khóa dùng link riêng; đăng nhập lại thì mở khóa request', () => {
    expect(loginUrlFor('locked')).toBe('/login?locked=1');
    const { guard } = make(future());
    guard.end('locked');
    expect(guard.allowRequest(false)).toBe(false);
    guard.reset();
    expect(guard.allowRequest(false)).toBe(true);
  });

  it('thông báo thân thiện khi hết phiên', () => {
    expect(SESSION_NOTICE.expired).toBe('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
  });
});

import { consumeSessionExpiredNotice, markSessionExpiredNotice } from './sessionGuard';

describe('thông báo hết phiên qua lần chuyển trang', () => {
  it('đánh dấu một lần, đọc xong thì xóa', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('sessionStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) });
    expect(consumeSessionExpiredNotice()).toBe(false);
    markSessionExpiredNotice();
    expect(consumeSessionExpiredNotice()).toBe(true);
    expect(consumeSessionExpiredNotice()).toBe(false);
    vi.unstubAllGlobals();
  });

  it('trình duyệt chặn sessionStorage: không ném lỗi', () => {
    vi.stubGlobal('sessionStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } });
    expect(() => markSessionExpiredNotice()).not.toThrow();
    expect(consumeSessionExpiredNotice()).toBe(false);
    vi.unstubAllGlobals();
  });
});
