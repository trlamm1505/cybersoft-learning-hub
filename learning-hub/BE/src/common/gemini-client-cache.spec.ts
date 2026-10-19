import { GeminiClientCache } from './gemini-client-cache';

const ctor = jest.fn();
jest.mock('@google/genai', () => ({
  ...jest.requireActual('@google/genai'),
  GoogleGenAI: jest.fn().mockImplementation((o: { apiKey: string }) => {
    ctor(o.apiKey);
    return { apiKey: o.apiKey };
  }),
}));

describe('GeminiClientCache: đổi key không cần khởi động lại', () => {
  beforeEach(() => ctor.mockClear());

  it('key không đổi dùng lại client; key Admin vừa đổi thì request kế tiếp dùng client mới với key mới', () => {
    let key: string | undefined = 'KEY-A';
    const cache = new GeminiClientCache(() => key);
    const a1 = cache.get();
    const a2 = cache.get();
    expect(a1).toBe(a2);
    expect(ctor).toHaveBeenCalledTimes(1);
    key = 'KEY-B';
    const b = cache.get() as unknown as { apiKey: string };
    expect(b.apiKey).toBe('KEY-B');
    expect(ctor).toHaveBeenLastCalledWith('KEY-B');
    expect(ctor).toHaveBeenCalledTimes(2);
  });

  it('chưa có key thì báo lỗi rõ ràng thay vì gọi API với key rỗng', () => {
    expect(() => new GeminiClientCache(() => undefined).get()).toThrow(/Chưa cấu hình/);
  });

  it('nguồn key cố định (chuỗi) vẫn hoạt động', () => {
    expect((new GeminiClientCache('FIXED').get() as unknown as { apiKey: string }).apiKey).toBe('FIXED');
  });
});
