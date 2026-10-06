import 'reflect-metadata';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import { JwtStrategy } from '../../common/auth/jwt.strategy';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { AuthService } from '../auth/auth.service';
import { fakeModel } from '../teacher-analytics/fake-model';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService, MAX_PAGE_SIZE } from './admin-users.service';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const ADMIN_ID = OID(1);
const ADMIN2_ID = OID(2);
const T_ID = OID(3);
const S1 = OID(11);
const S2 = OID(12);
const S3 = OID(13);
const ADMIN: JwtPayload = { sub: ADMIN_ID, email: 'a@x', role: 'ADMIN' };
const TEACHER: JwtPayload = { sub: T_ID, email: 't@x', role: 'TEACHER' };
const STUDENT: JwtPayload = { sub: S1, email: 's@x', role: 'STUDENT' };

const day = (n: number) =>
  `2026-09-${String(n).padStart(2, '0')}T03:00:00.000Z`;
const users = () => [
  {
    _id: ADMIN_ID,
    fullName: 'Nguyễn Kim Thượng',
    email: 'admin@x.com',
    role: 'ADMIN',
    createdAt: day(1),
  },
  {
    _id: T_ID,
    fullName: 'Cô Lan',
    email: 'lan@x.com',
    role: 'TEACHER',
    createdAt: day(2),
  },
  {
    _id: S1,
    fullName: 'An',
    email: 'an@x.com',
    role: 'STUDENT',
    studentCode: 'C0001',
    createdAt: day(3),
  },
  {
    _id: S2,
    fullName: 'Bình',
    email: 'binh@x.com',
    role: 'STUDENT',
    studentCode: 'C0002',
    status: 'LOCKED',
    createdAt: day(4),
  },
  {
    _id: S3,
    fullName: 'Chi Đặng',
    email: 'chi@x.com',
    role: 'STUDENT',
    studentCode: 'C0003',
    createdAt: day(5),
  },
];

function build(
  over: {
    users?: any[];
    classes?: any[];
    subs?: any[];
    da?: any[];
    ai?: any[];
    exercises?: any[];
  } = {},
) {
  const m = {
    users: fakeModel(over.users ?? users()),
    counters: fakeModel([{ _id: 'c1', key: 'studentCode', seq: 3 }]),
    classes: fakeModel(over.classes ?? []),
    exercises: fakeModel(
      over.exercises ?? [
        { _id: 'e1', slug: 'py-1', title: 'Python 1', tags: ['loops'] },
        { _id: 'e2', slug: 'sql-1', title: 'SQL 1', tags: ['sql'] },
        { _id: 'e3', slug: 'ai-1', title: 'AI 1', tags: ['rag'] },
      ],
    ),
    submissions: fakeModel(over.subs ?? []),
    daLabs: fakeModel(over.da ?? []),
    aiLabs: fakeModel(over.ai ?? []),
  };
  const activity = {
    getActivity: jest.fn().mockResolvedValue({
      from: '2026-01-01',
      to: '2026-09-30',
      total: 4,
      activeDays: 2,
      days: [{ date: '2026-09-02', count: 3 }],
    }),
  };
  const service = new AdminUsersService(
    m.users as any,
    m.counters as any,
    m.classes as any,
    m.exercises as any,
    m.submissions as any,
    m.daLabs as any,
    m.aiLabs as any,
    activity as any,
  );
  return { service, m, activity };
}

describe('AdminUsersService.list', () => {
  it('trả mọi người dùng mới nhất trước, không lộ mật khẩu, có trạng thái mặc định ACTIVE', async () => {
    const { service } = build();
    const r = await service.list(ADMIN, {});
    expect(r.total).toBe(5);
    expect(r.items.map((u) => u.email)).toEqual([
      'chi@x.com',
      'binh@x.com',
      'an@x.com',
      'lan@x.com',
      'admin@x.com',
    ]);
    expect(r.items[3]).toMatchObject({
      role: 'TEACHER',
      status: 'ACTIVE',
      studentCode: null,
    });
    expect(JSON.stringify(r)).not.toContain('password');
  });

  it('lọc theo vai trò, trạng thái và tìm theo tên, email hoặc mã (không phân biệt hoa thường)', async () => {
    const { service } = build();
    expect((await service.list(ADMIN, { role: 'STUDENT' })).items).toHaveLength(
      3,
    );
    expect(
      (await service.list(ADMIN, { role: 'TEACHER' })).items.map(
        (u) => u.email,
      ),
    ).toEqual(['lan@x.com']);
    expect(
      (await service.list(ADMIN, { status: 'LOCKED' })).items.map(
        (u) => u.email,
      ),
    ).toEqual(['binh@x.com']);
    expect((await service.list(ADMIN, { status: 'ACTIVE' })).total).toBe(4); // gồm cả tài khoản cũ chưa có status
    expect(
      (await service.list(ADMIN, { q: 'ĐẶNG'.toLowerCase() })).items.map(
        (u) => u.email,
      ),
    ).toEqual(['chi@x.com']);
    expect(
      (await service.list(ADMIN, { q: 'LAN@' })).items.map((u) => u.email),
    ).toEqual(['lan@x.com']);
    expect(
      (await service.list(ADMIN, { q: 'c0002' })).items.map((u) => u.email),
    ).toEqual(['binh@x.com']);
    expect(
      (await service.list(ADMIN, { role: 'STUDENT', q: 'an' })).items.map(
        (u) => u.email,
      ),
    ).toEqual(['an@x.com']);
  });

  it('ký tự regex trong ô tìm kiếm không phá truy vấn; vai trò/trạng thái lạ → 400', async () => {
    const { service } = build();
    await expect(service.list(ADMIN, { q: '(.*+' })).resolves.toMatchObject({
      total: 0,
    });
    await expect(service.list(ADMIN, { role: 'ROOT' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(service.list(ADMIN, { status: 'x' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('phân trang và chặn pageSize quá lớn', async () => {
    const { service, m } = build();
    const p1 = await service.list(ADMIN, { pageSize: '2', page: '1' });
    expect([p1.items.length, p1.total, p1.page, p1.pageSize]).toEqual([
      2, 5, 1, 2,
    ]);
    expect((await service.list(ADMIN, { pageSize: '99999' })).pageSize).toBe(
      MAX_PAGE_SIZE,
    );
    expect(
      (await service.list(ADMIN, { pageSize: '-3', page: 'abc' })).pageSize,
    ).toBeGreaterThan(0);
    expect(m.users.find).toHaveBeenCalled();
  });

  it('chỉ Admin được gọi (giảng viên, học viên bị chặn trước khi đọc dữ liệu)', async () => {
    const { service, m } = build();
    await expect(service.list(TEACHER, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.list(STUDENT, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(m.users.find).not.toHaveBeenCalled();
  });
});

describe('AdminUsersService.create', () => {
  it('tạo học viên: cấp mã Cxxxx kế tiếp, mật khẩu băm bcrypt, email chuẩn hóa', async () => {
    const { service, m } = build();
    const r = await service.create(ADMIN, {
      fullName: ' Dũng ',
      email: ' Dung@X.com ',
      password: 'matkhau1',
      role: 'STUDENT',
    });
    expect(r).toMatchObject({
      fullName: 'Dũng',
      email: 'dung@x.com',
      role: 'STUDENT',
      status: 'ACTIVE',
      studentCode: 'C0004',
    });
    const saved = m.users.rows.at(-1)!;
    expect(saved.password).not.toBe('matkhau1');
    await expect(bcrypt.compare('matkhau1', saved.password)).resolves.toBe(
      true,
    );
  });

  it('giảng viên không có mã học viên; KHÔNG tạo được tài khoản ADMIN (chống leo thang đặc quyền)', async () => {
    const { service, m } = build();
    expect(
      (
        await service.create(ADMIN, {
          fullName: 'GV',
          email: 'gv2@x.com',
          password: '123456',
          role: 'TEACHER',
        })
      ).studentCode,
    ).toBeNull();
    const n = m.users.rows.length;
    await expect(
      service.create(ADMIN, {
        fullName: 'AD',
        email: 'ad3@x.com',
        password: '123456',
        role: 'ADMIN',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(m.users.rows).toHaveLength(n);
    expect(m.users.rows.some((u) => u.email === 'ad3@x.com')).toBe(false);
  });

  it('email trùng (không phân biệt hoa thường) → 409, không tạo thêm', async () => {
    const { service, m } = build();
    const n = m.users.rows.length;
    await expect(
      service.create(ADMIN, {
        fullName: 'X',
        email: 'AN@x.com',
        password: '123456',
        role: 'STUDENT',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(m.users.rows).toHaveLength(n);
  });

  it('từ chối đầu vào xấu: họ tên, email, mật khẩu ngắn/dài, vai trò, kiểu dữ liệu', async () => {
    const { service, m } = build();
    const n = m.users.rows.length;
    const ok = {
      fullName: 'A',
      email: 'a1@x.com',
      password: '123456',
      role: 'STUDENT',
    };
    const bad: any[] = [
      { ...ok, fullName: '  ' },
      { ...ok, fullName: 'x'.repeat(101) },
      { ...ok, email: 'khong-phai-email' },
      { ...ok, email: { $ne: null } },
      { ...ok, password: '12345' },
      { ...ok, password: 'x'.repeat(73) },
      { ...ok, password: 123456 },
      { ...ok, role: 'SUPERUSER' },
      { ...ok, role: undefined },
      {},
    ];
    for (const b of bad)
      await expect(service.create(ADMIN, b)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    expect(m.users.rows).toHaveLength(n);
  });

  it('giảng viên và học viên không tạo được tài khoản', async () => {
    const { service, m } = build();
    const n = m.users.rows.length;
    const body = {
      fullName: 'X',
      email: 'x1@x.com',
      password: '123456',
      role: 'ADMIN',
    };
    await expect(service.create(TEACHER, body)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.create(STUDENT, body)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(m.users.rows).toHaveLength(n);
  });
});

describe('AdminUsersService.setRole', () => {
  it('đổi học viên thành giảng viên và ngược lại; lên học viên thì cấp mã nếu chưa có', async () => {
    const { service, m } = build();
    await expect(service.setRole(ADMIN, S1, 'TEACHER')).resolves.toMatchObject({
      role: 'TEACHER',
    });
    expect(m.users.rows.find((u) => u._id === S1)!.role).toBe('TEACHER');
    const back = await service.setRole(ADMIN, T_ID, 'STUDENT');
    expect(back).toMatchObject({ role: 'STUDENT', studentCode: 'C0004' });
    const again = await service.setRole(ADMIN, S1, 'STUDENT'); // S1 vẫn giữ mã cũ
    expect(again.studentCode).toBe('C0001');
  });

  it('không tự đổi vai trò của chính mình; vai trò không đổi thì không làm gì', async () => {
    const { service, m } = build();
    await expect(
      service.setRole(ADMIN, ADMIN_ID, 'TEACHER'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.setRole(ADMIN, S1, 'STUDENT')).resolves.toMatchObject({
      role: 'STUDENT',
    });
    expect(m.users.updateOne).not.toHaveBeenCalled();
  });

  it('KHÔNG BAO GIỜ gán ADMIN: không nâng quyền cho học viên/giảng viên, không đổi vai trò của Admin khác', async () => {
    const { service, m } = build({
      users: [
        ...users(),
        {
          _id: ADMIN2_ID,
          fullName: 'Admin 2',
          email: 'ad2@x.com',
          role: 'ADMIN',
          createdAt: day(6),
        },
      ],
    });
    await expect(service.setRole(ADMIN, S1, 'ADMIN')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.setRole(ADMIN, T_ID, 'ADMIN')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    // Admin khác cũng không bị hạ xuống hay đổi: phạm vi chỉ STUDENT <-> TEACHER
    await expect(
      service.setRole(ADMIN, ADMIN2_ID, 'TEACHER'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.setRole(ADMIN, ADMIN2_ID, 'STUDENT'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(m.users.rows.filter((u) => u.role === 'ADMIN')).toHaveLength(2);
    expect(m.users.rows.find((u) => u._id === S1)!.role).toBe('STUDENT');
    expect(m.users.updateOne).not.toHaveBeenCalled();
  });

  it('không hạ giảng viên còn phụ trách lớp (409), hạ được khi không còn lớp', async () => {
    const { service } = build({
      classes: [
        {
          _id: OID(50),
          name: 'L',
          teacherId: T_ID,
          studentIds: [],
          exerciseSlugs: [],
        },
      ],
    });
    await expect(service.setRole(ADMIN, T_ID, 'STUDENT')).rejects.toThrow(
      /phụ trách 1 lớp/,
    );
    const free = build();
    await expect(
      free.service.setRole(ADMIN, T_ID, 'STUDENT'),
    ).resolves.toMatchObject({ role: 'STUDENT' });
  });

  it('vai trò sai, id sai, không tồn tại; giảng viên/học viên bị chặn', async () => {
    const { service } = build();
    await expect(service.setRole(ADMIN, S1, 'ROOT')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.setRole(ADMIN, 'abc', 'TEACHER'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.setRole(ADMIN, OID(99), 'TEACHER'),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.setRole(TEACHER, S1, 'ADMIN')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.setRole(STUDENT, S1, 'ADMIN')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('AdminUsersService.setStatus', () => {
  it('khóa rồi mở khóa tài khoản', async () => {
    const { service, m } = build();
    await expect(service.setStatus(ADMIN, S1, 'LOCKED')).resolves.toMatchObject(
      { status: 'LOCKED' },
    );
    expect(m.users.rows.find((u) => u._id === S1)!.status).toBe('LOCKED');
    await expect(service.setStatus(ADMIN, S1, 'ACTIVE')).resolves.toMatchObject(
      { status: 'ACTIVE' },
    );
  });

  it('không tự khóa mình, không khóa Admin hoạt động cuối cùng, trạng thái lạ → 400', async () => {
    const { service } = build();
    await expect(
      service.setStatus(ADMIN, ADMIN_ID, 'LOCKED'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    const other: JwtPayload = { sub: OID(77), email: 'z@x', role: 'ADMIN' };
    await expect(
      service.setStatus(other, ADMIN_ID, 'LOCKED'),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(service.setStatus(ADMIN, S1, 'BANNED')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('giảng viên và học viên không khóa được ai', async () => {
    const { service, m } = build();
    await expect(
      service.setStatus(TEACHER, S1, 'LOCKED'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.setStatus(STUDENT, S3, 'LOCKED'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(m.users.updateOne).not.toHaveBeenCalled();
  });
});

describe('AdminUsersService.getProfile', () => {
  const classes = [
    {
      _id: OID(50),
      name: 'Lớp A',
      teacherId: T_ID,
      studentIds: [S1, S3],
      exerciseSlugs: ['py-1', 'sql-1', 'ai-1'],
    },
    {
      _id: OID(51),
      name: 'Lớp B',
      teacherId: T_ID,
      studentIds: [S3],
      exerciseSlugs: ['py-1'],
    },
  ];

  it('học viên có bài nộp: thống kê, lớp, tiến độ theo lớp, bài nộp gần nhất và hoạt động', async () => {
    const { service, activity } = build({
      classes,
      subs: [
        { userId: S1, exerciseId: 'e1', status: 'WA', createdAt: day(10) },
        { userId: S1, exerciseId: 'e1', status: 'AC', createdAt: day(11) },
        { userId: S1, exerciseId: 'e1', status: 'QUEUED', createdAt: day(12) }, // không tính
        { userId: S3, exerciseId: 'e1', status: 'AC', createdAt: day(12) }, // người khác
      ],
      da: [
        {
          userId: S1,
          exerciseSlug: 'sql-1',
          type: 'SQL',
          status: 'GRADED',
          attemptCount: 2,
          score: 10,
          bestScore: 10,
          maxScore: 10,
          updatedAt: day(13),
        },
      ],
      ai: [
        {
          userId: S1,
          exerciseSlug: 'ai-1',
          status: 'FAILED',
          totalAttempts: 3,
          updatedAt: day(14),
        },
      ],
    });
    const r = await service.getProfile(ADMIN, S1, '420');

    expect(r.user).toMatchObject({
      id: S1,
      fullName: 'An',
      studentCode: 'C0001',
      email: 'an@x.com',
      role: 'STUDENT',
      status: 'ACTIVE',
    });
    // py-1: WA + AC (2 lượt, đạt); sql-1: 2 lượt đạt; ai-1: 3 lượt không đạt → 7 lượt, 3 bài, đạt 2/3
    expect(r.stats).toMatchObject({
      totalSubmissions: 7,
      attemptedExercises: 3,
      passedExercises: 2,
    });
    expect(r.stats!.passRate).toBeCloseTo(2 / 3, 3);
    expect(r.classes).toHaveLength(1);
    expect(r.classes[0]).toMatchObject({
      name: 'Lớp A',
      teacher: 'Cô Lan',
      assigned: 3,
      passed: 2,
    });
    expect(r.classes[0].completionRate).toBeCloseTo(2 / 3, 3);
    expect(r.recent.map((x) => [x.title, x.kind, x.status])).toEqual([
      ['AI 1', 'AI_LAB', 'FAILED'],
      ['SQL 1', 'SQL', 'PASSED'],
      ['Python 1', 'CODE', 'PASSED'],
      ['Python 1', 'CODE', 'FAILED'],
    ]);
    expect(activity.getActivity).toHaveBeenCalledWith(S1, {
      days: 280,
      tzOffset: '420',
    });
    expect(r.activity!.total).toBe(4);
    expect(JSON.stringify(r)).not.toContain('password');
  });

  it('học viên chưa làm gì: thống kê bằng 0, tỷ lệ đạt null, không lớp, bài nộp rỗng', async () => {
    const { service } = build();
    const r = await service.getProfile(ADMIN, S3);
    expect(r.stats).toMatchObject({
      totalSubmissions: 0,
      attemptedExercises: 0,
      passedExercises: 0,
      passRate: null,
    });
    expect(r.classes).toEqual([]);
    expect(r.recent).toEqual([]);
  });

  it('học viên trong lớp nhưng chưa nộp: tiến độ lớp 0/n', async () => {
    const { service } = build({ classes });
    const r = await service.getProfile(ADMIN, S3);
    expect(
      r.classes.map((c) => [c.name, c.assigned, c.passed, c.completionRate]),
    ).toEqual([
      ['Lớp A', 3, 0, 0],
      ['Lớp B', 1, 0, 0],
    ]);
  });

  it('giảng viên: liệt kê lớp phụ trách, không có thống kê học tập; admin: gọn', async () => {
    const { service } = build({ classes });
    const t = await service.getProfile(ADMIN, T_ID);
    expect(t.stats).toBeNull();
    expect(t.classes.map((c) => [c.name, c.students])).toEqual([
      ['Lớp A', 2],
      ['Lớp B', 1],
    ]);
    const a = await service.getProfile(ADMIN, ADMIN_ID);
    expect([a.classes, a.stats, a.activity]).toEqual([[], null, null]);
  });

  it('id sai/không tồn tại → 404; giảng viên và học viên không xem được hồ sơ ai', async () => {
    const { service, m } = build();
    await expect(service.getProfile(ADMIN, 'xyz')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.getProfile(ADMIN, OID(99))).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.getProfile(TEACHER, S1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.getProfile(STUDENT, S1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(m.submissions.find).not.toHaveBeenCalled();
  });
});

describe('Khóa tài khoản có hiệu lực ngay ở đăng nhập và token', () => {
  it('JwtStrategy: tài khoản bị khóa hoặc đã xóa → 401; vai trò lấy từ CSDL', async () => {
    const model = fakeModel(users());
    const strategy = new JwtStrategy(
      {
        get: (k: string) => (k === 'JWT_SECRET' ? 'x'.repeat(40) : undefined),
      } as any,
      model as any,
    );
    await expect(
      strategy.validate({ sub: S1, email: 'an@x.com', role: 'STUDENT' }),
    ).resolves.toMatchObject({ sub: S1, role: 'STUDENT' });
    // token cũ còn ghi ADMIN nhưng CSDL đã là STUDENT → dùng vai trò thật
    await expect(
      strategy.validate({ sub: S1, email: 'an@x.com', role: 'ADMIN' }),
    ).resolves.toMatchObject({ role: 'STUDENT' });
    await expect(
      strategy.validate({ sub: S2, email: 'binh@x.com', role: 'STUDENT' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      strategy.validate({ sub: OID(99), email: 'x', role: 'STUDENT' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      strategy.validate({ sub: 'khong-hop-le', email: 'x', role: 'STUDENT' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('AuthService.login: sai mật khẩu vẫn là 401 (không lộ trạng thái); đúng mật khẩu mà bị khóa → 403', async () => {
    const hash = await bcrypt.hash('123456', 4);
    const row = (status?: string) => ({
      _id: S1,
      email: 'an@x.com',
      password: hash,
      fullName: 'An',
      role: 'STUDENT',
      status,
    });
    const make = (u: any) =>
      new AuthService(
        { findOne: jest.fn().mockResolvedValue(u) } as any,
        {} as any,
        {} as any,
        { sign: jest.fn().mockReturnValue('tok') } as any,
        { get: jest.fn() } as any,
        {} as any,
      );
    await expect(
      make(row('LOCKED')).login({ email: 'an@x.com', password: 'sai' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      make(row('LOCKED')).login({ email: 'an@x.com', password: '123456' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      make(row('ACTIVE')).login({ email: 'an@x.com', password: '123456' }),
    ).resolves.toHaveProperty('accessToken');
    await expect(
      make(row(undefined)).login({ email: 'an@x.com', password: '123456' }),
    ).resolves.toHaveProperty('accessToken');
  });
});

describe('AdminUsersController: RBAC', () => {
  it('JwtAuthGuard + RolesGuard và chỉ ADMIN', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, AdminUsersController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, AdminUsersController)).toEqual([
      'ADMIN',
    ]);
  });

  it('chuyển user từ token và tham số vào service', async () => {
    const service: any = {
      list: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      setRole: jest.fn().mockResolvedValue({}),
      setStatus: jest.fn().mockResolvedValue({}),
      getProfile: jest.fn().mockResolvedValue({}),
    };
    const c = new AdminUsersController(service);
    await c.list(ADMIN, 'STUDENT', 'LOCKED', 'an', '2', '10');
    await c.create(ADMIN, { fullName: 'A' });
    await c.setRole(ADMIN, S1, { role: 'TEACHER' });
    await c.setStatus(ADMIN, S1, { status: 'LOCKED' });
    await c.profile(ADMIN, S1, '420');
    expect(service.list).toHaveBeenCalledWith(ADMIN, {
      role: 'STUDENT',
      status: 'LOCKED',
      q: 'an',
      page: '2',
      pageSize: '10',
    });
    expect(service.setRole).toHaveBeenCalledWith(ADMIN, S1, 'TEACHER');
    expect(service.setStatus).toHaveBeenCalledWith(ADMIN, S1, 'LOCKED');
    expect(service.getProfile).toHaveBeenCalledWith(ADMIN, S1, '420');
  });
});

describe('AdminUsersService.list: trạng thái vào lớp của học viên', () => {
  it('học viên chưa vào lớp có classCount 0; đã vào lớp được đếm; lớp lưu trữ không tính; vai trò khác là null', async () => {
    const { service } = build({
      classes: [
        { _id: OID(21), name: 'A', teacherId: T_ID, studentIds: [S1] },
        { _id: OID(22), name: 'B', teacherId: T_ID, studentIds: [S1, S2] },
        { _id: OID(23), name: 'Cũ', teacherId: T_ID, studentIds: [S3], archived: true },
      ],
    });
    const byEmail = Object.fromEntries(
      (await service.list(ADMIN, {})).items.map((u) => [u.email, u.classCount]),
    );
    expect(byEmail['an@x.com']).toBe(2);
    expect(byEmail['binh@x.com']).toBe(1);
    expect(byEmail['chi@x.com']).toBe(0); // chỉ nằm trong lớp lưu trữ → coi như chưa vào lớp
    expect(byEmail['lan@x.com']).toBeNull();
    expect(byEmail['admin@x.com']).toBeNull();
  });

  it('không có lớp nào: mọi học viên tự đăng ký đều "Chưa vào lớp"', async () => {
    const { service } = build();
    const items = (await service.list(ADMIN, { role: 'STUDENT' })).items;
    expect(items.map((u) => u.classCount)).toEqual([0, 0, 0]);
  });
});
