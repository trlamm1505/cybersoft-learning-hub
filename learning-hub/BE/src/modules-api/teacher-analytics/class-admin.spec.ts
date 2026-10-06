import 'reflect-metadata';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  RequestMethod,
} from '@nestjs/common';
import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import * as XLSX from 'xlsx';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { RolesGuard } from '../../common/auth/roles.guard';
import { ROLES_KEY } from '../../common/auth/roles.decorator';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { expandAggregate } from './analytics-core';
import { AdminClassesController } from './admin-classes.controller';
import { fakeModel } from './fake-model';
import { TeacherAnalyticsController } from './teacher-analytics.controller';
import {
  aiLabPassed,
  daLabPassed,
  MAX_ADD_IDENTIFIERS,
  TeacherAnalyticsService,
} from './teacher-analytics.service';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const C1 = OID(1);
const C2 = OID(2);
const TEACHER1 = OID(90);
const TEACHER2 = OID(91);
const ADMIN_ID = OID(99);
const T1: JwtPayload = { sub: TEACHER1, email: 't1@x', role: 'TEACHER' };
const T2: JwtPayload = { sub: TEACHER2, email: 't2@x', role: 'TEACHER' };
const ADMIN: JwtPayload = { sub: ADMIN_ID, email: 'a@x', role: 'ADMIN' };
const STUDENT: JwtPayload = { sub: OID(11), email: 's@x', role: 'STUDENT' };

const S = (n: number) => ({
  _id: OID(10 + n),
  fullName: `HV ${n}`,
  email: `hv${n}@x.com`,
  studentCode: `C${1000 + n}`,
  role: 'STUDENT',
});
const users = [
  S(1),
  S(2),
  S(3),
  {
    _id: TEACHER1,
    fullName: 'Thầy A',
    email: 'teacher@x.com',
    role: 'TEACHER',
  },
  { _id: TEACHER2, fullName: 'Cô B', email: 'teacher2@x.com', role: 'TEACHER' },
  { _id: ADMIN_ID, fullName: 'Quản trị', email: 'admin@x.com', role: 'ADMIN' },
];
const exercises = [
  {
    _id: 'e1',
    slug: 'py-1',
    title: 'Python 1',
    type: 'CODE_TEXT',
    tags: ['loops'],
  },
  { _id: 'e2', slug: 'sql-1', title: 'SQL 1', type: 'SQL_LAB', tags: ['sql'] },
  { _id: 'e3', slug: 'ai-1', title: 'AI Lab 1', type: 'AI_LAB', tags: ['rag'] },
];

function build(
  extra: {
    classes?: any[];
    daLabs?: any[];
    aiLabs?: any[];
    submissions?: any[];
  } = {},
) {
  const models = {
    classes: fakeModel(
      extra.classes ?? [
        {
          _id: C1,
          name: 'Lớp 1',
          description: 'mô tả',
          archived: false,
          teacherId: TEACHER1,
          studentIds: [],
          exerciseSlugs: [],
        },
        {
          _id: C2,
          name: 'Lớp 2',
          teacherId: TEACHER2,
          studentIds: [OID(13)],
          exerciseSlugs: ['py-1'],
        },
      ],
    ),
    users: fakeModel(users),
    exercises: fakeModel(exercises),
    submissions: fakeModel(extra.submissions ?? []),
    hints: fakeModel([]),
    daLabs: fakeModel(extra.daLabs ?? []),
    aiLabs: fakeModel(extra.aiLabs ?? []),
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

describe('Admin: tạo lớp và gán giảng viên', () => {
  it('Admin tạo lớp với tên, mô tả và giảng viên phụ trách', async () => {
    const { service, models } = build();
    const r = await service.createClass(ADMIN, {
      name: '  Lớp mới ',
      description: ' Ghi chú ',
      teacherId: TEACHER1,
    });
    expect(r).toMatchObject({
      name: 'Lớp mới',
      description: 'Ghi chú',
      teacherId: TEACHER1,
      archived: false,
    });
    expect(models.classes.rows.at(-1)).toMatchObject({
      teacherId: TEACHER1,
      name: 'Lớp mới',
    });
  });

  it('bắt buộc có giảng viên hợp lệ: thiếu, sai định dạng, không tồn tại, hoặc không phải giảng viên đều bị từ chối', async () => {
    const { service, models } = build();
    const n = models.classes.rows.length;
    await expect(
      service.createClass(ADMIN, { name: 'L' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createClass(ADMIN, { name: 'L', teacherId: 'abc' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createClass(ADMIN, { name: 'L', teacherId: OID(77) }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createClass(ADMIN, { name: 'L', teacherId: OID(11) }),
    ).rejects.toBeInstanceOf(BadRequestException); // học viên
    await expect(
      service.createClass(ADMIN, { name: 'L', teacherId: ADMIN_ID }),
    ).rejects.toBeInstanceOf(BadRequestException); // admin không phải giảng viên
    expect(models.classes.rows).toHaveLength(n);
  });

  it('từ chối tên rỗng/quá dài, mô tả quá dài, archived sai kiểu', async () => {
    const { service } = build();
    const ok = { teacherId: TEACHER1 };
    await expect(
      service.createClass(ADMIN, { ...ok, name: '' }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createClass(ADMIN, { ...ok, name: 'x'.repeat(101) }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.createClass(ADMIN, {
        ...ok,
        name: 'ok',
        description: 'x'.repeat(301),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.updateClass(ADMIN, C1, { archived: 'yes' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Admin đổi giảng viên phụ trách: giảng viên cũ mất quyền, giảng viên mới có quyền', async () => {
    const { service } = build();
    await expect(service.getOverview(T2, C1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await service.updateClass(ADMIN, C1, { teacherId: TEACHER2 });
    await expect(service.getOverview(T2, C1)).resolves.toBeDefined();
    await expect(service.getOverview(T1, C1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.updateClass(ADMIN, C1, { teacherId: OID(11) }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('Admin sửa tên/mô tả; chỉ gửi trường nào thì đổi trường đó', async () => {
    const { service, models } = build();
    await service.updateClass(ADMIN, C1, { name: 'Tên mới' });
    expect(models.classes.rows[0]).toMatchObject({
      name: 'Tên mới',
      description: 'mô tả',
      teacherId: TEACHER1,
    });
    await service.updateClass(ADMIN, C1, { description: '' });
    expect(models.classes.rows[0]).toMatchObject({
      name: 'Tên mới',
      description: '',
    });
  });

  it('lưu trữ ẩn lớp khỏi danh sách giảng viên mặc định; trang Admin vẫn thấy mọi lớp kèm giảng viên', async () => {
    const { service } = build();
    await service.updateClass(ADMIN, C1, { archived: true });
    expect((await service.listClasses(T1)).map((c) => c.id)).toEqual([]);
    expect(
      (await service.listClasses(T1, true)).map((c) => [c.id, c.archived]),
    ).toEqual([[C1, true]]);
    const all = await service.listAllClasses(ADMIN);
    expect(all.map((c) => [c.id, c.archived, c.teacher?.name])).toEqual([
      [C1, true, 'Thầy A'],
      [C2, false, 'Cô B'],
    ]);
    await service.updateClass(ADMIN, C1, { archived: false });
    expect(await service.listClasses(T1)).toHaveLength(1);
  });

  it('Admin xóa lớp; lớp đã xóa mở lại → 404', async () => {
    const { service, models } = build();
    await expect(service.deleteClass(ADMIN, C1)).resolves.toEqual({
      id: C1,
      deleted: true,
    });
    expect(models.classes.rows.map((r) => String(r._id))).toEqual([C2]);
    await expect(service.getClassDetail(ADMIN, C1)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('danh sách giảng viên để gán chỉ có TEACHER, tìm theo tên/email', async () => {
    const { service } = build();
    expect(
      (await service.catalogTeachers(ADMIN)).map((t) => t.email).sort(),
    ).toEqual(['teacher2@x.com', 'teacher@x.com']);
    expect(
      (await service.catalogTeachers(ADMIN, 'cô')).map((t) => t.name),
    ).toEqual(['Cô B']);
  });
});

describe('Bảo mật: giảng viên và học viên không được quản trị lớp', () => {
  it('giảng viên KHÔNG tự tạo lớp được, kể cả gán chính mình', async () => {
    const { service, models } = build();
    const n = models.classes.rows.length;
    await expect(
      service.createClass(T1, { name: 'Lớp lậu', teacherId: TEACHER1 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(models.classes.rows).toHaveLength(n);
  });

  it('giảng viên không sửa/gán giảng viên/lưu trữ/xóa/thêm/gỡ/import học viên được, kể cả lớp của chính mình, và không có truy vấn nào chạy', async () => {
    const { service, models } = build();
    const before = JSON.stringify(models.classes.rows);
    const csv = {
      originalname: 'a.csv',
      size: 20,
      buffer: Buffer.from('email\nhv1@x.com\n'),
    };
    const attempts = [
      () => service.updateClass(T1, C1, { name: 'x' }),
      () => service.updateClass(T1, C1, { teacherId: TEACHER2 }),
      () => service.updateClass(T1, C1, { archived: true }),
      () => service.deleteClass(T1, C1),
      () => service.addStudents(T1, C1, ['hv1@x.com']),
      () => service.removeStudent(T1, C1, OID(11)),
      () => service.importStudents(T1, C1, csv),
      () => service.catalogStudents(T1, 'hv'),
      () => service.catalogTeachers(T1),
      () => service.listAllClasses(T1),
    ];
    for (const attempt of attempts)
      await expect(attempt()).rejects.toBeInstanceOf(ForbiddenException);
    expect(JSON.stringify(models.classes.rows)).toBe(before);
    expect(models.users.find).not.toHaveBeenCalled();
  });

  it('học viên cũng bị chặn ở tầng service (phòng khi route bị mở nhầm)', async () => {
    const { service } = build();
    await expect(
      service.createClass(STUDENT, { name: 'x', teacherId: TEACHER1 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.deleteClass(STUDENT, C1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.getOverview(STUDENT, C1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('giảng viên chỉ mở lớp của mình (teacherId === user.sub): lớp người khác 403', async () => {
    const { service } = build();
    await expect(service.getClassDetail(T1, C1)).resolves.toBeDefined();
    await expect(service.getClassDetail(T1, C2)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.getOverview(T1, C2)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.setExercises(T1, C2, ['py-1'])).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect((await service.listClasses(T1)).map((c) => c.id)).toEqual([C1]);
  });

  it('Admin vẫn xem được số liệu và chi tiết mọi lớp', async () => {
    const { service } = build();
    await expect(service.getOverview(ADMIN, C1)).resolves.toBeDefined();
    await expect(service.getClassDetail(ADMIN, C2)).resolves.toMatchObject({
      teacher: { name: 'Cô B' },
    });
  });
});

describe('Admin: học viên trong lớp', () => {
  it('thêm theo email (không phân biệt hoa thường) và mã học viên', async () => {
    const { service, models } = build();
    const r = await service.addStudents(ADMIN, C1, ['HV1@X.com', 'c1002']);
    expect(r.added.map((a) => a.name).sort()).toEqual(['HV 1', 'HV 2']);
    expect(models.classes.rows[0].studentIds.sort()).toEqual([
      OID(11),
      OID(12),
    ]);
  });

  it('người đã trong lớp báo ở already, không thêm trùng', async () => {
    const { service, models } = build();
    await service.addStudents(ADMIN, C1, ['hv1@x.com']);
    const r = await service.addStudents(ADMIN, C1, ['hv1@x.com', 'hv2@x.com']);
    expect(r.already).toEqual(['hv1@x.com']);
    expect(r.added.map((a) => a.id)).toEqual([OID(12)]);
    expect(models.classes.rows[0].studentIds).toEqual([OID(11), OID(12)]);
  });

  it('không tồn tại hoặc không phải học viên → notFound, phần hợp lệ vẫn thêm', async () => {
    const { service, models } = build();
    const r = await service.addStudents(ADMIN, C1, [
      'hv3@x.com',
      'teacher@x.com',
      'ai-do@x.com',
      'C9999',
    ]);
    expect(r.added.map((a) => a.id)).toEqual([OID(13)]);
    expect(r.notFound.sort()).toEqual([
      'C9999',
      'ai-do@x.com',
      'teacher@x.com',
    ]);
    expect(models.classes.rows[0].studentIds).toEqual([OID(13)]);
  });

  it('danh sách rỗng, sai kiểu hoặc quá dài bị từ chối', async () => {
    const { service } = build();
    await expect(service.addStudents(ADMIN, C1, [])).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(
      service.addStudents(ADMIN, C1, ['  ', '']),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.addStudents(ADMIN, C1, 'hv1@x.com'),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.addStudents(
        ADMIN,
        C1,
        Array.from(
          { length: MAX_ADD_IDENTIFIERS + 1 },
          (_, i) => `u${i}@x.com`,
        ),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('gỡ học viên; gỡ người không có trong lớp → 404', async () => {
    const { service, models } = build();
    await service.addStudents(ADMIN, C1, ['hv1@x.com', 'hv2@x.com']);
    await expect(service.removeStudent(ADMIN, C1, OID(11))).resolves.toEqual({
      id: OID(11),
      removed: true,
    });
    expect(models.classes.rows[0].studentIds).toEqual([OID(12)]);
    await expect(
      service.removeStudent(ADMIN, C1, OID(11)),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('gợi ý học viên: tìm theo tên/email/mã, chỉ học viên, rỗng khi không có từ khóa, an toàn với ký tự regex', async () => {
    const { service } = build();
    expect(
      (await service.catalogStudents(ADMIN, 'hv 2')).map((s) => s.email),
    ).toEqual(['hv2@x.com']);
    expect(await service.catalogStudents(ADMIN, 'teacher')).toEqual([]);
    expect(await service.catalogStudents(ADMIN, '  ')).toEqual([]);
    await expect(service.catalogStudents(ADMIN, '(.*')).resolves.toEqual([]);
  });
});

const csvFile = (text: string, name = 'ds.csv') => ({
  originalname: name,
  size: Buffer.byteLength(text),
  buffer: Buffer.from(text),
});
const xlsxFile = (rows: unknown[][], bookType: 'xlsx' | 'biff8' = 'xlsx') => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'S');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType }) as Buffer;
  return {
    originalname: bookType === 'xlsx' ? 'ds.xlsx' : 'ds.xls',
    size: buffer.length,
    buffer,
  };
};

describe('Admin: import học viên từ file', () => {
  it('CSV: báo cáo tách rõ đã thêm, đã có, không tồn tại, sai cú pháp, trùng trong file', async () => {
    const { service, models } = build();
    await service.addStudents(ADMIN, C1, ['hv1@x.com']);
    const r = await service.importStudents(
      ADMIN,
      C1,
      csvFile(
        'Email\nhv1@x.com\nHV2@x.com\nteacher@x.com\nkhong.co@x.com\nhong-email\nhv2@x.com\n',
      ),
    );
    expect(r.added.map((a) => a.id)).toEqual([OID(12)]);
    expect(r.already).toEqual(['hv1@x.com']);
    expect(r.notFound.sort()).toEqual(['khong.co@x.com', 'teacher@x.com']);
    expect(r.invalid).toEqual(['hong-email']);
    expect(r.duplicatesInFile).toBe(1);
    expect(r.totalRows).toBe(6);
    expect(models.classes.rows[0].studentIds).toEqual([OID(11), OID(12)]);
  });

  it('Excel .xlsx và .xls đều đọc được', async () => {
    for (const type of ['xlsx', 'biff8'] as const) {
      const { service, models } = build();
      const r = await service.importStudents(
        ADMIN,
        C1,
        xlsxFile(
          [
            ['Họ tên', 'Email'],
            ['A', 'hv1@x.com'],
            ['B', 'hv3@x.com'],
          ],
          type,
        ),
      );
      expect(r.added.map((a) => a.id).sort()).toEqual([OID(11), OID(13)]);
      expect(models.classes.rows[0].studentIds.sort()).toEqual([
        OID(11),
        OID(13),
      ]);
    }
  });

  it('chỉ thêm tài khoản học viên đã có: email giảng viên hoặc chưa đăng ký không được tạo/thêm', async () => {
    const { service, models } = build();
    const r = await service.importStudents(
      ADMIN,
      C1,
      csvFile('email\nteacher@x.com\nadmin@x.com\nmoi@x.com\n'),
    );
    expect(r.added).toEqual([]);
    expect(r.notFound.sort()).toEqual([
      'admin@x.com',
      'moi@x.com',
      'teacher@x.com',
    ]);
    expect(models.classes.rows[0].studentIds).toEqual([]);
    expect(models.users.rows).toHaveLength(users.length); // không tạo người dùng mới
  });

  it('file lỗi: sai đuôi, quá 2MB, đuôi và nội dung không khớp, hỏng, rỗng, thiếu cột email, quá 500 dòng → 400 và không đổi lớp', async () => {
    const { service, models } = build();
    const before = JSON.stringify(models.classes.rows);
    const big = Buffer.alloc(2 * 1024 * 1024 + 1, 'a');
    const many =
      'email\n' +
      Array.from({ length: 501 }, (_, i) => `u${i}@x.com`).join('\n');
    const bad: Array<[string, any]> = [
      ['không có file', undefined],
      [
        'đuôi .exe',
        { originalname: 'a.exe', size: 5, buffer: Buffer.from('email') },
      ],
      ['đuôi .txt', csvFile('email\na@b.co', 'a.txt')],
      ['quá 2MB', { originalname: 'a.csv', size: big.length, buffer: big }],
      [
        'csv thật ra là zip',
        {
          originalname: 'a.csv',
          size: 6,
          buffer: Buffer.from([0x50, 0x4b, 3, 4, 0, 0]),
        },
      ],
      [
        'xlsx giả (text)',
        { originalname: 'a.xlsx', size: 9, buffer: Buffer.from('email\nabc') },
      ],
      [
        'xls giả (text)',
        { originalname: 'a.xls', size: 9, buffer: Buffer.from('email\nabc') },
      ],
      [
        'xlsx hỏng sau chữ ký zip',
        {
          originalname: 'a.xlsx',
          size: 10,
          buffer: Buffer.from([0x50, 0x4b, 3, 4, 1, 2, 3, 4, 5, 6]),
        },
      ],
      [
        'csv chứa NUL',
        { originalname: 'a.csv', size: 6, buffer: Buffer.from('a@b.co\u0000') },
      ],
      [
        'csv không phải UTF-8',
        {
          originalname: 'a.csv',
          size: 4,
          buffer: Buffer.from([0xff, 0xfe, 0xfa, 0x0a]),
        },
      ],
      [
        'file rỗng',
        { originalname: 'a.csv', size: 0, buffer: Buffer.alloc(0) },
      ],
      ['chỉ có tiêu đề', csvFile('email\n')],
      ['không có cột email', csvFile('tên,lớp\nAn,10A\nBình,10B\n')],
      ['quá 500 dòng', csvFile(many)],
    ];
    for (const [label, file] of bad) {
      await expect(
        service.importStudents(ADMIN, C1, file),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(`${label}:${JSON.stringify(models.classes.rows)}`).toBe(
        `${label}:${before}`,
      );
    }
  });

  it('đúng 500 dòng vẫn được chấp nhận', async () => {
    const { service } = build();
    const text =
      'email\n' +
      Array.from({ length: 500 }, (_, i) => `u${i}@x.com`).join('\n');
    const r = await service.importStudents(ADMIN, C1, csvFile(text));
    expect(r.totalRows).toBe(500);
    expect(r.notFound).toHaveLength(500);
  });

  it('công thức, HTML và chuỗi độc hại trong ô không được thực thi hay đi vào truy vấn; chỉ email hợp lệ được tra cứu', async () => {
    const { service, models } = build();
    const r = await service.importStudents(
      ADMIN,
      C1,
      csvFile(
        'email\n=HYPERLINK("http://evil","x")\n<script>alert(1)</script>@x.com\n{"$ne":null}\nhv1@x.com\n"a@b.co\nb@c.co"\n',
      ),
    );
    expect(r.added.map((a) => a.id)).toEqual([OID(11)]);
    expect(r.invalid.length).toBeGreaterThanOrEqual(3);
    const lookups = JSON.stringify(models.users.calls);
    expect(lookups).not.toContain('HYPERLINK');
    expect(lookups).not.toContain('script');
    expect(lookups).not.toContain('$ne');
  });

  it('import vào lớp không tồn tại → 404; vào lớp của giảng viên khác không phải việc của giảng viên (403)', async () => {
    const { service } = build();
    await expect(
      service.importStudents(ADMIN, OID(9), csvFile('email\na@b.co')),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.importStudents(T2, C1, csvFile('email\na@b.co')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('Giảng viên: giao bài tập cho lớp được phân công', () => {
  it('giao danh sách bài: lưu bản đầy đủ, bỏ trùng, giữ thứ tự, thay thế chứ không cộng dồn', async () => {
    const { service, models } = build();
    await service.setExercises(T1, C1, ['sql-1', 'py-1', 'sql-1']);
    expect(models.classes.rows[0].exerciseSlugs).toEqual(['sql-1', 'py-1']);
    await service.setExercises(T1, C1, ['ai-1']);
    expect(models.classes.rows[0].exerciseSlugs).toEqual(['ai-1']);
  });

  it('bài không tồn tại hoặc sai kiểu bị từ chối và không đổi dữ liệu; bỏ chọn hết thì rỗng', async () => {
    const { service, models } = build();
    await service.setExercises(T1, C1, ['py-1']);
    await expect(
      service.setExercises(T1, C1, ['khong-co']),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.setExercises(T1, C1, 'py-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(models.classes.rows[0].exerciseSlugs).toEqual(['py-1']);
    await service.setExercises(T1, C1, []);
    expect(models.classes.rows[0].exerciseSlugs).toEqual([]);
  });

  it('giao bài không làm đổi giảng viên, học viên hay tên lớp', async () => {
    const { service, models } = build();
    await service.setExercises(T1, C1, ['py-1']);
    expect(models.classes.rows[0]).toMatchObject({
      name: 'Lớp 1',
      teacherId: TEACHER1,
      studentIds: [],
    });
  });

  it('danh mục bài giao được: mọi loại bài, tìm theo tên/slug/nhãn', async () => {
    const { service } = build();
    expect(
      (await service.catalogExercises()).map((e) => e.slug).sort(),
    ).toEqual(['ai-1', 'py-1', 'sql-1']);
    expect((await service.catalogExercises('rag')).map((e) => e.slug)).toEqual([
      'ai-1',
    ]);
  });
});

describe('Dashboard theo lớp thật (dữ liệu động)', () => {
  it('lớp Admin vừa tạo: chưa học viên, chưa bài → mọi tỷ lệ null, không truy vấn bài nộp', async () => {
    const { service, models } = build();
    const created = await service.createClass(ADMIN, {
      name: 'Mới tinh',
      teacherId: TEACHER1,
    });
    const r = await service.getOverview(T1, created.id);
    expect(r.summary).toMatchObject({
      students: 0,
      exercises: 0,
      completionRate: null,
      passRate: null,
    });
    expect(models.submissions.find).not.toHaveBeenCalled();
  });

  it('có học viên nhưng chưa giao bài, rồi giao bài nhưng chưa ai nộp: đúng ngữ cảnh', async () => {
    const { service } = build();
    await service.addStudents(ADMIN, C1, ['hv1@x.com']);
    expect(await service.getOverview(T1, C1)).toMatchObject({
      summary: { students: 1, exercises: 0 },
    });
    await service.setExercises(T1, C1, ['py-1']);
    expect((await service.getOverview(T1, C1)).summary).toMatchObject({
      students: 1,
      exercises: 1,
      attemptedPairs: 0,
      completionRate: 0,
      passRate: null,
    });
  });

  it('bài nộp thật làm số liệu đổi ngay; Admin gỡ học viên thì số liệu của họ biến mất', async () => {
    const { service, models } = build();
    await service.addStudents(ADMIN, C1, ['hv1@x.com', 'hv2@x.com']);
    await service.setExercises(T1, C1, ['py-1']);
    models.submissions.rows.push(
      {
        userId: OID(11),
        exerciseId: 'e1',
        status: 'WA',
        createdAt: new Date('2026-09-01'),
      },
      {
        userId: OID(11),
        exerciseId: 'e1',
        status: 'AC',
        createdAt: new Date('2026-09-02'),
      },
      {
        userId: OID(12),
        exerciseId: 'e1',
        status: 'WA',
        createdAt: new Date('2026-09-03'),
      },
    );
    let r = await service.getOverview(T1, C1);
    expect(r.summary).toMatchObject({
      attemptedPairs: 2,
      passedPairs: 1,
      totalAttempts: 3,
      completionRate: 0.5,
      passRate: 0.5,
    });
    await service.removeStudent(ADMIN, C1, OID(12));
    r = await service.getOverview(T1, C1);
    expect(r.summary).toMatchObject({
      students: 1,
      attemptedPairs: 1,
      passedPairs: 1,
      completionRate: 1,
      passRate: 1,
    });
  });

  it('gồm cả bài DA Lab (SQL) và AI Lab, tính theo số lần nộp gộp', async () => {
    const { service } = build({
      classes: [
        {
          _id: C1,
          name: 'L',
          teacherId: TEACHER1,
          studentIds: [OID(11), OID(12)],
          exerciseSlugs: ['sql-1', 'ai-1'],
        },
      ],
      daLabs: [
        {
          userId: OID(11),
          exerciseSlug: 'sql-1',
          type: 'SQL',
          status: 'GRADED',
          attemptCount: 3,
          score: 10,
          bestScore: 10,
          maxScore: 10,
          updatedAt: '2026-09-02T00:00:00.000Z',
        },
        {
          userId: OID(12),
          exerciseSlug: 'sql-1',
          type: 'SQL',
          status: 'GRADED',
          attemptCount: 2,
          score: 0,
          maxScore: 10,
          updatedAt: '2026-09-03T00:00:00.000Z',
        },
      ],
      aiLabs: [
        {
          userId: OID(11),
          exerciseSlug: 'ai-1',
          status: 'PASSED',
          totalAttempts: 2,
          updatedAt: '2026-09-04T00:00:00.000Z',
        },
        {
          userId: OID(12),
          exerciseSlug: 'ai-1',
          status: 'FAILED',
          totalAttempts: 4,
          updatedAt: '2026-09-05T00:00:00.000Z',
        },
      ],
    });
    const r = await service.getOverview(T1, C1);
    expect(r.summary).toMatchObject({
      attemptedPairs: 4,
      passedPairs: 2,
      totalAttempts: 11,
      passRate: 0.5,
    });
  });

  it('bài nộp của học viên ngoài lớp và bài không được giao không lọt vào số liệu', async () => {
    const { service, models } = build();
    await service.addStudents(ADMIN, C1, ['hv1@x.com']);
    await service.setExercises(T1, C1, ['py-1']);
    models.submissions.rows.push(
      {
        userId: OID(13),
        exerciseId: 'e1',
        status: 'AC',
        createdAt: new Date(),
      },
      {
        userId: OID(11),
        exerciseId: 'e2',
        status: 'AC',
        createdAt: new Date(),
      },
    );
    expect((await service.getOverview(T1, C1)).summary).toMatchObject({
      attemptedPairs: 0,
      passedPairs: 0,
    });
  });
});

describe('Quy tắc đạt của bài nộp gộp', () => {
  it('SQL đạt khi đủ điểm tối đa; Insight đạt khi đã chấm và từ 60%', () => {
    const base = { userId: 'u', exerciseSlug: 's' };
    expect(daLabPassed({ ...base, type: 'SQL', score: 10, maxScore: 10 })).toBe(
      true,
    );
    expect(daLabPassed({ ...base, type: 'SQL', score: 9, maxScore: 10 })).toBe(
      false,
    );
    expect(
      daLabPassed({
        ...base,
        type: 'SQL',
        score: 0,
        bestScore: 10,
        maxScore: 10,
      }),
    ).toBe(true);
    const ins = { ...base, type: 'INSIGHT', maxScore: 10 };
    expect(daLabPassed({ ...ins, status: 'GRADED', score: 6 })).toBe(true);
    expect(daLabPassed({ ...ins, status: 'GRADED', score: 5 })).toBe(false);
    expect(daLabPassed({ ...ins, status: 'PENDING_REVIEW', score: 10 })).toBe(
      false,
    );
  });

  it('AI Lab đạt khi trạng thái hiện tại hoặc bản tốt nhất là PASSED', () => {
    expect(
      aiLabPassed({ userId: 'u', exerciseSlug: 's', status: 'PASSED' }),
    ).toBe(true);
    expect(
      aiLabPassed({
        userId: 'u',
        exerciseSlug: 's',
        status: 'FAILED',
        best: { status: 'PASSED' },
      }),
    ).toBe(true);
    expect(
      aiLabPassed({ userId: 'u', exerciseSlug: 's', status: 'FAILED' }),
    ).toBe(false);
  });

  it('expandAggregate: N-1 lượt chưa đạt rồi lượt cuối; chặn giá trị bất thường', () => {
    const base = { userId: 'u', exerciseSlug: 's', at: new Date(0) };
    expect(
      expandAggregate({ ...base, attempts: 3, passed: true }).map(
        (x) => x.status,
      ),
    ).toEqual(['WA', 'WA', 'AC']);
    expect(
      expandAggregate({ ...base, attempts: 0, passed: true }),
    ).toHaveLength(1);
    expect(
      expandAggregate({ ...base, attempts: 1e9, passed: true }),
    ).toHaveLength(200);
  });
});

describe('RBAC của hai controller', () => {
  const routes = (ctrl: { prototype: object }) => {
    const proto = ctrl.prototype as Record<string, unknown>;
    return Object.getOwnPropertyNames(proto)
      .filter((n) => n !== 'constructor')
      .map((n) => ({
        method: Reflect.getMetadata(
          METHOD_METADATA,
          proto[n] as object,
        ) as number,
        path: Reflect.getMetadata(PATH_METADATA, proto[n] as object) as string,
        name: n,
      }))
      .filter((r) => r.method !== undefined)
      .map((r) => `${RequestMethod[r.method]} ${r.path}`)
      .sort();
  };

  it('AdminClassesController: JwtAuthGuard + RolesGuard và chỉ ADMIN', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AdminClassesController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, AdminClassesController)).toEqual([
      'ADMIN',
    ]);
  });

  it('TeacherAnalyticsController: chỉ TEACHER/ADMIN', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, TeacherAnalyticsController),
    ).toEqual([JwtAuthGuard, RolesGuard]);
    expect(Reflect.getMetadata(ROLES_KEY, TeacherAnalyticsController)).toEqual([
      'TEACHER',
      'ADMIN',
    ]);
  });

  it('route của giảng viên chỉ còn xem số liệu và giao bài: không có tạo/sửa/xóa lớp hay quản lý học viên', () => {
    expect(routes(TeacherAnalyticsController)).toEqual(
      [
        'GET /',
        'GET catalog/exercises',
        'GET :classId',
        'PUT :classId/exercises',
        'GET :classId/analytics',
        'GET :classId/students/:studentId',
        'GET :classId/exercises/:slug',
      ].sort(),
    );
  });

  it('route quản trị nằm hết ở controller chỉ ADMIN', () => {
    expect(routes(AdminClassesController)).toEqual(
      [
        'GET /',
        'POST /',
        'GET catalog/teachers',
        'GET catalog/students',
        'GET :classId',
        'PUT :classId',
        'DELETE :classId',
        'POST :classId/students',
        'POST :classId/students/import',
        'DELETE :classId/students/:studentId',
      ].sort(),
    );
  });

  it('route catalog khai báo trước :classId để không bị hiểu là id lớp', () => {
    for (const ctrl of [AdminClassesController, TeacherAnalyticsController]) {
      const order = Object.getOwnPropertyNames(ctrl.prototype);
      const detail = order.indexOf('detail');
      for (const n of order.filter((x) => x.startsWith('catalog'))) {
        expect(order.indexOf(n)).toBeLessThan(detail);
      }
    }
  });

  it('RolesGuard: học viên bị chặn ở mọi route; giảng viên chỉ qua route giảng viên; admin qua tất cả', () => {
    const guard = new RolesGuard(new Reflector());
    const ctx = (ctrl: any, handler: unknown, role: string) =>
      ({
        getHandler: () => handler,
        getClass: () => ctrl,
        switchToHttp: () => ({
          getRequest: () => ({ user: { sub: 'u', role } }),
        }),
      }) as any;
    const adminProto = AdminClassesController.prototype as any;
    for (const n of [
      'list',
      'create',
      'update',
      'remove',
      'addStudents',
      'importStudents',
      'removeStudent',
      'catalogTeachers',
      'catalogStudents',
    ]) {
      expect(() =>
        guard.canActivate(
          ctx(AdminClassesController, adminProto[n], 'STUDENT'),
        ),
      ).toThrow(ForbiddenException);
      expect(() =>
        guard.canActivate(
          ctx(AdminClassesController, adminProto[n], 'TEACHER'),
        ),
      ).toThrow(ForbiddenException);
      expect(
        guard.canActivate(ctx(AdminClassesController, adminProto[n], 'ADMIN')),
      ).toBe(true);
    }
    const tProto = TeacherAnalyticsController.prototype as any;
    for (const n of ['list', 'detail', 'setExercises', 'overview']) {
      expect(() =>
        guard.canActivate(
          ctx(TeacherAnalyticsController, tProto[n], 'STUDENT'),
        ),
      ).toThrow(ForbiddenException);
      expect(
        guard.canActivate(
          ctx(TeacherAnalyticsController, tProto[n], 'TEACHER'),
        ),
      ).toBe(true);
    }
  });

  it('controller chuyển user từ token và tham số vào service', async () => {
    const service: any = {
      listClasses: jest.fn().mockResolvedValue([]),
      listAllClasses: jest.fn().mockResolvedValue([]),
      addStudents: jest.fn().mockResolvedValue({}),
      importStudents: jest.fn().mockResolvedValue({}),
      createClass: jest.fn().mockResolvedValue({}),
      setExercises: jest.fn().mockResolvedValue({}),
    };
    const teacher = new TeacherAnalyticsController(service);
    const admin = new AdminClassesController(service);
    await teacher.list(T1, 'true');
    await teacher.setExercises(T1, C1, { slugs: ['py-1'] });
    await admin.list(ADMIN);
    await admin.create(ADMIN, { name: 'L', teacherId: TEACHER1 });
    await admin.addStudents(ADMIN, C1, { identifiers: ['a@x.com'] });
    const file = csvFile('email\na@b.co');
    await admin.importStudents(ADMIN, C1, file);
    expect(service.listClasses).toHaveBeenCalledWith(T1, true);
    expect(service.setExercises).toHaveBeenCalledWith(T1, C1, ['py-1']);
    expect(service.listAllClasses).toHaveBeenCalledWith(ADMIN, true);
    expect(service.createClass).toHaveBeenCalledWith(ADMIN, {
      name: 'L',
      teacherId: TEACHER1,
    });
    expect(service.addStudents).toHaveBeenCalledWith(ADMIN, C1, ['a@x.com']);
    expect(service.importStudents).toHaveBeenCalledWith(ADMIN, C1, file);
  });
});
