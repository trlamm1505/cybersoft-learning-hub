import { BadRequestException } from '@nestjs/common';
import { decryptSecret } from './config-crypto';
import { CONFIG_CACHE_TTL_MS, GEMINI_KEY, MAX_PROMPT_CHARS, SystemConfigService } from './system-config.service';

const generate = jest.fn();
jest.mock('@google/genai', () => ({
  ...jest.requireActual('@google/genai'),
  GoogleGenAI: jest.fn().mockImplementation(() => ({ models: { generateContent: (...a: unknown[]) => generate(...a) } })),
}));

const SECRET = 'c'.repeat(64);
const KEY = 'AIzaSyD-example-key-1234567890abcdef';

function build(opts: { env?: Record<string, string>; docs?: Record<string, any> } = {}) {
  const docs: Record<string, any> = { ...(opts.docs ?? {}) };
  const configs: any = {
    findOne: jest.fn((q: { key: string }) => ({ lean: () => Promise.resolve(docs[q.key] ?? null) })),
    find: jest.fn(() => ({ lean: () => Promise.resolve(Object.entries(docs).filter(([k]) => k.startsWith('prompt.')).map(([key, d]) => ({ key, ...d }))) })),
    updateOne: jest.fn((q: { key: string }, u: any) => {
      docs[q.key] = { ...(docs[q.key] ?? {}), ...u.$set };
      return Promise.resolve({});
    }),
    deleteOne: jest.fn((q: { key: string }) => {
      delete docs[q.key];
      return Promise.resolve({});
    }),
  };
  const env: any = { get: (k: string) => ({ CONFIG_ENCRYPTION_KEY: SECRET, ...(opts.env ?? {}) })[k] };
  return { svc: new SystemConfigService(configs, env), configs, docs };
}

describe('SystemConfigService: API key', () => {
  beforeEach(() => generate.mockReset());

  it('lưu key dạng mã hóa, trả về dạng che và không lưu bản rõ', async () => {
    const { svc, docs } = build();
    const r = await svc.setGeminiKey(KEY, 'admin1');
    expect(r.after).toBe('AIzaSy...****');
    const stored = docs[GEMINI_KEY];
    expect(stored.value).not.toContain(KEY);
    expect(stored.encrypted).toBe(true);
    expect(decryptSecret(stored.value, SECRET)).toBe(KEY);
    expect(stored.updatedBy).toBe('admin1');
  });

  it('keyInfo chỉ chứa bản che, không bao giờ chứa key rõ', async () => {
    const { svc } = build();
    await svc.setGeminiKey(KEY, 'a');
    const info = await svc.keyInfo();
    expect(info).toMatchObject({ configured: true, source: 'database', masked: 'AIzaSy...****' });
    expect(JSON.stringify(info)).not.toContain(KEY);
    expect(JSON.stringify(await svc.list())).not.toContain(KEY);
  });

  it('key hiện hành đổi ngay sau khi Admin lưu (không cần khởi động lại); ưu tiên key trong DB hơn .env', async () => {
    const { svc } = build({ env: { GEMINI_API_KEY: 'ENV-KEY-ENV-KEY-ENV-KEY-1234' } });
    expect(svc.currentGeminiKey()).toBe('ENV-KEY-ENV-KEY-ENV-KEY-1234');
    await svc.setGeminiKey(KEY, 'a');
    expect(svc.currentGeminiKey()).toBe(KEY);
  });

  it('key lưu hỏng/sai khóa mã hóa thì rơi về .env, không ném lỗi', async () => {
    const { svc } = build({ env: { GEMINI_API_KEY: 'ENV-KEY-ENV-KEY-ENV-KEY-1234' }, docs: { [GEMINI_KEY]: { value: 'khong.phai.base64-hop-le' } } });
    await svc.ensureLoaded();
    expect(svc.currentGeminiKey()).toBe('ENV-KEY-ENV-KEY-ENV-KEY-1234');
    expect((await svc.keyInfo()).source).toBe('env');
  });

  it('từ chối key sai định dạng và báo rõ khi thiếu CONFIG_ENCRYPTION_KEY', async () => {
    const { svc } = build();
    await expect(svc.setGeminiKey('ngan', 'a')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.setGeminiKey('co khoang trang ' + 'x'.repeat(30), 'a')).rejects.toBeInstanceOf(BadRequestException);
    const noSecret = build({ env: { CONFIG_ENCRYPTION_KEY: '' } });
    await expect(noSecret.svc.setGeminiKey(KEY, 'a')).rejects.toThrow(/CONFIG_ENCRYPTION_KEY/);
    expect(noSecret.svc.encryptionReady).toBe(false);
  });

  it('pingGemini: key hợp lệ trả valid + latency; key bị từ chối trả valid=false mà không lộ key', async () => {
    const { svc } = build();
    generate.mockResolvedValueOnce({});
    const ok = await svc.pingGemini(KEY);
    expect(ok.valid).toBe(true);
    expect(ok.latencyMs).toBeGreaterThanOrEqual(0);
    generate.mockRejectedValueOnce(new Error(`API key not valid ${KEY}`));
    const bad = await svc.pingGemini(KEY);
    expect(bad.valid).toBe(false);
    expect(JSON.stringify(bad)).not.toContain(KEY);
  });

  it('pingGemini: quá 3 giây coi là timeout; hết quota vẫn tính key hợp lệ; không có key thì báo chưa cấu hình', async () => {
    jest.useFakeTimers();
    try {
      const { svc } = build();
      generate.mockReturnValueOnce(new Promise(() => undefined));
      const p = svc.pingGemini(KEY);
      await jest.advanceTimersByTimeAsync(3_100);
      expect(await p).toMatchObject({ valid: false, reason: expect.stringContaining('3 giây') });
    } finally {
      jest.useRealTimers();
    }
    const { svc } = build();
    generate.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED quota'));
    expect(await svc.pingGemini(KEY)).toMatchObject({ valid: true });
    expect(await svc.pingGemini()).toMatchObject({ valid: false, reason: expect.stringContaining('Chưa cấu hình') });
  });
});

describe('SystemConfigService: system prompts', () => {
  it('chưa cấu hình thì dùng prompt mặc định (fallback)', async () => {
    const { svc } = build();
    expect(await svc.get('coach', 'MẶC ĐỊNH')).toBe('MẶC ĐỊNH');
  });

  it('cache 60 giây: không truy vấn DB lại trong TTL, hết TTL thì đọc lại', async () => {
    jest.useFakeTimers();
    try {
      const { svc, configs } = build({ docs: { 'prompt.coach': { value: 'PROMPT A đủ dài để hợp lệ' } } });
      expect(await svc.get('coach', 'fb')).toBe('PROMPT A đủ dài để hợp lệ');
      await svc.get('coach', 'fb');
      expect(configs.findOne).toHaveBeenCalledTimes(1);
      jest.setSystemTime(Date.now() + CONFIG_CACHE_TTL_MS + 1);
      await svc.get('coach', 'fb');
      expect(configs.findOne).toHaveBeenCalledTimes(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it('lưu prompt làm mới cache NGAY: request kế tiếp thấy bản mới dù chưa hết TTL', async () => {
    const { svc } = build();
    expect(await svc.get('debug', 'mặc định')).toBe('mặc định');
    await svc.setPrompt('prompt.debug', 'Bạn là chuyên gia phân tích lỗi mới, trả lời ngắn gọn.', 'admin1');
    expect(await svc.get('debug', 'mặc định')).toBe('Bạn là chuyên gia phân tích lỗi mới, trả lời ngắn gọn.');
  });

  it('để trống prompt thì quay về mặc định; prompt quá ngắn/dài hoặc khóa lạ bị từ chối', async () => {
    const { svc } = build();
    await svc.setPrompt('prompt.ailab', 'Bạn là giám khảo chấm rubric nghiêm túc.', 'a');
    await svc.setPrompt('prompt.ailab', '   ', 'a');
    expect(await svc.get('ailab', 'fb')).toBe('fb');
    await expect(svc.setPrompt('prompt.ailab', 'ngắn', 'a')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.setPrompt('prompt.ailab', 'x'.repeat(MAX_PROMPT_CHARS + 1), 'a')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.setPrompt('prompt.khong-co', 'x'.repeat(30), 'a')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lỗi đọc DB thì dùng bản đã cache hoặc fallback, không làm hỏng request AI', async () => {
    const { svc, configs } = build();
    configs.findOne.mockImplementation(() => ({ lean: () => Promise.reject(new Error('down')) }));
    expect(await svc.get('coach', 'fb')).toBe('fb');
  });

  it('list trả 3 prompt kèm cờ isDefault và trạng thái mã hóa', async () => {
    const { svc } = build({ docs: { 'prompt.coach': { value: 'Bản tùy chỉnh dài đủ dùng.', updatedBy: 'a' } } });
    const res = await svc.list();
    expect(res.prompts.map((p) => p.key)).toEqual(['coach', 'debug', 'ailab']);
    expect(res.prompts.find((p) => p.key === 'coach')).toMatchObject({ isDefault: false, value: 'Bản tùy chỉnh dài đủ dùng.' });
    expect(res.prompts.find((p) => p.key === 'debug')!.isDefault).toBe(true);
    expect(res.encryptionReady).toBe(true);
  });
});

describe('SystemConfigService: trim và key giả', () => {
  beforeEach(() => generate.mockReset());

  it('key dán có dấu cách/xuống dòng ở đầu cuối được cắt sạch rồi mới mã hóa và lưu', async () => {
    const { svc, docs } = build();
    await svc.setGeminiKey(`  
	${KEY}  
`, 'a');
    expect(decryptSecret(docs[GEMINI_KEY].value, SECRET)).toBe(KEY);
    expect(svc.currentGeminiKey()).toBe(KEY);
  });

  it('key giả bị Gemini từ chối thì KHÔNG lưu gì và báo 400', async () => {
    const { svc, docs, configs } = build();
    generate.mockRejectedValue(new Error('API key not valid. Please pass a valid API key.'));
    await expect(svc.setGeminiKey(KEY, 'a')).rejects.toThrow(/Gemini từ chối|bị Gemini từ chối/);
    expect(configs.updateOne).not.toHaveBeenCalled();
    expect(docs[GEMINI_KEY]).toBeUndefined();
  });

  it('lỗi mạng/timeout/hết hạn mức không đổ lỗi cho key: vẫn lưu được', async () => {
    const { svc, docs } = build();
    generate.mockRejectedValueOnce(new Error('fetch failed ECONNRESET'));
    await expect(svc.setGeminiKey(KEY, 'a')).resolves.toBeDefined();
    expect(docs[GEMINI_KEY]).toBeDefined();
    generate.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED quota'));
    await expect(svc.setGeminiKey(KEY + 'x', 'a')).resolves.toBeDefined();
  });

  it('khóa mã hóa không bao giờ xuất hiện trong kết quả trả về hay thông báo lỗi', async () => {
    const { svc } = build();
    const info = JSON.stringify(await svc.list());
    expect(info).not.toContain(SECRET);
    const err = await build({ env: { CONFIG_ENCRYPTION_KEY: 'ngan' } }).svc.setGeminiKey(KEY, 'a').catch((e: Error) => e.message);
    expect(String(err)).not.toContain('ngan');
  });
});
