import { describe, expect, it } from 'vitest';
import { KID_AVATARS } from './kidAvatars';

describe('KID_AVATARS', () => {
  it('có bộ avatar hoạt hình, id không trùng, gồm Bé rồng, Phi hành gia, Chú gấu, Mèo con', () => {
    const labels = KID_AVATARS.map((a) => a.label);
    expect(KID_AVATARS.length).toBeGreaterThanOrEqual(8);
    expect(new Set(KID_AVATARS.map((a) => a.id)).size).toBe(KID_AVATARS.length);
    for (const l of ['Bé rồng', 'Phi hành gia', 'Chú gấu', 'Mèo con']) expect(labels).toContain(l);
  });
});
