import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AdminPortalService, overallStatus, runCheck, vnDayStart } from './admin-portal.service';

const ADMIN: any = { sub: '507f1f77bcf86cd799439011', email: 'admin@x.vn', role: 'ADMIN' };
const TEACHER: any = { sub: '507f1f77bcf86cd799439012', email: 't@x.vn', role: 'TEACHER' };
const CLASS_ID = '507f1f77bcf86cd7994390aa';
const T1 = '507f1f77bcf86cd7994390b1';
const T2 = '507f1f77bcf86cd7994390b2';

const lean = (v: unknown) => ({ select: () => ({ lean: () => Promise.resolve(v), limit: () => ({ lean: () => Promise.resolve(v) }) }), lean: () => Promise.resolve(v) });

function build(over: Record<string, any> = {}) {
  const users: any = {
    aggregate: jest.fn().mockImplementation((p: any[]) =>
      Promise.resolve(p[0].$group ? [{ _id: 'STUDENT', n: 7 }, { _id: 'TEACHER', n: 2 }, { _id: 'ADMIN', n: 1 }] : [{ _id: '3-5', n: 2 }, { _id: 'CAREER_ADULT', n: 3 }]),
    ),
    countDocuments: jest.fn().mockResolvedValue(1),
    find: jest.fn().mockReturnValue(lean([])),
    ...over.users,
  };
  const classes: any = {
    countDocuments: jest.fn().mockResolvedValue(0),
    find: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn().mockResolvedValue({}),
    ...over.classes,
  };
  const submissions: any = {
    countDocuments: jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(4),
    aggregate: jest.fn().mockResolvedValue([]),
    estimatedDocumentCount: jest.fn().mockResolvedValue(100),
    ...over.submissions,
  };
  const assignments: any = { aggregate: jest.fn().mockResolvedValue([]), ...over.assignments };
  const exercises: any = { countDocuments: jest.fn().mockResolvedValue(8), ...over.exercises };
  const testerLabs: any = { countDocuments: jest.fn().mockResolvedValue(12), find: jest.fn(), ...over.testerLabs };
  const contests: any = { find: jest.fn().mockReturnValue(lean([])), ...over.contests };
  const connection: any = { db: { admin: () => ({ ping: jest.fn().mockResolvedValue({ ok: 1 }) }) }, ...over.connection };
  const audit: any = { record: jest.fn().mockResolvedValue(undefined) };
  const sys: any = {
    keyInfo: jest.fn().mockResolvedValue({ configured: true }),
    pingGemini: jest.fn().mockResolvedValue({ valid: true, latencyMs: 240 }),
    ...over.sys,
  };
  const leaderboard: any = { computeLeaderboard: jest.fn().mockResolvedValue({ rows: [{}, {}] }) };
  const sql: any = over.sql === null ? undefined : { run: jest.fn().mockResolvedValue({ rows: [[12]] }), ...over.sql };
  const svc = new AdminPortalService(users, classes, submissions, contests, assignments, exercises, testerLabs, connection, audit, sys, leaderboard, sql);
  return { svc, users, classes, submissions, contests, assignments, testerLabs, audit, sys, leaderboard, sql };
}

describe('vnDayStart / overallStatus / runCheck', () => {
  it('vnDayStart trả 00:00 giờ Việt Nam (17:00 UTC hôm trước)', () => {
    expect(vnDayStart(new Date('2026-10-16T10:00:00Z')).toISOString()).toBe('2026-10-15T17:00:00.000Z');
    expect(vnDayStart(new Date('2026-10-16T20:00:00Z')).toISOString()).toBe('2026-10-16T17:00:00.000Z');
    expect(vnDayStart(new Date('2026-10-16T10:00:00Z'), 6).toISOString()).toBe('2026-10-09T17:00:00.000Z');
  });

  it('overallStatus: có DOWN thì DOWN, có DEGRADED thì DEGRADED, còn lại HEALTHY', () => {
    expect(overallStatus([{ status: 'HEALTHY' }, { status: 'DOWN' }, { status: 'DEGRADED' }])).toBe('DOWN');
    expect(overallStatus([{ status: 'HEALTHY' }, { status: 'DEGRADED' }])).toBe('DEGRADED');
    expect(overallStatus([{ status: 'HEALTHY' }])).toBe('HEALTHY');
  });

  it('runCheck: thành công = HEALTHY; ném lỗi = DOWN kèm lý do; quá thời gian = DOWN', async () => {
    expect(await runCheck('auth_db', 'x', async () => ({ detail: 'ok' }))).toMatchObject({ status: 'HEALTHY', detail: 'ok' });
    expect(await runCheck('auth_db', 'x', async () => { throw new Error('boom'); })).toMatchObject({ status: 'DOWN', detail: 'boom' });
    const slow = await runCheck('auth_db', 'x', () => new Promise(() => undefined), 30);
    expect(slow.status).toBe('DOWN');
    expect(slow.detail).toContain('30ms');
  });

  it('runCheck: chậm hơn 1 giây thì DEGRADED', async () => {
    jest.useFakeTimers();
    try {
      const p = runCheck('auth_db', 'x', () => new Promise((r) => setTimeout(() => r({ detail: 'slow' }), 1500)), 2000);
      await jest.advanceTimersByTimeAsync(1600);
      expect((await p).status).toBe('DEGRADED');
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('AdminPortalService.dashboardSummary', () => {
  it('tổng hợp người dùng, học viên theo khối, bài nộp hôm nay và tỷ lệ hoàn thành', async () => {
    const { svc, submissions } = build();
    submissions.aggregate.mockResolvedValue([{ _id: '2026-10-16', n: 6 }]);
    const res = await svc.dashboardSummary(ADMIN, new Date('2026-10-16T05:00:00Z'));
    expect(res.totalUsers).toBe(10);
    expect(res.byRole).toEqual({ STUDENT: 7, TEACHER: 2, ADMIN: 1 });
    expect(res.studentsByAgeGroup).toMatchObject({ '3-5': 2, '6-9': 0, '10-12': 0, CAREER_ADULT: 3 });
    expect(res.submissionsToday).toBe(10);
    expect(res.completionRateToday).toBe(40);
    expect(res.submissionsLast7Days).toHaveLength(7);
    expect(res.submissionsLast7Days[6]).toEqual({ date: '2026-10-16', count: 6 });
    expect(res.submissionsLast7Days[0].count).toBe(0);
  });

  it('chưa có bài nộp nào hôm nay thì tỷ lệ là 0 (không chia cho 0)', async () => {
    const { svc } = build({ submissions: { countDocuments: jest.fn().mockResolvedValue(0) } });
    expect((await svc.dashboardSummary(ADMIN)).completionRateToday).toBe(0);
  });

  it('chỉ ADMIN được xem', async () => {
    await expect(build().svc.dashboardSummary(TEACHER)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('AdminPortalService: lớp và giảng viên', () => {
  it('teachersOf ưu tiên teacherIds, rơi về teacherId cũ, loại trùng', () => {
    const { svc } = build();
    expect(svc.teachersOf({ teacherId: 'a', teacherIds: ['b', 'c', 'b'] })).toEqual(['b', 'c']);
    expect(svc.teachersOf({ teacherId: 'a' })).toEqual(['a']);
    expect(svc.teachersOf({})).toEqual([]);
  });

  it('assignTeachers gán nhiều giảng viên, giữ teacherId = người đầu và ghi audit CLASS_ASSIGN', async () => {
    const { svc, classes, users, audit } = build();
    classes.findById.mockReturnValue({ lean: () => Promise.resolve({ name: '10A1', teacherId: T1, teacherIds: [T1] }) });
    users.find.mockReturnValue(lean([{ _id: T1, fullName: 'Cô Lan', role: 'TEACHER' }, { _id: T2, fullName: 'Thầy Hùng', role: 'TEACHER' }]));
    const res = await svc.assignTeachers(ADMIN, CLASS_ID, [T2, T1, T2]);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: CLASS_ID }, { $set: { teacherIds: [T2, T1], teacherId: T2 } });
    expect(res.teachers).toEqual([{ id: T2, name: 'Thầy Hùng' }, { id: T1, name: 'Cô Lan' }]);
    expect(audit.record).toHaveBeenCalledWith(
      ADMIN, 'CLASS_ASSIGN', 'CLASS', CLASS_ID,
      expect.objectContaining({ teacherIds: [T1] }),
      expect.objectContaining({ teacherIds: [T2, T1] }),
    );
  });

  it('từ chối: không phải mảng, mảng rỗng, id sai, quá 10 người, người không phải giảng viên hoặc đang bị khóa, lớp không tồn tại', async () => {
    const { svc, classes, users } = build();
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, 'abc')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, [])).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, ['zzz'])).rejects.toBeInstanceOf(BadRequestException);
    const many = Array.from({ length: 11 }, (_, i) => `507f1f77bcf86cd7994391${String(i).padStart(2, '0')}`);
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, many)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.assignTeachers(ADMIN, 'xyz', [T1])).rejects.toBeInstanceOf(NotFoundException);
    classes.findById.mockReturnValue({ lean: () => Promise.resolve(null) });
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, [T1])).rejects.toBeInstanceOf(NotFoundException);
    classes.findById.mockReturnValue({ lean: () => Promise.resolve({ name: 'x' }) });
    users.find.mockReturnValue(lean([{ _id: T1, role: 'STUDENT' }]));
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, [T1])).rejects.toBeInstanceOf(BadRequestException);
    users.find.mockReturnValue(lean([{ _id: T1, role: 'TEACHER', status: 'LOCKED' }]));
    await expect(svc.assignTeachers(ADMIN, CLASS_ID, [T1])).rejects.toBeInstanceOf(BadRequestException);
    expect(classes.updateOne).not.toHaveBeenCalled();
    await expect(svc.assignTeachers(TEACHER, CLASS_ID, [T1])).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('classesOverview trả giảng viên dạng tên, sĩ số, khối tuổi chiếm đa số và trạng thái', async () => {
    const { svc, classes, users } = build();
    classes.find.mockReturnValue({
      sort: () => ({
        lean: () => Promise.resolve([
          { _id: 'c1', name: 'Lớp A', code: 'A1', teacherIds: [T1, T2], studentIds: ['s1', 's2', 's3'] },
          { _id: 'c2', name: 'Lớp B', teacherId: T1, archived: true, studentIds: [] },
        ]),
      }),
    });
    users.find
      .mockReturnValueOnce(lean([{ _id: T1, fullName: 'Cô Lan' }]))
      .mockReturnValueOnce(lean([{ _id: 's1', ageGroup: '6-9' }, { _id: 's2', ageGroup: '6-9' }, { _id: 's3', ageGroup: '3-5' }]));
    const rows = await svc.classesOverview(ADMIN);
    expect(rows[0]).toMatchObject({ code: 'A1', ageGroup: '6-9', studentCount: 3, status: 'OPEN' });
    expect(rows[0].teachers).toEqual([{ id: T1, name: 'Cô Lan' }, { id: T2, name: 'Giảng viên không còn tồn tại' }]);
    expect(rows[1]).toMatchObject({ status: 'ARCHIVED', ageGroup: null, studentCount: 0 });
  });
});

describe('AdminPortalService.healthCheck', () => {
  it('chạy đủ 5 cụm song song và trả HEALTHY khi mọi thứ ổn', async () => {
    const { svc } = build();
    const res = await svc.healthCheck(ADMIN);
    expect(res.clusters.map((c) => c.key)).toEqual(['auth_db', 'core_engine', 'ai_gateway', 'submissions_classes', 'contests']);
    expect(res.status).toBe('HEALTHY');
    expect(res.clusters[0].detail).toBe('MongoDB: Connected');
    expect(res.clusters[1].detail).toContain('SQLite: Ready (in-process)');
    expect(res.clusters[2].detail).toBe('Gemini: Valid key, 240ms');
    res.clusters.forEach((c) => expect(typeof c.latencyMs).toBe('number'));
  });

  it('một cụm lỗi chỉ làm cụm đó DOWN, các cụm khác vẫn trả kết quả', async () => {
    const { svc } = build({ sys: { pingGemini: jest.fn().mockResolvedValue({ valid: false, latencyMs: 90, reason: 'Gemini từ chối API key.' }) } });
    const res = await svc.healthCheck(ADMIN);
    expect(res.status).toBe('DOWN');
    expect(res.clusters.find((c) => c.key === 'ai_gateway')).toMatchObject({ status: 'DOWN', detail: 'Gemini: Gemini từ chối API key.' });
    expect(res.clusters.find((c) => c.key === 'auth_db')!.status).toBe('HEALTHY');
  });

  it('MongoDB ping lỗi → Auth & DB là DOWN; thiếu key Gemini → DEGRADED (dùng chế độ dự phòng)', async () => {
    const down = build({ connection: { db: { admin: () => ({ ping: () => Promise.reject(new Error('ECONNREFUSED')) }) } } });
    expect((await down.svc.healthCheck(ADMIN)).clusters[0]).toMatchObject({ status: 'DOWN', detail: 'ECONNREFUSED' });
    const noKey = build({ sys: { keyInfo: jest.fn().mockResolvedValue({ configured: false }) } });
    const r = await noKey.svc.healthCheck(ADMIN);
    expect(r.clusters[2].status).toBe('DEGRADED');
    expect(r.status).toBe('DEGRADED');
  });

  it('có lớp chưa gán giảng viên → Submissions & Classes DEGRADED; engine SQL chưa nạp → DOWN', async () => {
    const orphan = build({ classes: { countDocuments: jest.fn().mockResolvedValueOnce(5).mockResolvedValueOnce(2) } });
    expect((await orphan.svc.healthCheck(ADMIN)).clusters[3]).toMatchObject({ status: 'DEGRADED' });
    const noSql = build({ sql: null });
    expect((await noSql.svc.healthCheck(ADMIN)).clusters[1].status).toBe('DOWN');
  });

  it('có cuộc thi đang diễn ra thì tính thử bảng xếp hạng', async () => {
    const { svc, leaderboard } = build({ contests: { find: jest.fn().mockReturnValue(lean([{ _id: 'k1', title: 'ICPC' }])) } });
    const res = await svc.healthCheck(ADMIN);
    expect(leaderboard.computeLeaderboard).toHaveBeenCalledWith('k1');
    expect(res.clusters[4].detail).toContain('tính được 2 thí sinh');
  });

  it('chỉ ADMIN được kiểm tra', async () => {
    await expect(build().svc.healthCheck(TEACHER)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('AdminPortalService: khóa Người đi làm, chi tiết và lưu trữ', () => {
  const careerCls = { _id: CLASS_ID, name: 'Kiểm thử phần mềm thực chiến (Tester QA)', code: 'CL-CAREER-TESTER', courseKey: 'tester-qa', teacherId: T1, studentIds: [] };
  const schoolCls = { _id: 'c2', name: 'Python K6-9', code: 'CL-69', teacherId: T1, studentIds: ['s1'], exerciseSlugs: ['a', 'b'] };
  const sortFind = (rows: unknown[]) => ({ sort: () => ({ lean: () => Promise.resolve(rows) }) });

  it('lớp khóa học: khối CAREER_ADULT, sĩ số = số học viên người đi làm, số bài = số lab thật; lớp phổ thông đếm bài giao', async () => {
    const { svc, classes, users, assignments } = build();
    classes.find.mockReturnValue(sortFind([careerCls, schoolCls]));
    users.countDocuments.mockResolvedValue(2);
    assignments.aggregate.mockResolvedValue([{ _id: 'c2', n: 7 }]);
    users.find.mockReturnValue(lean([{ _id: T1, fullName: 'Thầy Bảo' }]));
    const rows = await svc.classesOverview(ADMIN);
    expect(rows[0]).toMatchObject({ kind: 'CAREER', courseKey: 'tester-qa', ageGroup: 'CAREER_ADULT', studentCount: 2, exerciseCount: 12, status: 'OPEN' });
    expect(rows[1]).toMatchObject({ kind: 'SCHOOL', courseKey: null, exerciseCount: 7, studentCount: 1 });
  });

  it('lọc theo khối đào tạo và từ chối khối lạ', async () => {
    const { svc, classes, users } = build();
    classes.find.mockReturnValue(sortFind([careerCls, schoolCls]));
    users.find.mockReturnValue(lean([]));
    const rows = await svc.classesOverview(ADMIN, 'CAREER_ADULT');
    expect(rows.map((r) => r.id)).toEqual([CLASS_ID]);
    await expect(svc.classesOverview(ADMIN, '13-15')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('classDetail của khóa Người đi làm trả danh sách học viên CAREER_ADULT', async () => {
    const { svc, classes, users, testerLabs } = build();
    testerLabs.find.mockReturnValue({ sort: () => ({ limit: () => ({ select: () => ({ lean: () => Promise.resolve([{ labCode: 'T01', title: 'Kiểm thử đăng nhập' }]) }) }) }) });
    classes.find.mockReturnValue(sortFind([careerCls]));
    classes.findById.mockReturnValue({ lean: () => Promise.resolve(careerCls) });
    const student = { _id: 's9', fullName: 'Người đi làm', email: 'nguoidilam1@gmail.com', ageGroup: 'CAREER_ADULT' };
    users.find.mockImplementation(() => ({ ...lean([student]), sort: () => ({ limit: () => lean([student]) }) }));
    const d = await svc.classDetail(ADMIN, CLASS_ID);
    expect(d.students).toEqual([{ id: 's9', fullName: 'Người đi làm', email: 'nguoidilam1@gmail.com', studentCode: null, ageGroup: 'CAREER_ADULT' }]);
    expect(d.exercises).toEqual([{ title: 'T01 · Kiểm thử đăng nhập', kind: 'TESTER', status: 'OPEN', dueAt: null }]);
    await expect(svc.classDetail(ADMIN, 'xyz')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('classDetail của lớp phổ thông: bài giao kèm trạng thái theo thời gian thật (chưa mở / đang mở / đã hết hạn)', async () => {
    const { svc, classes, users, assignments } = build();
    const day = 24 * 3600 * 1000;
    const at = (d: number) => new Date(Date.now() + d * day);
    classes.find.mockReturnValue(sortFind([{ ...schoolCls, _id: CLASS_ID }]));
    classes.findById.mockReturnValue({ lean: () => Promise.resolve({ ...schoolCls, _id: CLASS_ID }) });
    users.find.mockImplementation(() => ({ ...lean([]), sort: () => ({ limit: () => lean([]), ...lean([]) }) }));
    assignments.find = jest.fn().mockReturnValue({
      sort: () => ({ limit: () => ({ select: () => ({ lean: () => Promise.resolve([
        { title: 'Đã qua', type: 'CODING', startAt: at(-5), dueAt: at(-2) },
        { title: 'Đang mở', type: 'QUIZ', startAt: at(-1), dueAt: at(2) },
        { title: 'Sắp tới', type: 'CODING', startAt: at(1), dueAt: at(3) },
      ]) }) }) }) });
    const d = await svc.classDetail(ADMIN, CLASS_ID);
    expect(d.exercises.map((e) => [e.title, e.status])).toEqual([['Đã qua', 'CLOSED'], ['Đang mở', 'OPEN'], ['Sắp tới', 'UPCOMING']]);
  });

  it('setArchived đổi trạng thái và ghi CLASS_ARCHIVE; không đổi thì không ghi log; sai kiểu bị từ chối', async () => {
    const { svc, classes, audit } = build();
    classes.findById.mockReturnValue({ lean: () => Promise.resolve({ name: 'Lớp A', archived: false }) });
    await svc.setArchived(ADMIN, CLASS_ID, true);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: CLASS_ID }, { $set: { archived: true } });
    expect(audit.record).toHaveBeenCalledWith(ADMIN, 'CLASS_ARCHIVE', 'CLASS', CLASS_ID, { className: 'Lớp A', archived: false }, { className: 'Lớp A', archived: true });
    audit.record.mockClear();
    classes.updateOne.mockClear();
    await svc.setArchived(ADMIN, CLASS_ID, false);
    expect(classes.updateOne).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
    await expect(svc.setArchived(ADMIN, CLASS_ID, 'yes')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.setArchived(TEACHER, CLASS_ID, true)).rejects.toBeInstanceOf(ForbiddenException);
  });
});
