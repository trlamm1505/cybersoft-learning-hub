import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ClassAssignmentsService } from './class-assignments.service';
import { validateAssignmentInput } from './dto/create-assignment.dto';

const hex = (n: number) => n.toString(16).padStart(24, '0');
const C1 = hex(1);
const U1 = hex(101);
const U2 = hex(102);
const U3 = hex(103);
const OUTSIDER = hex(999);
const TEACHER = hex(200);

/** Chuỗi truy vấn mongoose giả: select/sort/limit trả chính nó, lean/exec trả giá trị. */
const q = (value: unknown) => {
  const chain: Record<string, unknown> = {};
  for (const m of ['select', 'sort', 'limit']) chain[m] = () => chain;
  chain.lean = () => Promise.resolve(value);
  chain.exec = () => Promise.resolve(value);
  return chain;
};

const at = (iso: string) => new Date(iso);
const NOW = at('2026-10-15T05:00:00Z'); // 12:00 giờ Việt Nam

// A1: code, ngày 13/10, đã quá hạn. A2: trắc nghiệm, ngày 13/10, đã quá hạn. A3: code đang mở hôm nay. A4: code chưa mở (mai).
const assignments = [
  { _id: hex(11), classId: C1, type: 'CODING', title: 'Tính tổng', exerciseSlug: 'tinh-tong', maxPoints: 10, startAt: at('2026-10-13T01:00:00Z'), dueAt: at('2026-10-14T01:00:00Z'), order: 1 },
  { _id: hex(12), classId: C1, type: 'QUIZ', title: 'Trắc nghiệm Python', questionIds: [hex(31)], maxPoints: 10, startAt: at('2026-10-13T02:00:00Z'), dueAt: at('2026-10-14T02:00:00Z'), order: 2 },
  { _id: hex(13), classId: C1, type: 'CODING', title: 'Số chẵn lẻ', exerciseSlug: 'chan-le', maxPoints: 10, startAt: at('2026-10-15T01:00:00Z'), dueAt: at('2026-10-16T01:00:00Z'), order: 3 },
  { _id: hex(14), classId: C1, type: 'CODING', title: 'Số nguyên tố', exerciseSlug: 'nguyen-to', maxPoints: 10, startAt: at('2026-10-16T01:00:00Z'), dueAt: at('2026-10-17T01:00:00Z'), order: 4 },
];

const sub = (assignmentId: string, userId: string, status: string, iso: string) => ({ assignmentId, userId, status, createdAt: at(iso) });
const submissions = [
  // U1 sai 2 lần rồi AC bài A1 => 8 điểm
  sub(hex(11), U1, 'WA', '2026-10-13T03:00:00Z'),
  sub(hex(11), U1, 'TLE', '2026-10-13T03:10:00Z'),
  sub(hex(11), U1, 'AC', '2026-10-13T03:20:00Z'),
  // U2 AC ngay bài A3 => 10 điểm
  sub(hex(13), U2, 'AC', '2026-10-15T02:00:00Z'),
  // U3 mới sai bài A3
  sub(hex(13), U3, 'WA', '2026-10-15T03:00:00Z'),
];
// U1 làm trắc nghiệm A2: 90/100 => 9 điểm; U3 nộp trễ hơn (không làm)
const quizAttempts = [{ assignmentId: hex(12), userId: U1, score: 90, maxScore: 100, submittedAt: at('2026-10-13T04:00:00Z') }];

const cls = { _id: C1, name: 'Lớp Python 6-9', code: 'CL-6A9F2K', description: 'Lớp demo', teacherId: TEACHER, studentIds: [U1, U2, U3] };

function build() {
  const classes = { findOne: jest.fn((filter: { studentIds?: string }) => q(filter.studentIds && [U1, U2, U3].includes(filter.studentIds) ? cls : null)), findById: jest.fn(() => q(cls)), };
  const assignmentModel = {
    find: jest.fn(() => q(assignments)),
    findById: jest.fn((id: string) => q(assignments.find((a) => a._id === id) ?? null)),
    countDocuments: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };
  const subModel = { find: jest.fn(() => q(submissions)) };
  const attemptModel = { find: jest.fn(() => q(quizAttempts)) };
  const users = {
    findById: jest.fn(() => q({ fullName: 'Cô Lan', email: 'lan@x.vn', avatar: 'a.png' })),
    find: jest.fn(() => q([{ _id: U1, fullName: 'An Nguyễn' }, { _id: U2, fullName: 'Bình Trần' }, { _id: U3, fullName: 'Chi Lê' }])),
  };
  const exercises = { findOne: jest.fn(() => q({ type: 'CODE_TEXT' })) };
  const questions = { countDocuments: jest.fn().mockResolvedValue(1) };
  const service = new ClassAssignmentsService(classes as never, assignmentModel as never, subModel as never, attemptModel as never, users as never, exercises as never, questions as never);
  return { service, classes, assignmentModel };
}

const student = (sub: string) => ({ sub, email: 'x@x.vn', role: 'STUDENT' });

describe('ClassAssignmentsService.overview', () => {
  it('thông tin lớp: tên, mã lớp, giảng viên (họ tên, avatar, email), số thành viên', async () => {
    const { service } = build();
    const o = await service.overview(C1, student(U1), NOW);
    expect(o.class).toMatchObject({ name: 'Lớp Python 6-9', code: 'CL-6A9F2K', memberCount: 3, teacher: { name: 'Cô Lan', email: 'lan@x.vn', avatar: 'a.png' } });
  });

  it('nhóm bài theo ngày được giao (giờ Việt Nam), đánh số Ngày 1, Ngày 2, ... và đếm bài chưa hoàn thành', async () => {
    const { service } = build();
    const o = await service.overview(C1, student(U2), NOW);
    expect(o.days.map((d) => [d.dayNumber, d.date, d.totalCount])).toEqual([
      [1, '2026-10-13', 2],
      [2, '2026-10-15', 1],
      [3, '2026-10-16', 1],
    ]);
    // U2 chưa làm A1, A2 (đã quá hạn) => 2 bài chưa hoàn thành ở ngày 1
    expect(o.days[0].pendingCount).toBe(2);
  });

  it('trạng thái từng bài: hoàn thành có điểm, hết hạn bị khóa, chưa mở bị khóa, đang mở làm được', async () => {
    const { service } = build();
    const u1 = await service.overview(C1, student(U1), NOW);
    const [a1, a2] = u1.days[0].assignments;
    expect(a1).toMatchObject({ state: 'DONE', score: 8, wrongCount: 2, locked: false });
    expect(a2).toMatchObject({ type: 'QUIZ', state: 'DONE', score: 9 });
    const open = u1.days[1].assignments[0];
    expect(open).toMatchObject({ state: 'NOT_STARTED', locked: false, potentialScore: 10 });
    expect(u1.days[2].assignments[0]).toMatchObject({ state: 'NOT_OPEN', locked: true });

    const u2 = await service.overview(C1, student(U2), NOW);
    expect(u2.days[0].assignments[0]).toMatchObject({ state: 'EXPIRED', locked: true, score: null });
    expect(u2.days[1].assignments[0]).toMatchObject({ state: 'DONE', score: 10 });

    const u3 = await service.overview(C1, student(U3), NOW);
    expect(u3.days[1].assignments[0]).toMatchObject({ state: 'IN_PROGRESS', wrongCount: 1, potentialScore: 9 });
  });

  it('tiến độ chung và hạng của mình', async () => {
    const { service } = build();
    const o = await service.overview(C1, student(U1), NOW);
    expect(o.progress).toMatchObject({ done: 2, total: 4, percent: 50, points: 17, maxPoints: 40 });
    expect(o.myRank).toEqual({ rank: 1, of: 3 });
  });

  it('người không thuộc lớp nhận 404, không biết lớp có tồn tại', async () => {
    const { service } = build();
    await expect(service.overview(C1, student(OUTSIDER), NOW)).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.overview('khong-hop-le', student(U1), NOW)).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('ClassAssignmentsService.leaderboard', () => {
  it('xếp theo tổng điểm giảm dần, kèm họ tên; chỉ thành viên xem được', async () => {
    const { service } = build();
    const lb = await service.leaderboard(C1, student(U2));
    expect(lb.rows.map((r) => [r.rank, r.name, r.points, r.isMe])).toEqual([
      [1, 'An Nguyễn', 17, false],
      [2, 'Bình Trần', 10, true],
      [3, 'Chi Lê', 0, false],
    ]);
    await expect(service.leaderboard(C1, student(OUTSIDER))).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('khóa nộp bài theo hạn chót', () => {
  it('bài đã quá hạn mà chưa hoàn thành: không nộp được (đã khóa)', async () => {
    const { service } = build();
    await expect(service.assertCanSubmitCoding(hex(11), 'tinh-tong', student(U2), NOW)).rejects.toThrow('hết hạn - đã khóa');
    await expect(service.assertCanSubmitCoding(hex(11), 'tinh-tong', student(U2), NOW)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('chưa đến giờ mở: không nộp được', async () => {
    const { service } = build();
    await expect(service.assertCanSubmitCoding(hex(14), 'nguyen-to', student(U1), NOW)).rejects.toThrow('chưa đến giờ mở');
  });

  it('đã hoàn thành: không nộp thêm (409); sai slug: 400', async () => {
    const { service } = build();
    await expect(service.assertCanSubmitCoding(hex(13), 'chan-le', student(U2), NOW)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.assertCanSubmitCoding(hex(13), 'slug-khac', student(U3), NOW)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('đang trong hạn và chưa xong: được nộp', async () => {
    const { service } = build();
    await expect(service.assertCanSubmitCoding(hex(13), 'chan-le', student(U3), NOW)).resolves.toMatchObject({ exerciseSlug: 'chan-le' });
  });

  it('người ngoài lớp không nộp được bài của lớp (404)', async () => {
    const { service } = build();
    await expect(service.assertCanSubmitCoding(hex(13), 'chan-le', student(OUTSIDER), NOW)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('trắc nghiệm: quá hạn bị khóa, đã làm xong thì không làm lại; sai loại bài bị từ chối', async () => {
    const { service } = build();
    await expect(service.assertCanStartQuiz(hex(12), student(U2), NOW)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.assertCanStartQuiz(hex(12), student(U1), NOW)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.assertCanStartQuiz(hex(13), student(U3), NOW)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('giảng viên giao bài', () => {
  const teacher = { sub: TEACHER, email: 't@x.vn', role: 'TEACHER' };

  it('giảng viên lớp khác không giao được bài (403); admin thì được', async () => {
    const { service } = build();
    await expect(service.create(C1, { type: 'CODING', title: 'x', exerciseSlug: 'tinh-tong', startAt: '2026-10-20T00:00:00Z', dueAt: '2026-10-21T00:00:00Z' }, { sub: hex(555), email: '', role: 'TEACHER' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('tạo bài đúng: gán classId và người tạo, bỏ qua trường lạ', async () => {
    const { service, assignmentModel } = build();
    assignmentModel.create.mockResolvedValue({ _id: hex(77), toObject: () => ({ title: 'x' }) });
    await service.create(C1, { type: 'CODING', title: ' Bài mới ', exerciseSlug: 'tinh-tong', startAt: '2026-10-20T00:00:00Z', dueAt: '2026-10-21T00:00:00Z', classId: 'hack', createdBy: 'hack' } as never, teacher);
    const arg = assignmentModel.create.mock.calls[0][0];
    expect(arg).toMatchObject({ classId: C1, createdBy: TEACHER, title: 'Bài mới', maxPoints: 10 });
  });
});

describe('validateAssignmentInput', () => {
  const ok = { type: 'CODING', title: 'x', exerciseSlug: 's', startAt: '2026-10-20T00:00:00Z', dueAt: '2026-10-21T00:00:00Z' };
  it('hạn chót phải sau thời gian bắt đầu', () => {
    expect(() => validateAssignmentInput({ ...ok, dueAt: '2026-10-19T00:00:00Z' })).toThrow('Hạn chót phải sau');
  });
  it('loại, tiêu đề, điểm, câu hỏi', () => {
    expect(() => validateAssignmentInput({ ...ok, type: 'X' })).toThrow(BadRequestException);
    expect(() => validateAssignmentInput({ ...ok, title: ' ' })).toThrow('Tiêu đề');
    expect(() => validateAssignmentInput({ ...ok, maxPoints: 0 })).toThrow('Tổng điểm');
    expect(() => validateAssignmentInput({ ...ok, exerciseSlug: '' })).toThrow('exerciseSlug');
    expect(() => validateAssignmentInput({ type: 'QUIZ', title: 'x', startAt: ok.startAt, dueAt: ok.dueAt })).toThrow('câu hỏi');
    expect(validateAssignmentInput({ type: 'QUIZ', title: 'x', questionIds: ['a', 'a', 'b'], startAt: ok.startAt, dueAt: ok.dueAt }).questionIds).toEqual(['a', 'b']);
  });
});
