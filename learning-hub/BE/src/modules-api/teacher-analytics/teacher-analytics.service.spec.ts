import 'reflect-metadata';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { TeacherAnalyticsController } from './teacher-analytics.controller';
import { TeacherAnalyticsService } from './teacher-analytics.service';

import { fakeModel } from './fake-model';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const C1 = OID(1); // lớp của giảng viên t1
const C2 = OID(2); // lớp của giảng viên t2
const C3 = OID(3); // lớp trống của t1

const T1: JwtPayload = { sub: 't1', email: 't1@x', role: 'TEACHER' };
const T2: JwtPayload = { sub: 't2', email: 't2@x', role: 'TEACHER' };
const ADMIN: JwtPayload = { sub: 'adm', email: 'a@x', role: 'ADMIN' };

const classes = [
  {
    _id: C1,
    name: 'Lớp 1',
    teacherId: 't1',
    studentIds: ['s1', 's2'],
    exerciseSlugs: ['ex-a'],
  },
  {
    _id: C2,
    name: 'Lớp 2',
    teacherId: 't2',
    studentIds: ['s3'],
    exerciseSlugs: ['ex-b'],
  },
  {
    _id: C3,
    name: 'Lớp trống',
    teacherId: 't1',
    studentIds: [],
    exerciseSlugs: [],
  },
];
const users = ['s1', 's2', 's3'].map((id) => ({
  _id: id,
  fullName: id.toUpperCase(),
  role: 'STUDENT',
}));
const exercises = [
  { _id: 'e-a', slug: 'ex-a', title: 'A', tags: ['loops'] },
  { _id: 'e-b', slug: 'ex-b', title: 'B', tags: ['sql'] },
];
const sub = (
  userId: string,
  exerciseId: string,
  status: string,
  day: number,
) => ({
  userId,
  exerciseId,
  status,
  createdAt: new Date(Date.UTC(2026, 8, day)),
});
const submissions = [
  sub('s1', 'e-a', 'WA', 1),
  sub('s1', 'e-a', 'AC', 2),
  sub('s2', 'e-a', 'WA', 3),
  // Dữ liệu lớp khác lọt vào cùng collection: không được xuất hiện trong lớp 1.
  sub('s3', 'e-a', 'AC', 4), // học viên lớp 2 làm bài của lớp 1
  sub('s1', 'e-b', 'AC', 5), // học viên lớp 1 làm bài của lớp 2
  sub('s3', 'e-b', 'AC', 6),
];
const hints = [
  { userId: 's2', exerciseSlug: 'ex-a' },
  { userId: 's3', exerciseSlug: 'ex-a' }, // ngoài lớp 1
];

function build() {
  const models = {
    classes: fakeModel(classes),
    users: fakeModel(users),
    exercises: fakeModel(exercises),
    submissions: fakeModel(submissions),
    hints: fakeModel(hints),
    daLabs: fakeModel([]),
    aiLabs: fakeModel([]),
  };
  const service = new TeacherAnalyticsService(
    models.classes as any,
    models.users as any,
    models.exercises as any,
    models.submissions as any,
    models.hints as any,
    models.daLabs as any,
    models.aiLabs as any,
  );
  return { service, models };
}

describe('TeacherAnalyticsService: phân quyền và cô lập theo lớp', () => {
  it('giảng viên xem được lớp của mình; số liệu chỉ gồm học viên và bài của lớp đó', async () => {
    const { service } = build();
    const r = await service.getOverview(T1, C1);

    expect(r.class).toEqual({
      id: C1,
      name: 'Lớp 1',
      teacherId: 't1',
      description: '',
      archived: false,
      studentCount: 2,
      exerciseCount: 1,
    });
    // s1: WA + AC (đạt, 2 lượt), s2: WA (chưa đạt, 1 lượt). Bài nộp của s3 và bài ex-b bị loại.
    expect(r.summary).toMatchObject({
      students: 2,
      exercises: 1,
      attemptedPairs: 2,
      passedPairs: 1,
      totalAttempts: 3,
      completionRate: 0.5,
      passRate: 0.5,
      avgAttempts: 1.5,
      hintUnlocks: 1, // gợi ý của s3 không tính
      hintUsageRate: 0.5,
    });
    expect(r.students.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(r.exercises.map((e) => e.slug)).toEqual(['ex-a']);
  });

  it('truy vấn dữ liệu luôn bị giới hạn bằng danh sách học viên và bài tập của lớp', async () => {
    const { service, models } = build();
    await service.getOverview(T1, C1);

    expect(models.submissions.calls[0]).toMatchObject({
      userId: { $in: ['s1', 's2'] },
      exerciseId: { $in: ['e-a'] },
    });
    expect(models.hints.calls[0]).toMatchObject({
      userId: { $in: ['s1', 's2'] },
      exerciseSlug: { $in: ['ex-a'] },
    });
    expect(models.users.calls[0]).toMatchObject({ role: 'STUDENT' });
  });

  it('giảng viên KHÔNG mở được lớp của giảng viên khác (403), kể cả drill-down', async () => {
    const { service, models } = build();
    await expect(service.getOverview(T2, C1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.getStudent(T2, C1, 's1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.getExercise(T2, C1, 'ex-a')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.updateClass(T2, C1, { name: 'Đổi tên' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    // Bị chặn trước khi đọc bất kỳ dữ liệu học tập nào.
    expect(models.submissions.find).not.toHaveBeenCalled();
    expect(models.hints.find).not.toHaveBeenCalled();
    expect(models.users.find).not.toHaveBeenCalled();
  });

  it('quản trị viên xem được mọi lớp', async () => {
    const { service } = build();
    await expect(service.getOverview(ADMIN, C1)).resolves.toBeDefined();
    await expect(service.getOverview(ADMIN, C2)).resolves.toBeDefined();
    expect(await service.listClasses(ADMIN)).toHaveLength(3);
  });

  it('danh sách lớp của giảng viên chỉ gồm lớp của họ', async () => {
    const { service, models } = build();
    const list = await service.listClasses(T2);
    expect(models.classes.calls[0]).toEqual({
      teacherId: 't2',
      archived: { $ne: true },
    });
    expect(list.map((c) => c.id)).toEqual([C2]);
  });

  it('id lớp sai định dạng hoặc không tồn tại → 404', async () => {
    const { service } = build();
    await expect(
      service.getOverview(T1, 'khong-phai-objectid'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.getOverview(T1, OID(9))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('drill-down: học viên hoặc bài tập ngoài lớp → 404, không lộ dữ liệu lớp khác', async () => {
    const { service } = build();
    await expect(service.getStudent(T1, C1, 's3')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.getExercise(T1, C1, 'ex-b')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('drill-down học viên và bài tập trả đúng số liệu trong lớp', async () => {
    const { service } = build();
    const st = await service.getStudent(T1, C1, 's1');
    expect(st.student).toMatchObject({
      id: 's1',
      attemptedExercises: 1,
      passedExercises: 1,
      totalAttempts: 2,
    });
    expect(st.exercises).toEqual([
      expect.objectContaining({
        slug: 'ex-a',
        status: 'PASSED',
        attempts: 2,
        hintUnlocks: 0,
      }),
    ]);

    const ex = await service.getExercise(T1, C1, 'ex-a');
    expect(ex.exercise).toMatchObject({
      slug: 'ex-a',
      attemptedStudents: 2,
      passedStudents: 1,
    });
    expect(ex.students.map((s) => [s.id, s.status, s.attempts])).toEqual([
      ['s1', 'PASSED', 2],
      ['s2', 'ATTEMPTED', 1],
    ]);
  });
});

describe('TeacherAnalyticsService: trạng thái dữ liệu trống', () => {
  it('lớp chưa có học viên và bài: không truy vấn bài nộp, mọi tỷ lệ null', async () => {
    const { service, models } = build();
    const r = await service.getOverview(T1, C3);
    expect(r.summary).toMatchObject({
      students: 0,
      exercises: 0,
      completionRate: null,
      passRate: null,
      avgAttempts: null,
      hintUsageRate: null,
    });
    expect([r.tags, r.students, r.exercises]).toEqual([[], [], []]);
    expect(models.submissions.find).not.toHaveBeenCalled();
  });

  it('lớp có học viên và bài nhưng chưa ai nộp: hoàn thành 0%, tỷ lệ đạt null', async () => {
    const { service, models } = build();
    models.submissions.find.mockReturnValueOnce({
      select: () => ({ lean: async () => [] }),
    } as any);
    const r = await service.getOverview(T1, C1);
    expect(r.summary).toMatchObject({
      attemptedPairs: 0,
      completionRate: 0,
      passRate: null,
      avgAttempts: null,
    });
    expect(r.students.every((s) => s.lastActiveAt === null)).toBe(true);
  });

  it('học viên đã bị xóa hoặc đổi vai trò thì không còn trong lớp', async () => {
    const { service, models } = build();
    models.users.find.mockReturnValueOnce({
      select: () => ({ lean: async () => [users[0]] }),
    } as any);
    const r = await service.getOverview(T1, C1);
    expect(r.students.map((s) => s.id)).toEqual(['s1']);
  });
});

describe('TeacherAnalyticsController: RBAC', () => {
  it('toàn bộ endpoint đi qua JwtAuthGuard + RolesGuard và chỉ cho TEACHER/ADMIN', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, TeacherAnalyticsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, TeacherAnalyticsController)).toEqual([
      'TEACHER',
      'ADMIN',
    ]);
  });

  it('RolesGuard chặn học viên (403) và cho giảng viên, quản trị viên đi qua', () => {
    const { Reflector } = require('@nestjs/core');
    const guard = new RolesGuard(new Reflector());
    const ctx = (role: string) =>
      ({
        getHandler: () => TeacherAnalyticsController.prototype.overview,
        getClass: () => TeacherAnalyticsController,
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: 'u', role } }),
        }),
      }) as any;
    expect(() => guard.canActivate(ctx('STUDENT'))).toThrow(ForbiddenException);
    expect(guard.canActivate(ctx('TEACHER'))).toBe(true);
    expect(guard.canActivate(ctx('ADMIN'))).toBe(true);
  });

  it('controller chuyển nguyên user từ token vào service (không nhận user từ client)', async () => {
    const service: any = { getOverview: jest.fn().mockResolvedValue({}) };
    const controller = new TeacherAnalyticsController(service);
    await controller.overview(T1, C1);
    expect(service.getOverview).toHaveBeenCalledWith(T1, C1);
  });
});
