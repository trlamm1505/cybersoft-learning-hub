import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { StudentOnlyGuard } from '../auth/student-only.guard';
import { AiLabsController } from '../../modules-api/ai-labs/ai-labs.controller';
import { AiLabsService } from '../../modules-api/ai-labs/ai-labs.service';
import {
  AppThrottlerGuard,
  DEFAULT_RATE_LIMIT,
  RATE_LIMIT_MESSAGE,
  RATE_LIMITS,
  jwtSubjectVerifier,
  resolveRateLimitTracker,
} from './app-throttler.guard';

const SECRET = 'test-secret';
const jwt = new JwtService({ secret: SECRET });
const verify = jwtSubjectVerifier(jwt);
const signed = (sub: string, opts: { expiresIn?: number } = {}) =>
  `Bearer ${jwt.sign({ sub }, { expiresIn: opts.expiresIn ?? 3600 })}`;
/** Token rác: payload hợp lệ nhưng không có chữ ký đúng. */
const unsigned = (sub: string) =>
  `Bearer h.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.sig`;
const req = (authorization?: string) => ({
  ip: '10.0.0.1',
  url: '/api/ai-labs',
  headers: authorization ? { authorization } : {},
});

describe('[M3] resolveRateLimitTracker (verify chữ ký JWT)', () => {
  it('token hợp lệ: đếm theo user, không theo IP (cả lớp chung NAT)', () => {
    expect(resolveRateLimitTracker(req(signed('u1')), verify)).toBe('user:u1');
  });

  it.each([
    ['không có token', undefined],
    ['token rác không có chữ ký đúng', unsigned('u1')],
    [
      'token ký bằng secret khác',
      `Bearer ${new JwtService({ secret: 'khac' }).sign({ sub: 'u1' })}`,
    ],
    ['token hết hạn', signed('u1', { expiresIn: -10 })],
    ['chuỗi bất kỳ', 'Bearer rác'],
  ])('%s: luôn đếm theo IP, không dùng chuỗi trong token', (_n, auth) => {
    expect(resolveRateLimitTracker(req(auth), verify)).toBe('ip:10.0.0.1');
  });

  it('đăng nhập: đếm theo IP + email', () => {
    expect(
      resolveRateLimitTracker(
        {
          ip: '10.0.0.1',
          originalUrl: '/api/auth/login',
          body: { email: ' A@x.vn ' },
          headers: {},
        },
        verify,
      ),
    ).toBe('login:10.0.0.1:a@x.vn');
  });
});

@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    ctx.switchToHttp().getRequest().user = { sub: 'u', role: 'STUDENT' };
    return true;
  }
}

describe('[M3] POST /ai-labs/:slug/submit bị giới hạn tần suất', () => {
  let app: INestApplication;
  const aiLabs = { submit: jest.fn().mockResolvedValue({ status: 'PASSED' }) };
  const limit = RATE_LIMITS.aiLabSubmit.default.limit;
  const body = { prompt: 'Bạn là trợ giảng.', model: 'gemini-2.5-flash' };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([DEFAULT_RATE_LIMIT])],
      controllers: [AiLabsController],
      providers: [
        StudentOnlyGuard,
        { provide: AiLabsService, useValue: aiLabs },
        { provide: ConfigService, useValue: { get: () => SECRET } },
        { provide: APP_GUARD, useClass: AppThrottlerGuard },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());
  beforeEach(() => aiLabs.submit.mockClear());

  const post = (auth: string) =>
    request(app.getHttpServer())
      .post('/ai-labs/ai-lab-01/submit')
      .set('Authorization', auth)
      .send(body);

  it(`quá ${limit} lần/phút thì 429; học viên khác (token hợp lệ) không bị ảnh hưởng`, async () => {
    for (let i = 0; i < limit; i++) await post(signed('spammer')).expect(201);
    const blocked = await post(signed('spammer'));
    expect(blocked.status).toBe(429);
    expect(blocked.body.message).toBe(RATE_LIMIT_MESSAGE);

    await post(signed('ban-cung-lop')).expect(201);
  });

  it('[bypass] đổi token rác mỗi request không né được bộ đếm: tất cả dồn về IP', async () => {
    const codes: number[] = [];
    for (let i = 0; i <= limit; i++) {
      codes.push((await post(unsigned(`gia-mao-${i}`))).status);
    }
    expect(codes.slice(0, limit).every((c) => c === 201)).toBe(true);
    expect(codes[limit]).toBe(429);
  });
});
