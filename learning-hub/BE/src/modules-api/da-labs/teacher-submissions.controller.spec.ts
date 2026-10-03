import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import request from 'supertest';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import { User } from '../../modules-system/database/schemas/user.schema';
import { DaLabSubmission } from '../../modules-system/database/schemas/da-lab-submission.schema';
import { DatasetIntegrationService } from '../../integration/dataset-integration.service';
import { TeacherSubmissionsController } from './da-labs.controller';
import { DaLabsService } from './da-labs.service';
import { SqlGraderService } from './sql-grader.service';
import { InsightGraderService } from './insight-grader.service';

/** Thay JwtAuthGuard: lấy role từ header thay vì verify JWT. RolesGuard vẫn là bản thật. */
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = { sub: 'user-1', email: 'x@test', role: req.headers['x-test-role'] };
    return true;
  }
}

describe('PUT /teacher/submissions/:id/review', () => {
  let app: INestApplication;
  const id = new Types.ObjectId().toString();
  let doc: any;
  const submissionModel = { findById: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [TeacherSubmissionsController],
      providers: [
        DaLabsService,
        RolesGuard,
        { provide: getModelToken(DaLabSubmission.name), useValue: submissionModel },
        // app.init() chạy auto-seed onModuleInit của DaLabsService.
        {
          provide: getModelToken(Exercise.name),
          useValue: { bulkWrite: jest.fn().mockResolvedValue({ upsertedCount: 0 }) },
        },
        { provide: getModelToken(User.name), useValue: {} },
        { provide: DatasetIntegrationService, useValue: {} },
        { provide: SqlGraderService, useValue: {} },
        { provide: InsightGraderService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    doc = {
      _id: id,
      status: 'PENDING_REVIEW',
      score: 0,
      maxScore: 10,
      save: jest.fn().mockResolvedValue(undefined),
    };
    submissionModel.findById.mockReset().mockResolvedValue(doc);
  });

  it('TEACHER chấm thành công: 200, chuyển GRADED, lưu điểm và nhận xét', async () => {
    const res = await request(app.getHttpServer())
      .put(`/teacher/submissions/${id}/review`)
      .set('x-test-role', 'TEACHER')
      .send({ score: 8, teacherComment: 'Nhận định đúng, thiếu số liệu so sánh.' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id,
      status: 'GRADED',
      score: 8,
      teacherComment: 'Nhận định đúng, thiếu số liệu so sánh.',
    });
    expect(doc.save).toHaveBeenCalled();
    expect(doc.reviewedBy).toBe('user-1');
  });

  it('STUDENT gọi vào: 403 Forbidden, không đụng tới bài nộp', async () => {
    const res = await request(app.getHttpServer())
      .put(`/teacher/submissions/${id}/review`)
      .set('x-test-role', 'STUDENT')
      .send({ score: 10, teacherComment: 'tự chấm' });

    expect(res.status).toBe(403);
    expect(submissionModel.findById).not.toHaveBeenCalled();
    expect(doc.save).not.toHaveBeenCalled();
  });

  it('không tìm thấy bài nộp (hoặc id sai định dạng): 404', async () => {
    submissionModel.findById.mockResolvedValue(null);

    const missing = await request(app.getHttpServer())
      .put(`/teacher/submissions/${new Types.ObjectId()}/review`)
      .set('x-test-role', 'TEACHER')
      .send({ score: 5 });
    const malformed = await request(app.getHttpServer())
      .put('/teacher/submissions/not-an-id/review')
      .set('x-test-role', 'ADMIN')
      .send({ score: 5 });

    expect(missing.status).toBe(404);
    expect(malformed.status).toBe(404);
  });

  it.each([-1, 11, '8', null])('điểm không hợp lệ (%p): 400, không lưu', async (score) => {
    const res = await request(app.getHttpServer())
      .put(`/teacher/submissions/${id}/review`)
      .set('x-test-role', 'TEACHER')
      .send({ score });

    expect(res.status).toBe(400);
    expect(doc.save).not.toHaveBeenCalled();
  });
});
