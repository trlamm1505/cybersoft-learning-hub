import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  INestApplication,
  Injectable,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ROLES_KEY } from '../auth/roles.decorator';
import { StudentOnlyGuard } from '../auth/student-only.guard';
import { isStaff } from '../auth/roles';
import { ExerciseController } from '../../modules-api/exercise/exercise.controller';
import { HintController } from '../../modules-api/hint/hint.controller';
import { ContestController } from '../../modules-api/contest/contest.controller';
import { QuizController } from '../../modules-api/quiz/quiz.controller';
import { QuizService } from '../../modules-api/quiz/quiz.service';
import { JudgeController } from '../../modules-api/judge/judge.controller';
import { getModelToken } from '@nestjs/mongoose';
import { Submission } from '../../modules-system/database/schemas/submission.schema';

const guardsOf = (proto: object, method: string): unknown[] =>
  Reflect.getMetadata(GUARDS_METADATA, (proto as any)[method]) ?? [];
const rolesOf = (proto: object, method: string): string[] =>
  Reflect.getMetadata(ROLES_KEY, (proto as any)[method]) ?? [];

describe('Guard trên các route đã vá', () => {
  it('[H1] chạy code và kiểm tra cú pháp bắt buộc đăng nhập', () => {
    expect(guardsOf(ExerciseController.prototype, 'runCode')).toContain(
      JwtAuthGuard,
    );
    expect(guardsOf(ExerciseController.prototype, 'checkSyntax')).toContain(
      JwtAuthGuard,
    );
  });

  it('[H2] seed và xem 30 hint mẫu chỉ dành cho ADMIN', () => {
    for (const method of ['seedHints', 'get30SampleHints']) {
      expect(guardsOf(HintController.prototype, method)).toEqual([
        JwtAuthGuard,
        RolesGuard,
      ]);
      expect(rolesOf(HintController.prototype, method)).toEqual(['ADMIN']);
    }
  });

  it('[M4] nộp bài contest chỉ cho học viên; xem đề bắt buộc đăng nhập', () => {
    expect(guardsOf(ContestController.prototype, 'submitProblem')).toEqual([
      JwtAuthGuard,
      StudentOnlyGuard,
    ]);
    expect(
      guardsOf(ContestController.prototype, 'getProblemForStudent'),
    ).toContain(JwtAuthGuard);
  });

  it('[M6] ADMIN là staff cùng TEACHER; xem đề đầy đủ cho cả hai', () => {
    expect(isStaff('ADMIN')).toBe(true);
    expect(isStaff('TEACHER')).toBe(true);
    expect(isStaff('STUDENT')).toBe(false);
    expect(isStaff(undefined)).toBe(false);
    expect(rolesOf(ExerciseController.prototype, 'findBySlugFull')).toEqual([
      'TEACHER',
      'ADMIN',
    ]);
  });
});

/** Thay JwtAuthGuard: lấy user từ header thay vì verify JWT. */
@Injectable()
class FakeJwtGuard implements CanActivate {
  canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    req.user = {
      sub: req.headers['x-test-sub'] ?? 'user-1',
      role: req.headers['x-test-role'] ?? 'STUDENT',
    };
    return true;
  }
}

describe('[C1] GET /quiz/:id/review bỏ qua policy client gửi lên', () => {
  let app: INestApplication;
  const quizService = {
    reviewAttempt: jest.fn().mockResolvedValue({ questions: [] }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [QuizController],
      providers: [{ provide: QuizService, useValue: quizService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it('?policy=IMMEDIATE không được chuyển xuống service', async () => {
    await request(app.getHttpServer())
      .get('/quiz/attempt-1/review?policy=IMMEDIATE')
      .set('x-test-sub', 'student-9')
      .expect(200);

    expect(quizService.reviewAttempt).toHaveBeenCalledWith(
      'attempt-1',
      'student-9',
    );
    expect(quizService.reviewAttempt.mock.calls[0]).toHaveLength(2);
  });
});

describe('[M6] GET /exercises/submissions/:id: ADMIN xem được bài người khác, học viên khác thì không', () => {
  let app: INestApplication;
  const id = new Types.ObjectId().toString();
  const submissionModel = {
    findById: jest.fn(() => ({
      select: () => ({
        lean: () =>
          Promise.resolve({ _id: id, userId: 'owner-1', status: 'AC' }),
      }),
    })),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [JudgeController],
      providers: [
        { provide: getModelToken(Submission.name), useValue: submissionModel },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(FakeJwtGuard)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(() => app.close());

  it.each([
    ['ADMIN', 'admin-1', 200],
    ['TEACHER', 'teacher-1', 200],
    ['STUDENT', 'owner-1', 200],
    ['STUDENT', 'student-khac', 403],
  ])('%s (%s) -> %i', async (role, sub, status) => {
    await request(app.getHttpServer())
      .get(`/exercises/submissions/${id}`)
      .set('x-test-role', role)
      .set('x-test-sub', sub)
      .expect(status);
  });

  it('ForbiddenException được dùng cho trường hợp không phải chủ bài', () => {
    expect(new ForbiddenException().getStatus()).toBe(403);
  });
});
