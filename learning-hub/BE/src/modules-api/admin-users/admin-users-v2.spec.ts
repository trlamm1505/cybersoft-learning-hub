import { BadRequestException, ForbiddenException, RequestMethod } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

const ADMIN: any = { sub: '507f1f77bcf86cd799439011', email: 'admin@x.vn', role: 'ADMIN' };
const TEACHER: any = { sub: '507f1f77bcf86cd799439012', email: 't@x.vn', role: 'TEACHER' };
const U1 = '507f1f77bcf86cd7994390c1';
const U2 = '507f1f77bcf86cd7994390c2';
const U3 = '507f1f77bcf86cd7994390c3';

const sel = (v: unknown) => ({
  select: () => ({
    lean: () => Promise.resolve(v),
    sort: () => ({ skip: () => ({ limit: () => ({ lean: () => Promise.resolve(v) }) }) }),
  }),
});

function build(found: any[] = []) {
  const users: any = {
    findById: jest.fn((id: string) => sel(found.find((u) => String(u._id) === id) ?? null)),
    find: jest.fn(() => sel(found)),
    countDocuments: jest.fn().mockResolvedValue(found.length),
    updateOne: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({}),
    exists: jest.fn().mockResolvedValue(null),
    create: jest.fn((d: any) => Promise.resolve({ toObject: () => ({ _id: 'new1', ...d }) })),
  };
  const classes: any = { find: jest.fn(() => sel([])) };
  const counters: any = { findOneAndUpdate: jest.fn().mockResolvedValue({ seq: 1 }) };
  const svc = new AdminUsersService(users, counters, classes, {} as any, {} as any, {} as any, {} as any, {} as any);
  return { svc, users, classes };
}

describe('AdminUsersService.list: lọc theo khối học', () => {
  it('lọc ageGroup hợp lệ và từ chối giá trị lạ', async () => {
    const { svc, users } = build();
    await svc.list(ADMIN, { ageGroup: 'CAREER_ADULT' });
    expect(users.find.mock.calls[0][0]).toMatchObject({ ageGroup: 'CAREER_ADULT' });
    await expect(svc.list(ADMIN, { ageGroup: '13-15' })).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AdminUsersService.create: khối học & không tạo ADMIN', () => {
  const body = { fullName: 'An', email: 'an@x.vn', password: 'matkhau1', role: 'STUDENT' };

  it('tạo học viên kèm khối học', async () => {
    const { svc, users } = build();
    const row = await svc.create(ADMIN, { ...body, ageGroup: '6-9' });
    expect(users.create.mock.calls[0][0]).toMatchObject({ role: 'STUDENT', ageGroup: '6-9' });
    expect(row.ageGroup).toBe('6-9');
  });

  it('khối học lạ bị từ chối; vai trò ADMIN bị cấm', async () => {
    const { svc } = build();
    await expect(svc.create(ADMIN, { ...body, ageGroup: 'abc' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.create(ADMIN, { ...body, role: 'ADMIN' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('AdminUsersService.update', () => {
  it('sửa họ tên/khối học; không trả hash mật khẩu', async () => {
    const { svc, users } = build([{ _id: U1, email: 'a@x.vn', role: 'STUDENT', fullName: 'Cũ' }]);
    const row = await svc.update(ADMIN, U1, { fullName: ' Mới ', ageGroup: '10-12' });
    expect(users.updateOne).toHaveBeenCalledWith({ _id: U1 }, { $set: { fullName: 'Mới', ageGroup: '10-12' } });
    expect(row).toMatchObject({ fullName: 'Mới', ageGroup: '10-12', passwordReset: false });
    expect(JSON.stringify(row)).not.toMatch(/password"\s*:\s*"/);
  });

  it('đặt lại mật khẩu: băm bcrypt và hủy phiên đăng nhập cũ', async () => {
    const { svc, users } = build([{ _id: U1, email: 'a@x.vn', role: 'STUDENT' }]);
    const row = await svc.update(ADMIN, U1, { password: 'matkhaumoi' });
    const set = users.updateOne.mock.calls[0][1].$set;
    expect(await bcrypt.compare('matkhaumoi', set.password)).toBe(true);
    expect(set.sessionsRevokedAt).toBeInstanceOf(Date);
    expect(row.passwordReset).toBe(true);
    expect(JSON.stringify(row)).not.toContain(set.password);
  });

  it('từ chối: không có gì để sửa, mật khẩu quá ngắn, họ tên rỗng, không phải ADMIN', async () => {
    const { svc } = build([{ _id: U1, email: 'a@x.vn', role: 'STUDENT' }]);
    await expect(svc.update(ADMIN, U1, {})).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update(ADMIN, U1, { password: '123' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update(ADMIN, U1, { fullName: '  ' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update(TEACHER, U1, { fullName: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('AdminUsersService.bulkSetStatus', () => {
  const rows = () => [
    { _id: U1, email: 'a@x.vn', role: 'STUDENT', status: 'ACTIVE' },
    { _id: U2, email: 'b@x.vn', role: 'TEACHER', status: 'LOCKED' },
    { _id: ADMIN.sub, email: 'admin@x.vn', role: 'ADMIN', status: 'ACTIVE' },
    { _id: U3, email: 'c@x.vn', role: 'STUDENT' },
  ];

  it('khóa hàng loạt: chỉ đổi người đủ điều kiện, bỏ qua ADMIN/đã khóa/id sai kèm lý do', async () => {
    const { svc, users } = build(rows());
    const res = await svc.bulkSetStatus(ADMIN, [U1, U2, ADMIN.sub, U3, 'bad', U1], false);
    expect(res.updated).toBe(2);
    expect(res.changed.map((c) => c.id)).toEqual([U1, U3]);
    expect(res.changed[0]).toMatchObject({ before: 'ACTIVE', after: 'LOCKED' });
    expect(users.updateMany).toHaveBeenCalledWith({ _id: { $in: [U1, U3] } }, { $set: { status: 'LOCKED' } });
    expect(res.skipped.map((s) => s.id).sort()).toEqual([ADMIN.sub, U2, 'bad'].sort());
  });

  it('mở khóa hàng loạt', async () => {
    const { svc, users } = build(rows());
    const res = await svc.bulkSetStatus(ADMIN, [U1, U2], true);
    expect(res.changed).toEqual([{ id: U2, email: 'b@x.vn', before: 'LOCKED', after: 'ACTIVE' }]);
    expect(users.updateMany).toHaveBeenCalledWith({ _id: { $in: [expect.anything()] } }, { $set: { status: 'ACTIVE' } });
  });

  it('không tự khóa chính mình; mảng rỗng/quá 100/isActive sai kiểu bị từ chối', async () => {
    const { svc, users } = build([{ _id: ADMIN.sub, role: 'TEACHER', email: 'x', status: 'ACTIVE' }]);
    const res = await svc.bulkSetStatus(ADMIN, [ADMIN.sub], false);
    expect(res.updated).toBe(0);
    expect(users.updateMany).not.toHaveBeenCalled();
    await expect(svc.bulkSetStatus(ADMIN, [], false)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.bulkSetStatus(ADMIN, Array(101).fill(U1), false)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.bulkSetStatus(ADMIN, [U1], 'false')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.bulkSetStatus(TEACHER, [U1], true)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('AdminUsersController: audit log và không có xóa cứng', () => {
  function ctl(result: any, before: any = { status: 'ACTIVE' }) {
    const service: any = {
      setStatus: jest.fn().mockResolvedValue(result),
      setRole: jest.fn().mockResolvedValue(result),
      update: jest.fn().mockResolvedValue({ ...result, passwordReset: true }),
      bulkSetStatus: jest.fn().mockResolvedValue({ updated: 1, changed: [{ id: U1, email: 'a', before: 'ACTIVE', after: 'LOCKED' }], skipped: [] }),
      create: jest.fn().mockResolvedValue({ id: 'n1', fullName: 'An', email: 'a@x.vn', role: 'STUDENT', ageGroup: '3-5' }),
    };
    const audit: any = { record: jest.fn(), userSnapshot: jest.fn().mockResolvedValue(before) };
    return { c: new AdminUsersController(service, audit), audit, service };
  }

  it('khóa/mở khóa ghi USER_LOCK / USER_UNLOCK kèm before/after', async () => {
    const lock = ctl({ status: 'LOCKED' });
    await lock.c.setStatus(ADMIN, U1, { status: 'LOCKED' });
    expect(lock.audit.record).toHaveBeenCalledWith(ADMIN, 'USER_LOCK', 'USER', U1, { status: 'ACTIVE' }, { status: 'LOCKED' });
    const unlock = ctl({ status: 'ACTIVE' }, { status: 'LOCKED' });
    await unlock.c.setStatus(ADMIN, U1, { status: 'ACTIVE' });
    expect(unlock.audit.record.mock.calls[0][1]).toBe('USER_UNLOCK');
  });

  it('không ghi log khi trạng thái không đổi', async () => {
    const { c, audit } = ctl({ status: 'ACTIVE' });
    await c.setStatus(ADMIN, U1, { status: 'ACTIVE' });
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('đổi vai trò ghi ROLE_CHANGE; bulk ghi BULK_LOCK / BULK_UNLOCK; sửa người dùng không ghi mật khẩu', async () => {
    const r = ctl({ role: 'TEACHER', status: 'ACTIVE' }, { role: 'STUDENT', status: 'ACTIVE' });
    await r.c.setRole(ADMIN, U1, { role: 'TEACHER' });
    expect(r.audit.record).toHaveBeenCalledWith(ADMIN, 'ROLE_CHANGE', 'USER', U1, { role: 'STUDENT', status: 'ACTIVE' }, { role: 'TEACHER', status: 'ACTIVE' });

    const b = ctl({});
    await b.c.bulkStatus(ADMIN, { userIds: [U1], isActive: false });
    expect(b.audit.record.mock.calls[0].slice(1, 3)).toEqual(['BULK_LOCK', 'USER']);
    await b.c.bulkStatus(ADMIN, { userIds: [U1], isActive: true });
    expect(b.audit.record.mock.calls[1][1]).toBe('BULK_UNLOCK');

    const u = ctl({ fullName: 'An', ageGroup: '3-5' });
    await u.c.update(ADMIN, U1, { password: 'bimat-khong-duoc-log' });
    expect(JSON.stringify(u.audit.record.mock.calls)).not.toContain('bimat-khong-duoc-log');
    expect(u.audit.record.mock.calls[0][1]).toBe('USER_UPDATE');
  });

  it('bulk không đổi ai thì không ghi log rỗng', async () => {
    const { c, audit, service } = ctl({});
    service.bulkSetStatus.mockResolvedValue({ updated: 0, changed: [], skipped: [{ id: U1, reason: 'x' }] });
    await c.bulkStatus(ADMIN, { userIds: [U1], isActive: false });
    expect(audit.record).not.toHaveBeenCalled();
  });

  it('controller KHÔNG có endpoint xóa cứng người dùng', () => {
    const proto = AdminUsersController.prototype as any;
    expect(Object.getOwnPropertyNames(proto).filter((n) => /delete|remove|destroy/i.test(n))).toEqual([]);
    for (const name of Object.getOwnPropertyNames(proto)) {
      if (name === 'constructor') continue;
      expect(Reflect.getMetadata('method', proto[name])).not.toBe(RequestMethod.DELETE);
    }
  });
});
