import { describe, expect, it } from 'vitest';
// Cùng một file với BE: chứng minh FE và BE không còn hai bộ mẫu lệch nhau (L5).
import { API_KEY_LEAK_MESSAGE, containsSecret } from '../../../BE/src/common/security/secret-patterns';

describe('[M7/L5] FE dùng chung bộ mẫu API key với BE', () => {
  it('chặn các biến thể mà bản FE cũ bỏ sót', () => {
    const k = '1234567890abcdefghijXYZ';
    for (const secret of [`sk_live_${k}`, `gsk_${k}`, `xai-${k}`, `sk-\u200B${k}`, `api_key = "${k}"`]) {
      expect(containsSecret({ prompt: secret, model: 'm', config: {} })).toBe(true);
    }
  });

  it('chặn key bị mã hóa base64 (giải mã bằng atob, chạy được cả ở trình duyệt)', () => {
    expect(containsSecret({ prompt: `Dùng ${btoa('sk-1234567890abcdefghijXYZ')} nhé` })).toBe(true);
  });

  it('không chặn prompt bình thường', () => {
    expect(containsSecret({ prompt: 'Bạn là trợ giảng. {{context}} {{question}}' })).toBe(false);
  });

  it('thông báo đúng như BE trả về', () => {
    expect(API_KEY_LEAK_MESSAGE).toBe('Không được để lộ API Key trong submission');
  });
});
