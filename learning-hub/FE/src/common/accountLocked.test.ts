import { describe, expect, it } from 'vitest';
import { isAccountLocked } from './configAxios';

describe('isAccountLocked', () => {
  it('nhận ra 401 ACCOUNT_LOCKED do Admin khóa tài khoản', () => {
    expect(isAccountLocked({ code: 'ACCOUNT_LOCKED', message: 'x' })).toBe(true);
  });
  it('các 401 khác (hết phiên, token sai) không bị coi là khóa', () => {
    expect(isAccountLocked({ message: 'Phiên đăng nhập không còn hợp lệ.' })).toBe(false);
    expect(isAccountLocked(undefined)).toBe(false);
    expect(isAccountLocked('ACCOUNT_LOCKED')).toBe(false);
  });
});
