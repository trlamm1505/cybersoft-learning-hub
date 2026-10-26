import 'reflect-metadata';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { StudentClassesController } from './student-classes.controller';
import { TeacherAnalyticsService } from './teacher-analytics.service';
import { fakeModel } from './fake-model';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const C1 = OID(1);
const C2 = OID(2);
const C3 = OID(3);

const ADMIN: JwtPayload = { sub: 'adm', email: 'a@x', role: 'ADMIN' };
const TEACHER: JwtPayload = { sub: 't1', email: 't1@x', role: 'TEACHER' };
const A: JwtPayload = { sub: 'sA', email: 'a@student.x', role: 'STUDENT' };
const B: JwtPayload = { sub: 'sB', email: 'b@student.x', role: 'STUDENT' };
const OUTSIDER: JwtPayload = { sub: 'sZ', email: 'z@student.x', role: 'STUDENT' };

function build() {
  const models = {
    classes: fakeModel([
      { _id: C1, name: 'Lớp Python', teacherId: 't1', studentIds: ['sB'], exerciseSlugs: [], description: 'Sáng T2' },
      { _id: C2, name: 'Lớp cũ', teacherId: 't1', studentIds: ['sA'], exerciseSlugs: ['ex-x'], archived: true },
      { _id: C3, name: 'Lớp khác', teacherId: 't1', studentIds: ['sZ'], exerciseSlugs: ['ex-x'] },
    ]),
    users: fakeModel([
      { _id: 'adm', role: 'ADMIN', fullName: 'Admin' },
      { _id: 't1', role: 'TEACHER', fullName: 'Cô Lan', email: 't1@x' },
      { _id: 'sA', role: 'STUDENT', fullName: 'Học viên A', email: 'a@student.x' },
      { _id: 'sB', role: 'STUDENT', fullName: 'Học viên B', email: 'b@student.x' },
      { _id: 'sZ', role: 'STUDENT', fullName: 'Học viên Z', email: 'z@student.x' },
    ]),
    exercises: fakeModel([
      { _id: 'e-x', slug: 'ex-x', title: 'Bài X', type: 'CODE_TEXT', difficulty: 'EASY', tags: ['loops'] },
      { _id: 'e-y', slug: 'ex-y', title: 'Bài Y', type: 'SQL_LAB', difficulty: 'MEDIUM', tags: ['sql'] },
    ]),
    submissions: fakeModel([]),
    hints: fakeModel([]),
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

const sub = (userId: string, exerciseId: string, status: string, day: number) => ({
  userId,
  exerciseId,
  status,
  createdAt: new Date(Date.UTC(2026, 8, day)),
});

describe('Học viên xem lớp và bài được giao', () => {
  it('chỉ trả lớp đang tham gia và chưa lưu trữ; học viên ngoài lớp nhận danh sách rỗng', async () => {
    const { service } = build();
    expect(await service.listMyClasses(OUTSIDER)).toHaveLength(1); // chỉ Lớp khác
    const mine = await service.listMyClasses(B);
    expect(mine.map((c) => c.name)).toEqual(['Lớp Python']);
    // A chỉ thuộc lớp đã lưu trữ → không thấy gì
    expect(await service.listMyClasses(A)).toEqual([]);
  });

  it('kèm giảng viên, mô tả và bỏ qua bài không còn tồn tại', async () => {
    const { service, models } = build();
    models.classes.rows[0].exerciseSlugs = ['ex-x', 'ex-gone'];
    const [c] = await service.listMyClasses(B);
    expect(c.teacher).toEqual({ name: 'Cô Lan' });
    expect(c.description).toBe('Sáng T2');
    expect(c.exercises.map((e) => e.slug)).toEqual(['ex-x']);
    expect(c.exercises[0]).toMatchObject({ title: 'Bài X', type: 'CODE_TEXT', status: 'NOT_STARTED', attempts: 0 });
  });

  it('chỉ giữ dữ liệu của chính học viên, không lộ bài nộp của người cùng lớp', async () => {
    const { service, models } = build();
    models.classes.rows[0].studentIds = ['sA', 'sB'];
    models.classes.rows[0].exerciseSlugs = ['ex-x'];
    models.submissions.rows.push(sub('sB', 'e-x', 'AC', 2));
    const [c] = await service.listMyClasses(A);
    expect(c.exercises[0].status).toBe('NOT_STARTED');
    expect(c.progress).toEqual({ total: 1, passed: 0, attempted: 0 });
  });

  it('chỉ học viên mới gọi được; giảng viên và quản trị viên nhận 403', async () => {
    const { service } = build();
    await expect(service.listMyClasses(TEACHER)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.listMyClasses(ADMIN)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('controller gắn guard đăng nhập + vai trò STUDENT và dùng user từ token', async () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, StudentClassesController)).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, StudentClassesController)).toEqual(['STUDENT']);
    const guard = new RolesGuard(new Reflector());
    const ctx = (role: string) =>
      ({
        getHandler: () => StudentClassesController.prototype.mine,
        getClass: () => StudentClassesController,
        switchToHttp: () => ({ getRequest: () => ({ user: { sub: 'u', role } }) }),
      }) as any;
    expect(guard.canActivate(ctx('STUDENT'))).toBe(true);
    expect(() => guard.canActivate(ctx('TEACHER'))).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx('ADMIN'))).toThrow(ForbiddenException);
    const service: any = { listMyClasses: jest.fn().mockResolvedValue([]) };
    await new StudentClassesController(service).mine(A);
    expect(service.listMyClasses).toHaveBeenCalledWith(A);
  });
});

describe('Vòng khép kín: Admin thêm → Giảng viên giao → Học viên làm → Dashboard cập nhật', () => {
  it('trạng thái bài và số liệu Teacher Dashboard khớp nhau ở từng bước', async () => {
    const { service, models } = build();

    // 1. Admin thêm học viên A vào lớp Python (đã có B).
    const added = await service.addStudents(ADMIN, C1, ['a@student.x']);
    expect(added.added.map((x) => x.id)).toEqual(['sA']);

    // 2. Giảng viên giao bài X và Y.
    await service.setExercises(TEACHER, C1, ['ex-x', 'ex-y']);

    // 3. Học viên A đăng nhập: thấy lớp và hai bài, chưa làm.
    let [mine] = await service.listMyClasses(A);
    expect(mine.name).toBe('Lớp Python');
    expect(mine.exercises.map((e) => [e.slug, e.status])).toEqual([
      ['ex-x', 'NOT_STARTED'],
      ['ex-y', 'NOT_STARTED'],
    ]);
    let overview = await service.getOverview(TEACHER, C1);
    expect(overview.summary).toMatchObject({ students: 2, exercises: 2, attemptedPairs: 0, passedPairs: 0, completionRate: 0, passRate: null });

    // 4. A nộp sai bài X: "Đang làm"; dashboard có 1 cặp đã thử, chưa đạt.
    models.submissions.rows.push(sub('sA', 'e-x', 'WA', 1));
    [mine] = await service.listMyClasses(A);
    expect(mine.exercises[0]).toMatchObject({ status: 'ATTEMPTED', attempts: 1 });
    overview = await service.getOverview(TEACHER, C1);
    expect(overview.summary).toMatchObject({ attemptedPairs: 1, passedPairs: 0, completionRate: 0, passRate: 0 });

    // 5. A nộp đúng: "Đã đạt"; dashboard: hoàn thành 1/4, tỷ lệ đạt 1/1, trung bình 2 lần thử.
    models.submissions.rows.push(sub('sA', 'e-x', 'AC', 2));
    [mine] = await service.listMyClasses(A);
    expect(mine.exercises[0]).toMatchObject({ status: 'PASSED', attempts: 2 });
    expect(mine.progress).toEqual({ total: 2, passed: 1, attempted: 1 });
    overview = await service.getOverview(TEACHER, C1);
    expect(overview.summary).toMatchObject({ attemptedPairs: 1, passedPairs: 1, completionRate: 0.25, passRate: 1, avgAttempts: 2 });

    // 6. Học viên B (cùng lớp) làm bài Y đạt qua DA Lab: cả hai nguồn dữ liệu đều được tính.
    models.daLabs.rows.push({ userId: 'sB', exerciseSlug: 'ex-y', type: 'SQL', status: 'GRADED', attemptCount: 3, bestScore: 10, maxScore: 10 });
    const [mineB] = await service.listMyClasses(B);
    expect(mineB.exercises[1]).toMatchObject({ slug: 'ex-y', status: 'PASSED', attempts: 3 });
    overview = await service.getOverview(TEACHER, C1);
    expect(overview.summary).toMatchObject({ attemptedPairs: 2, passedPairs: 2, completionRate: 0.5, passRate: 1 });

    // Bài nộp của A không lọt sang học viên khác ngoài lớp.
    expect((await service.listMyClasses(OUTSIDER))[0].exercises[0].status).toBe('NOT_STARTED');
  });

  it('gỡ học viên khỏi lớp thì lớp biến mất khỏi danh sách của họ', async () => {
    const { service } = build();
    await service.addStudents(ADMIN, C1, ['a@student.x']);
    expect(await service.listMyClasses(A)).toHaveLength(1);
    await service.removeStudent(ADMIN, C1, 'sA');
    expect(await service.listMyClasses(A)).toEqual([]);
  });
});

describe('Học viên tự do (chưa vào lớp)', () => {
  it('bài làm của học viên tự do không tính vào bất kỳ chỉ số nào của Dashboard', async () => {
    const { service, models } = build();
    await service.setExercises(TEACHER, C1, ['ex-x']);
    // sZ chỉ ở lớp khác; sA đã lưu trữ; cả hai làm đúng bài X nhưng không thuộc lớp C1.
    models.submissions.rows.push(sub('sZ', 'e-x', 'AC', 1), sub('sA', 'e-x', 'AC', 2), sub('sFree', 'e-x', 'AC', 3));
    models.hints.rows.push({ userId: 'sFree', exerciseSlug: 'ex-x' });
    const before = await service.getOverview(TEACHER, C1);
    expect(before.summary).toMatchObject({ students: 1, attemptedPairs: 0, passedPairs: 0, totalAttempts: 0, hintUnlocks: 0, completionRate: 0, passRate: null });

    // Khi Admin thêm sA vào lớp, bài làm của họ tính ngay từ lúc đó.
    await service.addStudents(ADMIN, C1, ['a@student.x']);
    const after = await service.getOverview(TEACHER, C1);
    expect(after.summary).toMatchObject({ students: 2, attemptedPairs: 1, passedPairs: 1, completionRate: 0.5, passRate: 1 });
  });

  it('học viên tự do vẫn lấy được danh sách rỗng (không lỗi) và vẫn có bài nộp của mình trong DB', async () => {
    const { service, models } = build();
    models.users.rows.push({ _id: 'sFree', role: 'STUDENT', fullName: 'Tự do', email: 'free@x' });
    const free: JwtPayload = { sub: 'sFree', email: 'free@x', role: 'STUDENT' };
    expect(await service.listMyClasses(free)).toEqual([]);
    models.submissions.rows.push(sub('sFree', 'e-x', 'AC', 1));
    expect(models.submissions.rows.filter((r) => r.userId === 'sFree')).toHaveLength(1);
  });

  it('Teacher chưa được gán lớp nhận danh sách rỗng; lớp chưa có học viên/bài trả số liệu 0 và null, không NaN', async () => {
    const { service, models } = build();
    const other: JwtPayload = { sub: 'tNew', email: 'n@x', role: 'TEACHER' };
    expect(await service.listClasses(other)).toEqual([]);
    models.classes.rows.push({ _id: OID(9), name: 'Trống', teacherId: 'tNew', studentIds: [], exerciseSlugs: [] });
    const r = await service.getOverview(other, OID(9));
    expect(r.summary).toMatchObject({ students: 0, exercises: 0, completionRate: null, passRate: null, avgAttempts: null, hintUsageRate: null });
    expect(JSON.stringify(r)).not.toContain('NaN');
    expect(r.students).toEqual([]);
    expect(r.exercises).toEqual([]);
  });
});
