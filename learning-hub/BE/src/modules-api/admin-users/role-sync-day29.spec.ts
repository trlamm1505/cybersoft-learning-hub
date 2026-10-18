import { BadRequestException, ConflictException } from '@nestjs/common';
import { fakeModel } from '../teacher-analytics/fake-model';
import { AdminUsersService } from './admin-users.service';

/** Day 29: đổi vai trò/khóa tài khoản phải giữ đồng bộ với lớp học (không để lớp kẹt hay sĩ số lệch). */
const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const ADMIN: any = { sub: OID(1), email: 'a@x', role: 'ADMIN' };
const T1 = OID(3);
const S1 = OID(11);

function build(classes: any[] = []) {
  const m = {
    users: fakeModel([
      { _id: OID(1), fullName: 'Admin', email: 'a@x', role: 'ADMIN' },
      { _id: T1, fullName: 'Cô Lan', email: 'lan@x', role: 'TEACHER', ageGroup: 'CAREER_ADULT' },
      { _id: S1, fullName: 'Bé Na', email: 'na@x', role: 'STUDENT', ageGroup: '3-5', studentCode: 'C0001' },
    ]),
    counters: fakeModel([{ _id: 'c', key: 'studentCode', seq: 1 }]),
    classes: fakeModel(classes),
  };
  const service = new AdminUsersService(m.users as any, m.counters as any, m.classes as any, fakeModel([]) as any, fakeModel([]) as any, fakeModel([]) as any, fakeModel([]) as any, {} as any);
  return { service, m };
}

describe('setRole STUDENT → TEACHER', () => {
  it('bỏ khối học ($unset ageGroup) và rút khỏi studentIds của mọi lớp', async () => {
    const { service, m } = build([{ _id: OID(50), name: 'K3-5', teacherId: T1, studentIds: [S1, OID(12)] }]);
    const row = await service.setRole(ADMIN, S1, 'TEACHER');
    expect(row).toMatchObject({ role: 'TEACHER', ageGroup: null });
    expect(m.users.updateOne).toHaveBeenCalledWith({ _id: S1 }, { $set: { role: 'TEACHER' }, $unset: { ageGroup: 1 } });
    expect(m.classes.rows[0].studentIds).toEqual([OID(12)]);
  });
});

describe('đổi khối học của học viên', () => {
  const classes = () => [
    { _id: OID(50), name: 'K3-5', ageGroup: '3-5', teacherId: T1, studentIds: [S1, OID(12)] },
    { _id: OID(51), name: 'K6-9', ageGroup: '6-9', teacherId: T1, studentIds: [OID(13)] },
  ];

  it('3-5 → Người đi làm: rút khỏi lớp 3-5, người khác trong lớp giữ nguyên', async () => {
    const { service, m } = build(classes());
    await service.update(ADMIN, S1, { ageGroup: 'CAREER_ADULT' });
    expect(m.classes.rows[0].studentIds).toEqual([OID(12)]);
    expect(m.classes.rows[1].studentIds).toEqual([OID(13)]);
  });

  it('3-5 → 6-9: rút khỏi lớp 3-5; chỉ đổi tên (không đổi khối) thì giữ nguyên lớp', async () => {
    const { service, m } = build(classes());
    await service.update(ADMIN, S1, { fullName: 'Bé Na 2' });
    expect(m.classes.rows[0].studentIds).toEqual([S1, OID(12)]);
    await service.update(ADMIN, S1, { ageGroup: '3-5' });
    expect(m.classes.rows[0].studentIds).toEqual([S1, OID(12)]);
    await service.update(ADMIN, S1, { ageGroup: '6-9' });
    expect(m.classes.rows[0].studentIds).toEqual([OID(12)]);
  });
});

describe('create / update: giảng viên không có khối học', () => {
  it('tạo giảng viên kèm ageGroup → không lưu ageGroup', async () => {
    const { service, m } = build();
    const row = await service.create(ADMIN, { fullName: 'GV', email: 'gv@x.vn', password: 'matkhau1', role: 'TEACHER', ageGroup: '3-5' });
    expect(m.users.rows.at(-1)!.ageGroup).toBeUndefined();
    expect(row.ageGroup).toBeNull();
  });

  it('sửa khối học của giảng viên → 400; danh sách không hiện khối học cũ còn sót của giảng viên', async () => {
    const { service } = build();
    await expect(service.update(ADMIN, T1, { ageGroup: '6-9' })).rejects.toBeInstanceOf(BadRequestException);
    const list = await service.list(ADMIN, {});
    expect(list.items.find((u) => u.id === T1)!.ageGroup).toBeNull();
    expect(list.items.find((u) => u.id === S1)!.ageGroup).toBe('3-5');
  });
});

describe('khóa giảng viên đang đứng lớp', () => {
  const led = [{ _id: OID(60), name: 'Lớp K6-9', teacherId: OID(99), teacherIds: [OID(99), T1], archived: false }];

  it('setStatus LOCKED → 409 kèm danh sách lớp; lớp đã lưu trữ thì không chặn', async () => {
    const { service, m } = build(led);
    const err = await service.setStatus(ADMIN, T1, 'LOCKED').catch((e) => e);
    expect(err).toBeInstanceOf(ConflictException);
    expect(err.getResponse()).toMatchObject({ classes: [{ id: OID(60), name: 'Lớp K6-9' }] });
    expect(m.users.updateOne).not.toHaveBeenCalled();
    const archived = build([{ ...led[0], archived: true }]);
    await expect(archived.service.setStatus(ADMIN, T1, 'LOCKED')).resolves.toMatchObject({ status: 'LOCKED' });
  });

  it('bulkSetStatus bỏ qua giảng viên còn đứng lớp (có lý do), vẫn khóa học viên', async () => {
    const { service } = build(led);
    const res = await service.bulkSetStatus(ADMIN, [T1, S1], false);
    expect(res.changed.map((c) => c.id)).toEqual([S1]);
    expect(res.skipped).toEqual([{ id: T1, reason: expect.stringContaining('phụ trách 1 lớp') }]);
  });
});
