import { of } from 'rxjs';
import { UnauthorizedException } from '@nestjs/common';
import { maskPii } from '../utils/pii-mask.util';
import { buildGeminiUserContent } from '../../modules-api/coach/coach-gemini.client';
import { CoachMessageSchema, COACH_MESSAGE_RETENTION_SECONDS } from '../../modules-system/database/schemas/coach-message.schema';
import { LoggingInterceptor } from '../interceptor/logging.interceptor';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthService } from '../../modules-api/auth/auth.service';

/** Day 29: SEC-21 / PRV-06 / PRV-07 / L3. */
describe('maskPii', () => {
  it('che email, số điện thoại VN (nhiều cách viết) và CCCD; không đụng code Python thường', () => {
    const out = maskPii('Em là Na, mail na.bui@gmail.com, sđt 0912 345 678 hoặc +84912345678, CCCD 012345678901');
    expect(out).not.toMatch(/na\.bui@gmail\.com|0912 345 678|\+84912345678|012345678901/);
    expect(out).toContain('[email đã ẩn]');
    expect(out).toContain('[số điện thoại đã ẩn]');
    expect(out).toContain('[mã định danh đã ẩn]');
    expect(maskPii('for i in range(10):\n    print(i * 2)')).toBe('for i in range(10):\n    print(i * 2)');
  });
});

describe('AI Coach không gửi định danh/PII sang Gemini', () => {
  it('payload không có userId; tin nhắn và lịch sử được che PII', () => {
    const context: any = {
      userId: '64b000000000000000000011',
      exercise: { slug: 'a', title: 'A', description: 'd', difficulty: 'EASY', visibleTestCases: [], hiddenTestCount: 0 },
      attemptSummary: {},
      unlockedHints: [],
      recentHistory: [{ role: 'user', content: 'sđt em 0987654321' }],
      policy: { allowFullSolution: false, maxHintLevelUnlocked: 0 },
    };
    const content = buildGeminiUserContent(context, 'email em la be@x.vn');
    expect(content).not.toContain('64b000000000000000000011');
    expect(content).not.toContain('"userId"');
    expect(content).not.toContain('0987654321');
    expect(content).not.toContain('be@x.vn');
  });

  it('coach_messages có TTL index (tự xóa sau 90 ngày)', () => {
    const ttl = CoachMessageSchema.indexes().find(([fields, opts]) => fields.createdAt === 1 && Object.keys(fields).length === 1 && opts?.expireAfterSeconds);
    expect(ttl?.[1].expireAfterSeconds).toBe(COACH_MESSAGE_RETENTION_SECONDS);
    expect(COACH_MESSAGE_RETENTION_SECONDS).toBe(90 * 24 * 3600);
  });
});

describe('LoggingInterceptor không log query string (PRV-06)', () => {
  it('chỉ ghi đường dẫn', (done) => {
    const it = new LoggingInterceptor();
    const lines: string[] = [];
    (it as any).logger = { log: (m: string) => lines.push(m), error: (m: string) => lines.push(m) };
    const req = { method: 'GET', url: '/api/admin/users?q=be.na@gmail.com&token=abc', originalUrl: '/api/admin/users?q=be.na@gmail.com&token=abc' };
    const ctx: any = { switchToHttp: () => ({ getRequest: () => req, getResponse: () => ({ statusCode: 200 }) }) };
    it.intercept(ctx, { handle: () => of({}) }).subscribe({
      complete: () => {
        expect(lines[0]).toContain('/api/admin/users');
        expect(lines[0]).not.toMatch(/gmail|token=|\?/);
        done();
      },
    });
  });
});

describe('Thu hồi token lưu bền (L3)', () => {
  it('jti có trong revoked_tokens → 401 kể cả khi bộ nhớ đã mất (restart)', async () => {
    const users: any = { findById: () => ({ select: () => ({ lean: () => Promise.resolve({ role: 'STUDENT' }) }) }) };
    const revoked: any = { exists: jest.fn().mockResolvedValue({ _id: 'x' }) };
    const strategy = new JwtStrategy({ get: () => 'unit-test-secret-unit-test-secret-1234' } as any, users, revoked);
    await expect(strategy.validate({ sub: '64b000000000000000000011', email: 'e', role: 'STUDENT', jti: 'old-jti' })).rejects.toBeInstanceOf(UnauthorizedException);
    revoked.exists.mockResolvedValue(null);
    await expect(strategy.validate({ sub: '64b000000000000000000011', email: 'e', role: 'STUDENT', jti: 'new-jti' })).resolves.toMatchObject({ role: 'STUDENT' });
  });
});

describe('PII trẻ Lớp 3-5 (SEC-19, PRV-01/02)', () => {
  const kidDoc = () => {
    const doc: any = { _id: '64b000000000000000000021', email: 'be@demo.local', fullName: 'Bé Na', role: 'STUDENT', ageGroup: '3-5', phone: '0912345678', bio: 'nhà ở Quận 1' };
    doc.set = jest.fn((k: string, v: unknown) => (doc[k] = v));
    doc.save = jest.fn().mockResolvedValue(doc);
    return doc;
  };
  const build = (doc: any) =>
    new AuthService({ findById: jest.fn().mockResolvedValue(doc) } as any, {} as any, {} as any, { sign: () => 'jwt' } as any, { get: () => undefined } as any, {} as any);

  it('hồ sơ trả về không có số điện thoại / giới thiệu của bé (kể cả dữ liệu cũ còn sót)', async () => {
    const me = await build(kidDoc()).getProfile('64b000000000000000000021');
    expect(me).toMatchObject({ phone: '', bio: '' });
  });

  it('cập nhật hồ sơ của bé không lưu phone/bio; họ tên vẫn sửa được', async () => {
    const doc = kidDoc();
    await build(doc).updateProfile('64b000000000000000000021', { fullName: 'Bé Na Nguyễn', phone: '0987654321', bio: 'trường X' });
    expect(doc.phone).toBeUndefined();
    expect(doc.bio).toBeUndefined();
    expect(doc.fullName).toBe('Bé Na Nguyễn');
  });
});
