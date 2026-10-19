import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { fakeModel } from '../teacher-analytics/fake-model';
import { CareerLabClassService } from './career-lab-class.service';
import { canUseAiGenerator, isCareerCourseClass, isSandboxCareerClass } from './domain/tester-progress';
import { ProblemGeneratorService } from '../problem-generator/problem-generator.service';
import { ProctorService } from '../integrity/proctor.service';
import { escapeRegex, groupByDay, nextDayKey, normalizePage, startOfVnDay, assignmentWindow } from '../class-assignments/assignment-days';
import type { JwtPayload } from '../../common/auth/jwt.strategy';

const OID = (n: number) => `64b${String(n).padStart(21, '0')}`;
const DATA_CLASS = OID(1);
const AI_CLASS = OID(2);
const TESTER_CLASS = OID(3);
const T1: JwtPayload = { sub: OID(90), email: 't1@x', role: 'TEACHER' };
const T2: JwtPayload = { sub: OID(91), email: 't2@x', role: 'TEACHER' };

describe('phân loại lớp', () => {
  it('lớp Career: có courseKey hoặc mã CL-CAREER-*; lớp sandbox: chỉ data-sql / ai-prompt', () => {
    expect(isCareerCourseClass({ courseKey: 'tester-qa' })).toBe(true);
    expect(isCareerCourseClass({ code: 'CL-CAREER-DATA' })).toBe(true);
    expect(isCareerCourseClass({ code: 'CL-1012A1' })).toBe(false);
    expect(isSandboxCareerClass({ courseKey: 'data-sql' })).toBe(true);
    expect(isSandboxCareerClass({ courseKey: 'ai-prompt' })).toBe(true);
    expect(isSandboxCareerClass({ courseKey: 'tester-qa' })).toBe(false);
  });

  it('AI Tạo Đề: chỉ khi phụ trách lớp 6-9 hoặc 10-12 còn hoạt động', () => {
    expect(canUseAiGenerator([{ ageGroup: '6-9' }])).toBe(true);
    expect(canUseAiGenerator([{ ageGroup: '10-12' }])).toBe(true);
    expect(canUseAiGenerator([{ ageGroup: '3-5' }, { courseKey: 'tester-qa' }])).toBe(false);
    expect(canUseAiGenerator([{ ageGroup: '10-12', archived: true }])).toBe(false);
    expect(canUseAiGenerator([{ ageGroup: '10-12', status: 'ARCHIVED' }])).toBe(false);
    expect(canUseAiGenerator([])).toBe(false);
  });
});

describe('ProblemGeneratorService.assertCanUse', () => {
  const svc = (rows: any[]) => new ProblemGeneratorService({ get: () => undefined } as never, {} as never, fakeModel(rows) as never);
  it('giảng viên có lớp K10-12 được dùng; chỉ có K3-5/Career thì 403', async () => {
    await expect(svc([{ _id: OID(5), ageGroup: '10-12', teacherId: T1.sub, teacherIds: [T1.sub] }]).assertCanUse(T1)).resolves.toBeUndefined();
    await expect(svc([{ _id: OID(5), ageGroup: '3-5', teacherId: T1.sub, teacherIds: [T1.sub] }]).assertCanUse(T1)).rejects.toMatchObject({ response: { code: 'E403_AI_GENERATOR_NOT_ELIGIBLE' } });
    await expect(svc([{ _id: OID(6), courseKey: 'tester-qa', teacherId: T1.sub, teacherIds: [T1.sub] }]).assertCanUse(T1)).rejects.toBeInstanceOf(ForbiddenException);
  });
  it('lớp của giảng viên khác không tính; Admin được dùng', async () => {
    await expect(svc([{ _id: OID(5), ageGroup: '6-9', teacherId: T2.sub, teacherIds: [T2.sub] }]).assertCanUse(T1)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc([]).assertCanUse({ sub: 'a', email: 'a', role: 'ADMIN' })).resolves.toBeUndefined();
  });
});

describe('ProctorService.listForTeacher: cảnh báo theo lớp không lẫn cuộc thi', () => {
  it('có classId thì chỉ lấy cảnh báo bài tập (CLASS_ASSIGNMENT) của đúng lớp đó', async () => {
    const find = jest.fn(() => ({ sort: () => ({ limit: () => ({ lean: async () => [] }) }) }));
    const proctor = new ProctorService({ find } as never, {} as never, {} as never, {} as never, {} as never, {} as never);
    await proctor.listForTeacher(T1, undefined, 100, 'class-1');
    const filter = (find.mock.calls[0] as unknown as [Record<string, unknown>])[0];
    expect(filter).toMatchObject({ kind: 'CLASS_ASSIGNMENT', classId: 'class-1' });
    // Không có classId (màn Giám sát liêm chính chung): cả cuộc thi lẫn bài lớp.
    await proctor.listForTeacher(T1);
    const general = (find.mock.calls[1] as unknown as [Record<string, unknown>])[0];
    expect(general).not.toHaveProperty('kind');
    expect(JSON.stringify(general)).toContain('CONTEST');
  });
});

describe('assignment-days: cấu trúc ngày học', () => {
  const row = (iso: string) => ({ startAt: new Date(iso), title: iso });

  it('gom theo ngày giờ Việt Nam và đánh số Ngày 1, 2, 3 theo thời gian', () => {
    const days = groupByDay([row('2026-10-20T10:00:00Z'), row('2026-10-18T02:00:00Z'), row('2026-10-20T01:00:00Z'), row('2026-10-19T18:00:00Z')]);
    // 18:00Z ngày 19 = 01:00 ngày 20 giờ VN -> cùng ngày 20.
    expect(days.map((d) => [d.dayNumber, d.date, d.assignments.length])).toEqual([[1, '2026-10-18', 1], [2, '2026-10-20', 3]]);
  });

  it('startOfVnDay / nextDayKey', () => {
    expect(startOfVnDay('2026-10-20').toISOString()).toBe('2026-10-19T17:00:00.000Z');
    expect(nextDayKey('2026-10-31')).toBe('2026-11-01');
    expect(nextDayKey('2026-12-31')).toBe('2027-01-01');
  });

  it('Sắp mở / Đang mở / Hết hạn', () => {
    const now = new Date('2026-10-20T00:00:00Z');
    expect(assignmentWindow(new Date('2026-10-21T00:00:00Z'), new Date('2026-10-25T00:00:00Z'), now)).toBe('UPCOMING');
    expect(assignmentWindow(new Date('2026-10-19T00:00:00Z'), new Date('2026-10-25T00:00:00Z'), now)).toBe('OPEN');
    expect(assignmentWindow(new Date('2026-10-10T00:00:00Z'), new Date('2026-10-12T00:00:00Z'), now)).toBe('EXPIRED');
  });

  it('phân trang: mặc định 10 bài/trang, chặn tối đa 50 và trang >= 1; thoát regex', () => {
    expect(normalizePage({})).toEqual({ page: 1, pageSize: 10 });
    expect(normalizePage({ page: '0', pageSize: '500' })).toEqual({ page: 1, pageSize: 50 });
    expect(normalizePage({ page: '4', pageSize: 'abc' })).toEqual({ page: 4, pageSize: 10 });
    expect(escapeRegex('a.b(c)')).toBe('a\\.b\\(c\\)');
  });
});

function build() {
  const classes = fakeModel([
    { _id: DATA_CLASS, name: 'Data', code: 'CL-CAREER-DATA', courseKey: 'data-sql', teacherId: T1.sub, teacherIds: [T1.sub] },
    { _id: AI_CLASS, name: 'AI', code: 'CL-CAREER-AI', courseKey: 'ai-prompt', teacherId: T1.sub, teacherIds: [T1.sub] },
    { _id: TESTER_CLASS, name: 'Tester', code: 'CL-CAREER-TESTER', courseKey: 'tester-qa', teacherId: T1.sub, teacherIds: [T1.sub] },
  ]);
  const users = fakeModel([
    { _id: OID(11), fullName: 'Học viên Giỏi', email: 'gioi@x', role: 'STUDENT', ageGroup: 'CAREER_ADULT' },
    { _id: OID(12), fullName: 'Học viên Mới', email: 'moi@x', role: 'STUDENT', ageGroup: 'CAREER_ADULT' },
    { _id: OID(13), fullName: 'Học sinh phổ thông', email: 'k@x', role: 'STUDENT', ageGroup: '10-12' },
  ]);
  (users as any).findOne = jest.fn((f: any) => {
    const row = (users as any).rows.find((r: any) => String(r._id) === String(f._id) && r.ageGroup === f.ageGroup);
    const qq: any = { select: () => qq, lean: async () => row ?? null };
    return qq;
  });
  const exercises = fakeModel([
    { _id: OID(21), slug: 'da-sql-1', title: 'SQL cơ bản', type: 'SQL_LAB', topic: 'da-lab-pack', resource_id: 'r1' },
    { _id: OID(22), slug: 'da-sql-2', title: 'SQL nâng cao', type: 'SQL_LAB', topic: 'da-lab-pack', resource_id: 'r1' },
    { _id: OID(23), slug: 'ai-1', title: 'Viết prompt tóm tắt', type: 'AI_LAB', topic: 'ai-lab-pack' },
  ]);
  const daLabs = fakeModel([
    { userId: OID(11), exerciseSlug: 'da-sql-1', type: 'SQL', status: 'GRADED', attemptCount: 3, score: 10, bestScore: 10, maxScore: 10, content: 'SELECT * FROM orders;', history: [{ content: 'SELECT 1', status: 'GRADED', score: 4, maxScore: 10, submittedAt: '2026-10-10T00:00:00.000Z' }], updatedAt: '2026-10-11T00:00:00.000Z' },
    { userId: OID(11), exerciseSlug: 'da-sql-2', type: 'SQL', status: 'GRADED', attemptCount: 2, score: 6, bestScore: 6, maxScore: 10, content: 'SELECT id FROM t', history: [], updatedAt: '2026-10-12T00:00:00.000Z' },
  ]);
  const aiLabs = fakeModel([
    { userId: OID(11), exerciseSlug: 'ai-1', status: 'PASSED', totalAttempts: 4, score: 80, maxScore: 100, best: { score: 90, prompt: 'Hãy tóm tắt trong 3 câu...' }, prompt: 'prompt cũ', history: [{ prompt: 'v1', score: 50, status: 'FAILED', createdAt: '2026-10-09T00:00:00.000Z' }] },
  ]);
  return { service: new CareerLabClassService(classes as never, users as never, exercises as never, daLabs as never, aiLabs as never) };
}

describe('CareerLabClassService (Data SQL Lab / AI Prompt Lab): chỉ theo dõi', () => {
  it('Data SQL: số Lab đạt, điểm TB theo phần trăm tốt nhất mỗi Lab, xếp hạng; học sinh phổ thông không lọt vào', async () => {
    const { service } = build();
    const r = await service.rosterWithProgress(T1, DATA_CLASS);
    expect(r).toMatchObject({ courseKey: 'data-sql', labsTotal: 2 });
    expect(r.students.map((s) => [s.fullName, s.rank, s.labsCompleted, s.labsTotal, s.avgScore, s.rating])).toEqual([
      ['Học viên Giỏi', 1, 1, 2, 80, 'GOOD'],
      ['Học viên Mới', null, 0, 2, null, 'NONE'],
    ]);
  });

  it('Data SQL: chi tiết có câu SQL đã nộp và các lần nộp gần nhất', async () => {
    const { service } = build();
    const d = await service.studentDetail(T1, DATA_CLASS, OID(11));
    const lab1 = d.labs.find((l) => l.slug === 'da-sql-1')!;
    expect(lab1).toMatchObject({ type: 'SQL', content: 'SELECT * FROM orders;', attempts: 3, passed: true, percent: 100 });
    expect(lab1.history[0].content).toBe('SELECT 1');
    expect(d.summary).toMatchObject({ labsCompleted: 1, avgScore: 80 });
  });

  it('AI Prompt: chi tiết có prompt tốt nhất, điểm và số lần chạy', async () => {
    const { service } = build();
    const r = await service.rosterWithProgress(T1, AI_CLASS);
    expect(r.students[0]).toMatchObject({ fullName: 'Học viên Giỏi', labsCompleted: 1, labsTotal: 1, avgScore: 90 });
    const d = await service.studentDetail(T1, AI_CLASS, OID(11));
    expect(d.labs[0]).toMatchObject({ type: 'AI_LAB', content: 'Hãy tóm tắt trong 3 câu...', attempts: 4, passed: true });
  });

  it('chỉ giảng viên phụ trách; lớp Tester QA/phổ thông -> 400; học sinh phổ thông -> 404', async () => {
    const { service } = build();
    await expect(service.rosterWithProgress(T2, DATA_CLASS)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.rosterWithProgress(T1, TESTER_CLASS)).rejects.toMatchObject({ response: { code: 'E400_NOT_SANDBOX_CLASS' } });
    await expect(service.rosterWithProgress(T1, TESTER_CLASS)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.studentDetail(T1, DATA_CLASS, OID(13))).rejects.toThrow(/không thuộc lớp/);
  });
});
