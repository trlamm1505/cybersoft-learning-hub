import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { AuthService } from '../auth/auth.service';
import { checkProfileInput, MAX_BIO, MAX_NAME } from '../auth/profile-input';
import { fakeModel } from '../teacher-analytics/fake-model';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const ADMIN_ID = OID(1);
const T_ID = OID(3);
const T2_ID = OID(4);
const S1 = OID(11);
const ADMIN: JwtPayload = { sub: ADMIN_ID, email: 'a@x', role: 'ADMIN' };
const TEACHER: JwtPayload = { sub: T_ID, email: 't@x', role: 'TEACHER' };
const STUDENT: JwtPayload = { sub: S1, email: 's@x', role: 'STUDENT' };

const users = () => [
  { _id: ADMIN_ID, fullName: 'Admin', email: 'admin@x.com', role: 'ADMIN' },
  { _id: T_ID, fullName: 'Cô Lan', email: 'lan@x.com', role: 'TEACHER' },
  {
    _id: T2_ID,
    fullName: 'Thầy Minh',
    email: 'minh@x.com',
    role: 'TEACHER',
    studentCode: 'C0099',
  },
  {
    _id: S1,
    fullName: 'An',
    email: 'an@x.com',
    role: 'STUDENT',
    studentCode: 'C0001',
  },
];

function build(classes: any[] = []) {
  const m = {
    users: fakeModel(users()),
    counters: fakeModel([{ _id: 'c', key: 'studentCode', seq: 10 }]),
    classes: fakeModel(classes),
  };
  const empty = fakeModel([]);
  const service = new AdminUsersService(
    m.users as any,
    m.counters as any,
    m.classes as any,
    empty as any,
    empty as any,
    empty as any,
    empty as any,
    { getActivity: jest.fn() } as any,
  );
  return { service, m };
}

const row = (m: ReturnType<typeof build>['m'], id: string) =>
  m.users.rows.find((u) => u._id === id)!;

describe('Thu hồi quyền giảng viên', () => {
  it('mode STUDENT: hạ về học viên, cấp mã học viên nếu chưa có, hủy phiên đăng nhập ngay', async () => {
    const { service, m } = build();
    const before = Date.now();
    const r = await service.revokeTeacher(ADMIN, T_ID, 'STUDENT');
    expect(r).toMatchObject({ id: T_ID, role: 'STUDENT', status: 'ACTIVE' });
    expect(r.studentCode).toMatch(/^C\d{4}$/);
    const saved = row(m, T_ID);
    expect(saved.role).toBe('STUDENT');
    expect(new Date(saved.sessionsRevokedAt).getTime()).toBeGreaterThanOrEqual(
      before,
    );
    expect(JSON.stringify(r)).not.toContain('sessionsRevokedAt');
  });

  it('giảng viên đã có mã học viên thì giữ mã cũ', async () => {
    const { service } = build();
    expect(
      (await service.revokeTeacher(ADMIN, T2_ID, 'STUDENT')).studentCode,
    ).toBe('C0099');
  });

  it('mode LOCK: khóa hẳn tài khoản (vẫn giữ dữ liệu), hủy phiên đăng nhập', async () => {
    const { service, m } = build();
    const r = await service.revokeTeacher(ADMIN, T_ID, 'LOCK');
    expect(r).toMatchObject({ role: 'TEACHER', status: 'LOCKED' });
    expect(row(m, T_ID).sessionsRevokedAt).toBeInstanceOf(Date);
  });

  it('mặc định (không truyền mode) là hạ về học viên', async () => {
    const { service } = build();
    await expect(service.revokeTeacher(ADMIN, T_ID)).resolves.toMatchObject({
      role: 'STUDENT',
    });
  });

  it('còn phụ trách lớp: 409 kèm danh sách lớp phải chuyển giao, không đổi gì', async () => {
    const { service, m } = build([
      {
        _id: OID(50),
        name: 'Lớp A',
        teacherId: T_ID,
        studentIds: [],
        exerciseSlugs: [],
      },
      {
        _id: OID(51),
        name: 'Lớp B (lưu trữ)',
        teacherId: T_ID,
        archived: true,
        studentIds: [],
        exerciseSlugs: [],
      },
      {
        _id: OID(52),
        name: 'Lớp của người khác',
        teacherId: T2_ID,
        studentIds: [],
        exerciseSlugs: [],
      },
    ]);
    let err: any;
    await service.revokeTeacher(ADMIN, T_ID, 'STUDENT').catch((e) => (err = e));
    expect(err).toBeInstanceOf(ConflictException);
    const body = err.getResponse();
    expect(body.message).toMatch(/phụ trách 2 lớp.*chuyển giao/);
    expect(body.classes.map((c: any) => c.name).sort()).toEqual([
      'Lớp A',
      'Lớp B (lưu trữ)',
    ]);
    await expect(
      service.revokeTeacher(ADMIN, T_ID, 'LOCK'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(row(m, T_ID)).toMatchObject({ role: 'TEACHER' });
    expect(row(m, T_ID).sessionsRevokedAt).toBeUndefined();
    expect(row(m, T_ID).status).toBeUndefined();
  });

  it('chuyển giao lớp xong thì thu hồi được', async () => {
    const { service, m } = build([
      {
        _id: OID(50),
        name: 'Lớp A',
        teacherId: T_ID,
        studentIds: [],
        exerciseSlugs: [],
      },
    ]);
    await expect(service.revokeTeacher(ADMIN, T_ID)).rejects.toBeInstanceOf(
      ConflictException,
    );
    m.classes.rows[0].teacherId = T2_ID; // Admin gán giảng viên khác
    await expect(service.revokeTeacher(ADMIN, T_ID)).resolves.toMatchObject({
      role: 'STUDENT',
    });
  });

  it('đổi vai trò giảng viên → học viên cũng đi qua luồng này (cùng kiểm tra lớp, cùng hủy phiên)', async () => {
    const { service, m } = build([
      {
        _id: OID(50),
        name: 'Lớp A',
        teacherId: T_ID,
        studentIds: [],
        exerciseSlugs: [],
      },
    ]);
    await expect(
      service.setRole(ADMIN, T_ID, 'STUDENT'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(
      service.setRole(ADMIN, T2_ID, 'STUDENT'),
    ).resolves.toMatchObject({ role: 'STUDENT' });
    expect(row(m, T2_ID).sessionsRevokedAt).toBeInstanceOf(Date);
  });

  it('nâng học viên lên giảng viên: không hủy phiên của họ', async () => {
    const { service, m } = build();
    await expect(service.setRole(ADMIN, S1, 'TEACHER')).resolves.toMatchObject({
      role: 'TEACHER',
    });
    expect(row(m, S1).sessionsRevokedAt).toBeUndefined();
  });

  it('chỉ áp dụng cho giảng viên; mode sai; không tự thu hồi mình; id sai', async () => {
    const { service, m } = build();
    await expect(service.revokeTeacher(ADMIN, S1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.revokeTeacher(ADMIN, ADMIN_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.revokeTeacher(ADMIN, T_ID, 'DELETE'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.revokeTeacher({ ...ADMIN, sub: T_ID }, T_ID),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.revokeTeacher(ADMIN, 'abc')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(m.users.updateOne).not.toHaveBeenCalled();
  });

  it('giảng viên và học viên không thu hồi được quyền của ai', async () => {
    const { service, m } = build();
    await expect(service.revokeTeacher(TEACHER, T2_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.revokeTeacher(STUDENT, T_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(m.users.updateOne).not.toHaveBeenCalled();
  });

  it('controller chuyển mode (mặc định STUDENT) vào service', async () => {
    const service: any = { revokeTeacher: jest.fn().mockResolvedValue({}) };
    const c = new AdminUsersController(service);
    await c.revokeTeacher(ADMIN, T_ID, { mode: 'LOCK' });
    await c.revokeTeacher(ADMIN, T_ID, undefined as any);
    expect(service.revokeTeacher).toHaveBeenNthCalledWith(
      1,
      ADMIN,
      T_ID,
      'LOCK',
    );
    expect(service.revokeTeacher).toHaveBeenNthCalledWith(
      2,
      ADMIN,
      T_ID,
      'STUDENT',
    );
  });
});

describe('Hủy phiên đăng nhập ở JwtStrategy', () => {
  const strategy = (rows: any[]) =>
    new JwtStrategy(
      {
        get: (k: string) => (k === 'JWT_SECRET' ? 'x'.repeat(40) : undefined),
      } as any,
      fakeModel(rows) as any,
    );
  const at = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

  it('token cấp trước thời điểm thu hồi bị từ chối; token cấp sau (đăng nhập lại) dùng được', async () => {
    const s = strategy([
      {
        _id: T_ID,
        role: 'STUDENT',
        sessionsRevokedAt: '2026-10-06T08:00:00.000Z',
      },
    ]);
    await expect(
      s.validate({
        sub: T_ID,
        email: 'x',
        role: 'TEACHER',
        iat: at('2026-10-06T07:59:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      s.validate({
        sub: T_ID,
        email: 'x',
        role: 'TEACHER',
        iat: at('2026-10-06T08:00:30.000Z'),
      }),
    ).resolves.toMatchObject({
      role: 'STUDENT',
    });
  });

  it('chưa từng thu hồi thì không ảnh hưởng; token không có iat bị coi là cũ khi đã có mốc thu hồi', async () => {
    await expect(
      strategy([{ _id: S1, role: 'STUDENT' }]).validate({
        sub: S1,
        email: 'x',
        role: 'STUDENT',
      }),
    ).resolves.toMatchObject({ sub: S1 });
    await expect(
      strategy([
        {
          _id: S1,
          role: 'STUDENT',
          sessionsRevokedAt: '2026-10-06T08:00:00.000Z',
        },
      ]).validate({ sub: S1, email: 'x', role: 'STUDENT' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('khóa kiểu LOCK: vừa bị khóa vừa bị hủy phiên, đăng nhập lại cũng bị chặn ở login', async () => {
    const s = strategy([
      {
        _id: T_ID,
        role: 'TEACHER',
        status: 'LOCKED',
        sessionsRevokedAt: '2026-10-06T08:00:00.000Z',
      },
    ]);
    await expect(
      s.validate({
        sub: T_ID,
        email: 'x',
        role: 'TEACHER',
        iat: at('2026-10-06T09:00:00.000Z'),
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

describe('Người dùng tự cập nhật hồ sơ (email bị khóa)', () => {
  const EMAIL = 'an@x.com';

  it('nhận họ tên, số điện thoại, giới thiệu đã làm sạch', () => {
    const r = checkProfileInput(
      {
        fullName: '  Nguyễn   Văn  An\u0000 ',
        phone: ' +84 912-345-678 ',
        bio: 'Xin chào\nTôi là An',
      },
      EMAIL,
    );
    expect(r).toEqual({
      ok: true,
      value: {
        fullName: 'Nguyễn Văn An',
        phone: '+84 912-345-678',
        bio: 'Xin chào\nTôi là An',
      },
    });
  });

  it('chỉ cập nhật trường được gửi; rỗng/null ở điện thoại và giới thiệu nghĩa là xóa', () => {
    expect(checkProfileInput({ bio: 'x' }, EMAIL)).toEqual({
      ok: true,
      value: { bio: 'x' },
    });
    expect(checkProfileInput({ phone: '', bio: null }, EMAIL)).toEqual({
      ok: true,
      value: { phone: '', bio: '' },
    });
    expect(checkProfileInput({ phone: null }, EMAIL)).toEqual({
      ok: true,
      value: { phone: '' },
    });
  });

  it('email: gửi lại đúng email hiện tại thì bỏ qua; đổi sang email khác hoặc kiểu lạ bị TỪ CHỐI', () => {
    expect(
      checkProfileInput({ email: 'AN@x.com', fullName: 'An' }, EMAIL),
    ).toMatchObject({ ok: true });
    for (const email of ['khac@x.com', '', null, { $ne: 1 }, 5]) {
      expect(checkProfileInput({ email, fullName: 'An' }, EMAIL)).toEqual({
        ok: false,
        message: 'Không thể thay đổi email của tài khoản.',
      });
    }
  });

  it('từ chối đầu vào xấu', () => {
    const bad: unknown[] = [
      null,
      'chuoi',
      [],
      {},
      { fullName: '   ' },
      { fullName: 'x'.repeat(MAX_NAME + 1) },
      { fullName: 123 },
      { phone: 'abc' },
      { phone: '12' },
      { phone: '<script>' },
      { phone: 123456789 },
      { bio: 'x'.repeat(MAX_BIO + 1) },
      { bio: 5 },
    ];
    for (const b of bad)
      expect(checkProfileInput(b, EMAIL)).toMatchObject({ ok: false });
  });

  it('không nhận trường đặc quyền (vai trò, mã, trạng thái): chúng bị bỏ qua', () => {
    const r = checkProfileInput(
      {
        fullName: 'An',
        role: 'ADMIN',
        status: 'ACTIVE',
        studentCode: 'C0001',
        sessionsRevokedAt: 1,
      },
      EMAIL,
    );
    expect(r).toEqual({ ok: true, value: { fullName: 'An' } });
  });

  it('AuthService.updateProfile: lưu họ tên/điện thoại/giới thiệu, giữ nguyên email, vai trò; email khác → 400', async () => {
    const doc: any = {
      _id: S1,
      email: EMAIL,
      fullName: 'An',
      role: 'STUDENT',
      save: jest.fn().mockResolvedValue(undefined),
    };
    const service = new AuthService(
      { findById: jest.fn().mockResolvedValue(doc) } as any,
      {} as any,
      {} as any,
      { sign: jest.fn().mockReturnValue('tok') } as any,
      { get: jest.fn() } as any,
      {} as any,
    );
    const r = await service.updateProfile(S1, {
      fullName: 'An Mới',
      phone: '0912345678',
      bio: 'Hi',
    });
    expect(r).toMatchObject({
      email: EMAIL,
      fullName: 'An Mới',
      phone: '0912345678',
      bio: 'Hi',
      role: 'STUDENT',
    });
    expect(doc.save).toHaveBeenCalledTimes(1);

    doc.save.mockClear();
    await expect(
      service.updateProfile(S1, { email: 'hacker@x.com', fullName: 'X' }),
    ).rejects.toThrow(/email/i);
    await expect(
      service.updateProfile(S1, { role: 'ADMIN' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(doc.save).not.toHaveBeenCalled();
    expect(doc.email).toBe(EMAIL);
    expect(doc.role).toBe('STUDENT');
  });

  it('tài khoản không tồn tại → 404', async () => {
    const service = new AuthService(
      { findById: jest.fn().mockResolvedValue(null) } as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any,
      {} as any,
    );
    await expect(
      service.updateProfile(S1, { fullName: 'A' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.updateProfile('khong-hop-le', { fullName: 'A' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
