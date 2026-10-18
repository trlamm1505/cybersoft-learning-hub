import 'reflect-metadata';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { AuthoringController } from '../authoring/authoring.controller';
import { AuthoringService } from '../authoring/authoring.service';
import { QuestionBankService } from '../question-bank/question-bank.service';
import { ExerciseController } from './exercise.controller';
import { studentCanSeeExercise, studentExerciseFilter } from './exercise-matrix';
import { assertCanModifyExercise, exerciseUsage } from './exercise-usage';

/** Day 29 — SEC-03/04/10/24/25, PRV-03/04: chặn ẩn danh, lộ chéo khối và IDOR khi sửa/xóa bài. */

const guardsOf = (target: object, method: string) =>
  (Reflect.getMetadata(GUARDS_METADATA, (target as any).prototype[method]) ?? []) as unknown[];

describe('Bắt buộc đăng nhập (401 khi không có token)', () => {
  it.each([
    [AuthoringController, 'findAll'],
    [ExerciseController, 'findAll'],
    [ExerciseController, 'findBySlug'],
  ])('%p.%s dùng JwtAuthGuard', (ctrl, method) => {
    expect(guardsOf(ctrl, method)).toContain(JwtAuthGuard);
  });
});

describe('Luật khối cho học viên (targetGroup + gradeBand + bankBand)', () => {
  const demoDash = { slug: 'demo-dash-ex-loops', bankBand: '6-9' };
  const k1012 = { targetGroup: 'K10_12', gradeBand: '9-12', bankBand: '10-12' };
  const kid = { targetGroup: 'K3_5', gradeBand: '3-5' };

  it('học sinh 3-5 chỉ thấy bài 3-5: không thấy bài demo-dash chỉ có bankBand, không thấy bài 6-9/10-12', () => {
    expect(studentCanSeeExercise(kid, '3-5')).toBe(true);
    expect(studentCanSeeExercise(demoDash, '3-5')).toBe(false);
    expect(studentCanSeeExercise(k1012, '3-5')).toBe(false);
    expect(studentCanSeeExercise({ gradeBand: '6-9' }, '3-5')).toBe(false);
    expect(studentCanSeeExercise({}, '3-5')).toBe(false);
    expect(JSON.stringify(studentExerciseFilter('3-5'))).toContain('"targetGroup":"K3_5"');
  });

  it('bankBand cũng được xét: bài bankBand 10-12 không lọt sang 6-9 và ngược lại', () => {
    expect(studentCanSeeExercise({ bankBand: '10-12' }, '6-9')).toBe(false);
    expect(studentCanSeeExercise(demoDash, '6-9')).toBe(true);
    expect(studentCanSeeExercise(k1012, '10-12')).toBe(true);
    expect(studentCanSeeExercise({ gradeBand: '10-12' }, '10-12')).toBe(true);
    expect(studentCanSeeExercise(demoDash, '10-12')).toBe(false);
    expect(JSON.stringify(studentExerciseFilter('6-9'))).toContain('"bankBand":{"$in":["6-9"]}');
  });

  it('học viên chưa có khối học (M7) không thấy bài nào', () => {
    expect(studentCanSeeExercise({}, undefined)).toBe(false);
    expect(studentExerciseFilter(undefined)).toEqual({ _id: { $exists: false } });
  });
});

describe('Quyền sửa/xóa bài và mức sử dụng', () => {
  const teacherB = { sub: 'tB', email: 'b@x', role: 'TEACHER' };
  const admin = { sub: 'a', email: 'a@x', role: 'ADMIN' };

  it('bài Playground cố định → 403 E403_PLAYGROUND_FIXED kể cả Admin; bài của giảng viên khác → 403', () => {
    expect(() => assertCanModifyExercise({}, admin)).toThrow(ForbiddenException);
    expect(() => assertCanModifyExercise({ bankOnly: true, authorId: 'tA' }, teacherB)).toThrow(/chính mình/);
    expect(() => assertCanModifyExercise({ bankOnly: true, authorId: 'tA' }, admin)).not.toThrow();
    expect(() => assertCanModifyExercise({ bankOnly: true }, teacherB)).not.toThrow();
  });

  it('usage đếm cả classroom.exerciseSlugs (luồng giao bài cũ) bên cạnh class_assignments và cuộc thi', async () => {
    const use = await exerciseUsage(
      {
        assignments: { aggregate: jest.fn().mockResolvedValue([{ _id: 'a', n: 1 }]) } as any,
        classes: { aggregate: jest.fn().mockResolvedValue([{ _id: 'a', n: 2 }, { _id: 'b', n: 1 }]) } as any,
        contests: { find: () => ({ select: () => ({ lean: () => Promise.resolve([{ problems: [{ source: 'exercise', slug: 'b' }] }]) }) }) } as any,
      },
      ['a', 'b', 'c'],
    );
    expect(Object.fromEntries(use)).toEqual({ a: { classes: 3, contests: 0 }, b: { classes: 1, contests: 1 }, c: { classes: 0, contests: 0 } });
  });
});

describe('AuthoringService: IDOR qua _id của exercise', () => {
  const teacherB = { sub: 'tB', role: 'TEACHER' };
  const build = (exercise: any, inUse = 0) => {
    const exerciseModel: any = {
      findById: jest.fn(() => ({ exec: () => Promise.resolve(exercise) })),
      findByIdAndDelete: jest.fn(() => ({ exec: () => Promise.resolve(exercise) })),
      deleteOne: jest.fn().mockResolvedValue({}),
      aggregate: jest.fn().mockResolvedValue([]),
    };
    const lessonModel: any = { findById: jest.fn(() => ({ exec: () => Promise.resolve(null) })) };
    const assignments: any = { aggregate: jest.fn().mockResolvedValue(inUse ? [{ _id: exercise?.slug, n: inUse }] : []) };
    const svc = new AuthoringService(lessonModel, exerciseModel, {} as any, assignments, undefined, undefined);
    return { svc, exerciseModel };
  };

  it('giảng viên B không xóa được bài của giảng viên A; không xóa bài Playground cố định', async () => {
    const owned = build({ _id: 'e1', slug: 'bai-a', bankOnly: true, authorId: 'tA' });
    await expect(owned.svc.deleteLesson('e1', teacherB)).rejects.toThrow(/chính mình/);
    expect(owned.exerciseModel.findByIdAndDelete).not.toHaveBeenCalled();
    const fixed = build({ _id: 'e2', slug: 'tinh-tong' });
    await expect(fixed.svc.deleteLesson('e2', { sub: 'a', role: 'ADMIN' })).rejects.toMatchObject({ response: { code: 'E403_PLAYGROUND_FIXED' } });
  });

  it('bài đang được gán trong lớp → 409, không xóa', async () => {
    const used = build({ _id: 'e3', slug: 'bai-chung', bankOnly: true }, 2);
    await expect(used.svc.deleteLesson('e3', teacherB)).rejects.toBeInstanceOf(ConflictException);
    expect(used.exerciseModel.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('"Sửa" (chuyển exercise thành lesson) bài của người khác → 403 trước khi xóa bản gốc', async () => {
    const owned = build({ _id: 'e1', slug: 'bai-a', title: 'A', description: 'd', solutionCode: 'print(1)', testCases: [{ input: '', expectedOutput: '1' }], bankOnly: true, authorId: 'tA' });
    await expect(owned.svc.updateLesson('e1', { title: 'x' } as any, teacherB)).rejects.toThrow(ForbiddenException);
    expect(owned.exerciseModel.deleteOne).not.toHaveBeenCalled();
  });
});

describe('AuthoringService.findAll cho học viên', () => {
  it('chỉ bài đã xuất bản (không nhận bài thiếu status), đúng loại theo khối, không authorId, không gợi ý tầng 3', async () => {
    const lessons = [{ _id: 'l1', slug: 'blk', type: 'block', status: 'published', authorId: 'teacher-1', hints: { hint1: 'a', hint2: 'b', hint3: 'print(1)' } }];
    const lessonModel: any = { find: jest.fn(() => ({ sort: () => ({ lean: () => ({ exec: () => Promise.resolve(lessons) }) }) })) };
    const exerciseModel: any = { aggregate: jest.fn().mockResolvedValue([]) };
    const svc = new AuthoringService(lessonModel, exerciseModel, {} as any);
    const list: any[] = await svc.findAll(true, { ageGroup: '3-5' });
    expect(lessonModel.find).toHaveBeenCalledWith({ status: 'published', type: { $in: ['block'] }, $or: [{ authorId: 'teacher-1' }, { authorId: { $exists: false } }] });
    expect(list[0].authorId).toBeUndefined();
    expect(list[0].hints).toEqual({ hint1: 'a', hint2: 'b', hint3: '' });
    const match = exerciseModel.aggregate.mock.calls[0][0][0].$match;
    expect(match).toMatchObject({ bankOnly: { $ne: true } });
    expect(JSON.stringify(match)).toContain('"targetGroup":"K3_5"');
  });
});

describe('QuestionBankService: chỉ bài của mình, đúng khối mình phụ trách', () => {
  const q = (value: unknown) => {
    const c: Record<string, unknown> = {};
    for (const m of ['select', 'sort', 'skip', 'limit']) c[m] = () => c;
    c.lean = () => Promise.resolve(value);
    return c;
  };
  const build = (doc: unknown, classes: unknown[] = [{ ageGroup: '6-9' }]) =>
    new QuestionBankService(
      { findOne: jest.fn(() => q(doc)), deleteOne: jest.fn(), updateOne: jest.fn() } as never,
      { find: jest.fn(() => q(classes)) } as never,
      { aggregate: jest.fn().mockResolvedValue([]) } as never,
      { find: jest.fn(() => q([])) } as never,
    );
  const teacher = { sub: 't1', role: 'TEACHER' } as never;

  it('bài của giảng viên khác → 403; bài khối 10-12 với giảng viên chỉ dạy 6-9 → 403 E403_BAND_NOT_OWNED', async () => {
    await expect(build({ slug: 'x', bankOnly: true, bankBand: '6-9', authorId: 'other' }).remove(teacher, 'x')).rejects.toThrow(/chính mình/);
    await expect(build({ slug: 'y', bankOnly: true, bankBand: '10-12', authorId: 't1' }).remove(teacher, 'y')).rejects.toMatchObject({ response: { code: 'E403_BAND_NOT_OWNED' } });
    await expect(build({ slug: 'z', bankOnly: true, bankBand: '6-9', authorId: 't1' }).remove(teacher, 'z')).resolves.toEqual({ deleted: true, slug: 'z' });
  });
});
