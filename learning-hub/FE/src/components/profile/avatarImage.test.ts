import { describe, expect, it } from 'vitest';
import {
  AVATAR_MAX_DATA_URL_LENGTH,
  AVATAR_MAX_SOURCE_BYTES,
  AVATAR_MAX_URL_LENGTH,
  avatarInitial,
  fitsAvatarLimit,
  validateAvatarFile,
  validateAvatarUrl,
} from './avatarImage';

describe('validateAvatarFile', () => {
  it('nhận PNG, JPEG, WebP trong giới hạn dung lượng', () => {
    for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
      expect(validateAvatarFile({ type, size: 1024 })).toBeNull();
    }
  });

  it('từ chối SVG, GIF, tệp không phải ảnh và tệp quá lớn', () => {
    expect(validateAvatarFile({ type: 'image/svg+xml', size: 10 })).toMatch(/PNG, JPEG hoặc WebP/);
    expect(validateAvatarFile({ type: 'image/gif', size: 10 })).not.toBeNull();
    expect(validateAvatarFile({ type: 'application/pdf', size: 10 })).not.toBeNull();
    expect(validateAvatarFile({ type: 'image/png', size: AVATAR_MAX_SOURCE_BYTES + 1 })).toMatch(/quá lớn/);
  });
});

describe('validateAvatarUrl', () => {
  it('nhận URL http(s)', () => {
    expect(validateAvatarUrl('https://example.com/a.png')).toBeNull();
    expect(validateAvatarUrl('  http://localhost:3000/a.jpg ')).toBeNull();
  });

  it('từ chối rỗng, sai giao thức, không phải URL và quá dài', () => {
    expect(validateAvatarUrl('   ')).toMatch(/nhập/);
    expect(validateAvatarUrl('javascript:alert(1)')).toMatch(/không hợp lệ/);
    expect(validateAvatarUrl('data:image/png;base64,AAAA')).toMatch(/không hợp lệ/);
    expect(validateAvatarUrl('abc')).toMatch(/không hợp lệ/);
    expect(validateAvatarUrl('https://x.com/' + 'a'.repeat(AVATAR_MAX_URL_LENGTH))).toMatch(/quá dài/);
  });
});

describe('giới hạn dung lượng và avatar mặc định', () => {
  it('fitsAvatarLimit theo ngưỡng của backend', () => {
    expect(fitsAvatarLimit('a'.repeat(AVATAR_MAX_DATA_URL_LENGTH))).toBe(true);
    expect(fitsAvatarLimit('a'.repeat(AVATAR_MAX_DATA_URL_LENGTH + 1))).toBe(false);
  });

  it('avatarInitial: ưu tiên tên, rơi về email, viết hoa', () => {
    expect(avatarInitial({ fullName: ' việt', email: 'x@y.z' })).toBe('V');
    expect(avatarInitial({ fullName: '', email: 'abc@y.z' })).toBe('A');
  });
});
