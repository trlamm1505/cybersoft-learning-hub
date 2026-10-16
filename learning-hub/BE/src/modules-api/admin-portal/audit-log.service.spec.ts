import { AuditLogService } from './audit-log.service';

const ADMIN = { sub: '507f1f77bcf86cd799439011', email: 'admin@x.vn', role: 'ADMIN' };

function build(rows: unknown[] = []) {
  const chain: any = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(rows),
  };
  const logs: any = {
    create: jest.fn().mockResolvedValue({}),
    find: jest.fn().mockReturnValue(chain),
    countDocuments: jest.fn().mockResolvedValue(rows.length),
  };
  const users: any = {
    findById: jest.fn().mockReturnValue({ select: () => ({ lean: () => Promise.resolve({ fullName: 'An', email: 'an@x.vn', role: 'STUDENT' }) }) }),
  };
  return { svc: new AuditLogService(logs, users), logs, users, chain };
}

describe('AuditLogService', () => {
  it('record ghi actor, hành động, đối tượng và diff before/after', async () => {
    const { svc, logs } = build();
    await svc.record(ADMIN, 'USER_LOCK', 'USER', 'u1', { status: 'ACTIVE' }, { status: 'LOCKED' });
    const doc = logs.create.mock.calls[0][0];
    expect(doc).toMatchObject({
      actorId: ADMIN.sub,
      actorEmail: 'admin@x.vn',
      action: 'USER_LOCK',
      targetType: 'USER',
      targetId: 'u1',
      diff: { before: { status: 'ACTIVE' }, after: { status: 'LOCKED' } },
    });
    expect(doc.timestamp).toBeInstanceOf(Date);
  });

  it('lỗi ghi log không làm hỏng thao tác của Admin', async () => {
    const { svc, logs } = build();
    logs.create.mockRejectedValue(new Error('db down'));
    await expect(svc.record(ADMIN, 'CONFIG_UPDATE', 'CONFIG', 'k', null, null)).resolves.toBeUndefined();
  });

  it('list phân trang, lọc theo hành động và tìm theo email người thực hiện (escape regex)', async () => {
    const { svc, logs, chain } = build([
      { _id: 'a1', timestamp: new Date(), actorId: 'x', actorEmail: 'admin@x.vn', action: 'USER_LOCK', targetType: 'USER', targetId: 'u1', diff: {} },
    ]);
    const res = await svc.list({ page: '2', pageSize: '10', action: 'USER_LOCK', actor: 'ad.min' });
    const filter = logs.find.mock.calls[0][0];
    expect(filter.action).toBe('USER_LOCK');
    expect(filter.actorEmail.$regex).toBe('ad\\.min');
    expect(chain.skip).toHaveBeenCalledWith(10);
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(res.items[0]).toMatchObject({ id: 'a1', action: 'USER_LOCK' });
  });

  it('list với action lạ trả rỗng thay vì truy vấn bừa; pageSize bị chặn ở 100', async () => {
    const { svc, logs, chain } = build();
    expect((await svc.list({ action: 'DROP_ALL' })).items).toEqual([]);
    expect(logs.find).not.toHaveBeenCalled();
    await svc.list({ pageSize: '9999' });
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it('list bổ sung tên giảng viên cho bản ghi gán lớp cũ chỉ có id (giao diện không phải in mã)', async () => {
    const T1 = '507f1f77bcf86cd7994390b1';
    const { svc, users } = build([
      { _id: 'a1', timestamp: new Date(), actorId: 'x', actorEmail: 'a@x', action: 'CLASS_ASSIGN', targetType: 'CLASS', targetId: 'c', diff: { before: { teacherIds: [T1] }, after: { teacherIds: [T1], teacherNames: ['Đã có tên'] } } },
    ]);
    users.find = jest.fn().mockReturnValue({ select: () => ({ lean: () => Promise.resolve([{ _id: T1, fullName: 'Cô Nguyễn Thị Lan' }]) }) });
    const res = await svc.list({});
    expect((res.items[0].diff as any).before.teacherNames).toEqual(['Cô Nguyễn Thị Lan']);
    expect((res.items[0].diff as any).after.teacherNames).toEqual(['Đã có tên']);
  });

  it('userSnapshot không chứa mật khẩu và trả null khi id sai', async () => {
    const { svc } = build();
    expect(await svc.userSnapshot('xyz')).toBeNull();
    const snap = await svc.userSnapshot(ADMIN.sub);
    expect(snap).toEqual({ fullName: 'An', email: 'an@x.vn', role: 'STUDENT', ageGroup: null, status: 'ACTIVE' });
    expect(Object.keys(snap!)).not.toContain('password');
  });
});
