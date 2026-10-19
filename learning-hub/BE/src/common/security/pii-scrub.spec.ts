import { scrubPii } from './pii-scrub.interceptor';

describe('scrubPii (đọc cấp trường cho giảng viên)', () => {
  it('loại phone, nationalId, address, guardianInfo ở mọi độ sâu, giữ trường được phép', () => {
    const out = scrubPii({
      success: true,
      data: [
        { _id: '1', fullName: 'An', email: 'a@x', score: 8, phone: '0909', nationalId: '012', address: 'HN', guardianInfo: { name: 'Bố' }, nested: { phoneNumber: '1', ok: 1 } },
      ],
    }) as any;
    expect(out.data[0]).toEqual({ _id: '1', fullName: 'An', email: 'a@x', score: 8, nested: { ok: 1 } });
  });

  it('giữ nguyên Date và mảng chuỗi', () => {
    const d = new Date();
    expect(scrubPii({ at: d, tags: ['a'] })).toEqual({ at: d, tags: ['a'] });
  });

  it('tôn trọng toJSON của document mongoose', () => {
    const doc = { toJSON: () => ({ fullName: 'B', phone: '1' }) };
    expect(scrubPii(doc)).toEqual({ fullName: 'B' });
  });
});
