import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminPortalService } from './admin-portal.service';

/**
 * Day 29: lớp còn id giảng viên "ma" (tài khoản đã bị xóa) hoặc giảng viên bị khóa không được làm kẹt việc phân công.
 */
const ADMIN: any = { sub: '507f1f77bcf86cd799439011', email: 'admin@x.vn', role: 'ADMIN' };
const CLASS_ID = '507f1f77bcf86cd7994390aa';
const GHOST = '507f1f77bcf86cd7994390f0';
const T1 = '507f1f77bcf86cd7994390b1';
const T2 = '507f1f77bcf86cd7994390b2';
const LOCKED = '507f1f77bcf86cd7994390b3';
const STUDENT = '507f1f77bcf86cd7994390b4';

const people: Record<string, any> = {
  [T1]: { _id: T1, fullName: 'Cô Lan', role: 'TEACHER', status: 'ACTIVE' },
  [T2]: { _id: T2, fullName: 'Thầy Hùng', role: 'TEACHER', status: 'ACTIVE' },
  [LOCKED]: { _id: LOCKED, fullName: 'Cô Khóa', role: 'TEACHER', status: 'LOCKED' },
  [STUDENT]: { _id: STUDENT, fullName: 'Bé Na', role: 'STUDENT', status: 'ACTIVE' },
};

function build(cls: Record<string, unknown>) {
  const pick = (filter: any) => (filter?._id?.$in ?? []).map((id: string) => people[id]).filter(Boolean);
  const users: any = { find: jest.fn((f: any) => ({ select: () => ({ lean: () => Promise.resolve(pick(f)) }) })) };
  const classes: any = {
    findById: jest.fn(() => ({ lean: () => Promise.resolve(cls) })),
    updateOne: jest.fn().mockResolvedValue({}),
    aggregate: jest.fn().mockResolvedValue([]),
  };
  const audit: any = { record: jest.fn().mockResolvedValue(undefined) };
  const svc = new AdminPortalService(users, classes, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any, audit, {} as any, {} as any);
  return { svc, classes, audit };
}

describe('assignTeachers: id "ma" và giảng viên bị khóa', () => {
  it('lớp đang có id ma: thêm giảng viên mới vẫn thành công, id ma tự được gỡ', async () => {
    const { svc, classes } = build({ name: 'K3-5', teacherId: GHOST, teacherIds: [GHOST] });
    const res = await svc.assignTeachers(ADMIN, CLASS_ID, [GHOST, T1]);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: CLASS_ID }, { $set: { teacherIds: [T1], teacherId: T1 } });
    expect(res).toMatchObject({ teacherIds: [T1], droppedIds: [GHOST] });
  });

  it('người MỚI không hợp lệ: trả 400 kèm invalidIds (chỉ id sai), không ghi gì', async () => {
    const { svc, classes } = build({ name: 'K6-9', teacherId: T1, teacherIds: [T1] });
    const err = await svc.assignTeachers(ADMIN, CLASS_ID, [T1, STUDENT, LOCKED]).catch((e) => e);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.getResponse()).toMatchObject({ code: 'E400_INVALID_TEACHERS', invalidIds: [STUDENT, LOCKED] });
    expect(classes.updateOne).not.toHaveBeenCalled();
  });

  it('giảng viên đang phụ trách mà bị khóa vẫn được giữ khi thêm người khác', async () => {
    const { svc, classes } = build({ name: 'K10-12', teacherId: LOCKED, teacherIds: [LOCKED] });
    await svc.assignTeachers(ADMIN, CLASS_ID, [LOCKED, T2]);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: CLASS_ID }, { $set: { teacherIds: [LOCKED, T2], teacherId: LOCKED } });
  });

  it('chỉ còn id ma trong danh sách gửi lên → 400 (lớp cần ít nhất một giảng viên còn tồn tại)', async () => {
    const { svc } = build({ name: 'x', teacherId: GHOST, teacherIds: [GHOST] });
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, [GHOST])).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('removeTeacher: gỡ được cả thẻ duy nhất nếu là id ma hoặc đã khóa', () => {
  it('gỡ id ma duy nhất → lớp trống giảng viên (bỏ teacherId) và ghi audit', async () => {
    const { svc, classes, audit } = build({ name: 'K3-5', teacherId: GHOST, teacherIds: [GHOST] });
    await svc.removeTeacher(ADMIN, CLASS_ID, GHOST);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: CLASS_ID }, { $set: { teacherIds: [] }, $unset: { teacherId: 1 } });
    expect(audit.record).toHaveBeenCalledWith(ADMIN, 'CLASS_ASSIGN', 'CLASS', CLASS_ID, expect.objectContaining({ teacherIds: [GHOST] }), expect.objectContaining({ teacherIds: [] }));
  });

  it('gỡ giảng viên bị khóa duy nhất được phép; gỡ giảng viên đang hoạt động duy nhất → 400', async () => {
    const locked = build({ name: 'a', teacherId: LOCKED, teacherIds: [LOCKED] });
    await expect(locked.svc.removeTeacher(ADMIN, CLASS_ID, LOCKED)).resolves.toMatchObject({ teacherIds: [] });
    const active = build({ name: 'b', teacherId: T1, teacherIds: [T1] });
    await expect(active.svc.removeTeacher(ADMIN, CLASS_ID, T1)).rejects.toBeInstanceOf(BadRequestException);
    expect(active.classes.updateOne).not.toHaveBeenCalled();
  });

  it('gỡ một trong nhiều người: người còn lại thành giảng viên chính; id không thuộc lớp → 404', async () => {
    const { svc, classes } = build({ name: 'c', teacherId: GHOST, teacherIds: [GHOST, T1] });
    await svc.removeTeacher(ADMIN, CLASS_ID, GHOST);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: CLASS_ID }, { $set: { teacherIds: [T1], teacherId: T1 } });
    await expect(svc.removeTeacher(ADMIN, CLASS_ID, T2)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('healthCheck: phát hiện giảng viên không còn tồn tại/đang khóa', () => {
  it('có lớp chứa id ma → Submissions & Classes DEGRADED', async () => {
    const classes: any = { countDocuments: jest.fn().mockResolvedValue(0), aggregate: jest.fn().mockResolvedValue([{ n: 2 }]) };
    const svc = new AdminPortalService(
      {} as any,
      classes,
      { estimatedDocumentCount: jest.fn().mockResolvedValue(5) } as any,
      { find: () => ({ select: () => ({ limit: () => ({ lean: () => Promise.resolve([]) }) }) }) } as any,
      {} as any, {} as any, {} as any,
      { db: { admin: () => ({ ping: jest.fn().mockResolvedValue({}) }) } } as any,
      {} as any,
      { keyInfo: jest.fn().mockResolvedValue({ configured: false }) } as any,
      {} as any,
    );
    const res = await svc.healthCheck(ADMIN);
    expect(res.clusters[3]).toMatchObject({ status: 'DEGRADED', detail: expect.stringContaining('2 lớp có giảng viên không còn tồn tại') });
  });
});
