import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from './jwt-auth.guard';
import { STUDENT_ONLY_MESSAGE, StudentOnlyGuard } from './student-only.guard';
import { AiLabsController } from '../../modules-api/ai-labs/ai-labs.controller';
import { AiLabsService } from '../../modules-api/ai-labs/ai-labs.service';
import { DaLabsController } from '../../modules-api/da-labs/da-labs.controller';
import { DaLabsService } from '../../modules-api/da-labs/da-labs.service';

/** Thay JwtAuthGuard: lấy role từ header thay vì verify JWT. StudentOnlyGuard vẫn là bản thật. */
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      sub: 'user-1',
      email: 'x@test',
      role: req.headers['x-test-role'],
    };
    return true;
  }
}

describe('Khóa quyền nộp bài thực hành (StudentOnlyGuard)', () => {
  let app: INestApplication;
  const aiLabs = {
    submit: jest.fn().mockResolvedValue({ status: 'PASSED' }),
    getLab: jest.fn().mockResolvedValue({ slug: 'ai-lab-01' }),
  };
  const daLabs = {
    submitSql: jest.fn().mockResolvedValue({ status: 'ACCEPTED' }),
    submitInsight: jest.fn().mockResolvedValue({ status: 'GRADED' }),
    runSql: jest.fn().mockResolvedValue({ status: 'OK' }),
  };

  const SUBMIT_ROUTES: Array<
    [string, Record<string, jest.Mock>, string, object]
  > = [
    [
      '/ai-labs/ai-lab-01/submit',
      aiLabs,
      'submit',
      { prompt: 'Bạn là trợ giảng.', model: 'gemini-2.5-flash' },
    ],
    ['/da-labs/da-sql-01/submit', daLabs, 'submitSql', { sql: 'SELECT 1' }],
    [
      '/da-labs/da-insight-01/insight',
      daLabs,
      'submitInsight',
      { answer: 'Nhận định.' },
    ],
  ];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AiLabsController, DaLabsController],
      providers: [
        StudentOnlyGuard,
        { provide: AiLabsService, useValue: aiLabs },
        { provide: DaLabsService, useValue: daLabs },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  describe.each(SUBMIT_ROUTES)('POST %s', (path, service, method, body) => {
    it.each(['TEACHER', 'ADMIN'])(
      '%s bị chặn 403, service không được gọi',
      async (role) => {
        const res = await request(app.getHttpServer())
          .post(path)
          .set('x-test-role', role)
          .send(body);

        expect(res.status).toBe(403);
        expect(res.body.message).toBe(STUDENT_ONLY_MESSAGE);
        expect(service[method]).not.toHaveBeenCalled();
      },
    );

    it('thiếu role (token lạ) cũng bị chặn 403', async () => {
      const res = await request(app.getHttpServer()).post(path).send(body);

      expect(res.status).toBe(403);
      expect(service[method]).not.toHaveBeenCalled();
    });

    it('STUDENT được nộp bài', async () => {
      const res = await request(app.getHttpServer())
        .post(path)
        .set('x-test-role', 'STUDENT')
        .send(body);

      expect(res.status).toBe(201);
      expect(service[method]).toHaveBeenCalledTimes(1);
    });
  });

  it('giảng viên bị chặn trước cả bước quét API key (guard chạy trước pipe)', async () => {
    const res = await request(app.getHttpServer())
      .post('/ai-labs/ai-lab-01/submit')
      .set('x-test-role', 'TEACHER')
      .send({ prompt: 'sk-1234567890abcdefXYZ' });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe(STUDENT_ONLY_MESSAGE);
  });

  it('giảng viên vẫn xem đề và chạy thử SQL (không phải nộp bài)', async () => {
    await request(app.getHttpServer())
      .get('/ai-labs/ai-lab-01')
      .set('x-test-role', 'TEACHER')
      .expect(200);
    await request(app.getHttpServer())
      .post('/da-labs/da-sql-01/run')
      .set('x-test-role', 'TEACHER')
      .send({ sql: 'SELECT 1' })
      .expect(201);
  });
});
