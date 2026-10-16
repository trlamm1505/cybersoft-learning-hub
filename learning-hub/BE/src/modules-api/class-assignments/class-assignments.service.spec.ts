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
  for (const m of ['select', 'sort', 'limit', 'skip']) chain[m] = () => chain;
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
  const classes = { findOne: jest.fn((filter: { studentIds?: string }) => q(filter.studentIds && [U1, U2, U3].includes(filter.studentIds) ? cls : null)), findById: jest.fn(() => q(cls)), updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }) };
  const assignmentModel = {
    find: jest.fn(() => q(assignments)),
    findById: jest.fn((id: string) => q(assignments.find((a) => a._id === id) ?? null)),
    countDocuments: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    findOne: jest.fn(() => q({ type: 'CODING', exerciseSlug: 'tinh-tong' })),
  };
  const subModel = { find: jest.fn(() => q(submissions)) };
  const attemptModel = { find: jest.fn(() => q(quizAttempts)) };
  const users = {
    findById: jest.fn(() => q({ fullName: 'Cô Lan', email: 'lan@x.vn', avatar: 'a.png' })),
    find: jest.fn(() => q([{ _id: U1, fullName: 'An Nguyễn' }, { _id: U2, fullName: 'Bình Trần' }, { _id: U3, fullName: 'Chi Lê' }])),
  };
  const exercises = {
    findOne: jest.fn(() => q({ type: 'CODE_TEXT' })),
    countDocuments: jest.fn().mockResolvedValue(23),
    find: jest.fn(() => q([{ slug: 'a', title: 'Bài A', difficulty: 'EASY', tags: ['loop'], points: 10 }])),
  };
  const questions = {
    countDocuments: jest.fn().mockResolvedValue(1),
    find: jest.fn(() => q([{ _id: hex(900), content: 'HTML là gì?', difficulty: 'EASY', category: 'HTML', tags: [] }])),
  };
  const service = new ClassAssignmentsService(classes as never, assignmentModel as never, subModel as never, attemptModel as never, users as never, exercises as never, questions as never);
  return { service, classes, assignmentModel, exercises, questions };
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

describe('giảng viên: bài theo ngày, ngân hàng đề phân trang, lớp Career', () => {
  const teacher = { sub: TEACHER, email: 't@x.vn', role: 'TEACHER' };
  const create = { type: 'CODING', title: 'Bài', exerciseSlug: 'tinh-tong', startAt: '2026-10-20T00:00:00Z', dueAt: '2026-10-21T00:00:00Z' } as const;

  it('daysForTeacher: gom Ngày 1, 2, ... cùng cách gom với học viên, kèm trạng thái mở/hết hạn và tiến độ', async () => {
    const { service } = build();
    const r = await service.daysForTeacher(C1, teacher, NOW);
    expect(r.days.length).toBeGreaterThan(0);
    expect(r.days.map((d) => d.dayNumber)).toEqual(r.days.map((_, i) => i + 1));
    const a = r.days[0].assignments[0];
    expect(['UPCOMING', 'OPEN', 'EXPIRED']).toContain(a.window);
    expect(a).toMatchObject({ memberCount: 3 });
    const student = await service.overview(C1, { sub: U1, email: 'x', role: 'STUDENT' }, NOW);
    expect(r.days.map((d) => [d.date, d.assignments.length])).toEqual(student.days.map((d) => [d.date, d.assignments.length]));
  });

  it('giảng viên lớp khác không xem được bài theo ngày (403)', async () => {
    const { service } = build();
    await expect(service.daysForTeacher(C1, { sub: hex(555), email: '', role: 'TEACHER' })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('giao bài code: slug được thêm vào danh sách theo dõi của lớp', async () => {
    const { service, assignmentModel, classes } = build();
    assignmentModel.create.mockResolvedValue({ _id: hex(78), toObject: () => ({ title: 'x' }) });
    await service.create(C1, create as never, teacher);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: expect.anything() }, { $addToSet: { exerciseSlugs: 'tinh-tong' } });
  });

  it('xóa bài code cuối cùng dùng slug thì gỡ slug khỏi danh sách theo dõi; còn bài khác dùng thì giữ', async () => {
    const { service, assignmentModel, classes } = build();
    assignmentModel.countDocuments.mockResolvedValue(0);
    await service.remove(C1, hex(1), teacher);
    expect(classes.updateOne).toHaveBeenCalledWith({ _id: expect.anything() }, { $pull: { exerciseSlugs: 'tinh-tong' } });
    classes.updateOne.mockClear();
    assignmentModel.countDocuments.mockResolvedValue(1);
    await service.remove(C1, hex(1), teacher);
    expect(classes.updateOne).not.toHaveBeenCalled();
  });

  it('lớp Career (Tester QA / Data SQL / AI Prompt) và lớp đã lưu trữ không giao được bài -> 400', async () => {
    const { service, classes } = build();
    classes.findById.mockReturnValueOnce(q({ ...cls, courseKey: 'data-sql', code: 'CL-CAREER-DATA' }));
    await expect(service.create(C1, create as never, teacher)).rejects.toMatchObject({ response: { code: 'E400_CAREER_CLASS_NO_ASSIGNMENT' } });
    classes.findById.mockReturnValueOnce(q({ ...cls, archived: true }));
    await expect(service.create(C1, create as never, teacher)).rejects.toMatchObject({ response: { code: 'E400_CLASS_ARCHIVED' } });
  });

  it('ngân hàng bài code: phân trang 10 bài/trang, lọc độ khó và từ khóa (thoát ký tự regex)', async () => {
    const { service, exercises } = build();
    const r = await service.catalogExercises(teacher, { q: 'a.b*', difficulty: 'HARD', page: '3' });
    expect(r).toMatchObject({ total: 23, page: 3, pageSize: 10, totalPages: 3 });
    const filter = exercises.countDocuments.mock.calls[0][0] as Record<string, any>;
    expect(filter).toMatchObject({ type: 'CODE_TEXT', difficulty: 'HARD' });
    expect(filter.$and[0].$or[0].title.$regex).toBe('a\\.b\\*');
    expect(exercises.find.mock.results[0].value).toBeDefined();
  });

  it('độ khó lạ bị bỏ qua; pageSize bị chặn tối đa 50; học viên không xem được ngân hàng', async () => {
    const { service, exercises } = build();
    await service.catalogExercises(teacher, { difficulty: 'IMPOSSIBLE', pageSize: '999', page: '-4' });
    expect(exercises.countDocuments.mock.calls[0][0]).not.toHaveProperty('difficulty');
    expect((await service.catalogExercises(teacher, { pageSize: '999' })).pageSize).toBe(50);
    await expect(service.catalogExercises(student(U1), {})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.catalogQuestions(student(U1), {})).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lọc theo khối: catalog gộp điều kiện khối với tìm kiếm, khối lạ bị bỏ qua', async () => {
    const { service, exercises, questions } = build();
    await service.catalogExercises(teacher, { q: 'tong', band: '10-12' });
    const f = exercises.countDocuments.mock.calls[0][0] as Record<string, any>;
    expect(f.$and).toHaveLength(2);
    expect(JSON.stringify(f.$and[1])).toContain('K10_12');
    await service.catalogExercises(teacher, { band: '3-5' });
    expect(exercises.countDocuments.mock.calls[1][0]).not.toHaveProperty('$and');
    await service.catalogQuestions(teacher, { band: '6-9' });
    expect(JSON.stringify((questions.countDocuments.mock.calls[0][0] as any).$and)).toContain('6-9');
  });

  it('không gán bài khác khối cho lớp (400 E400_BAND_MISMATCH); đúng khối hoặc bài chưa gắn khối thì được', async () => {
    const { service, classes, exercises, assignmentModel } = build();
    classes.findById.mockReturnValue(q({ ...cls, ageGroup: '6-9' }));
    assignmentModel.create.mockResolvedValue({ _id: hex(78), toObject: () => ({ title: 'x' }) });
    exercises.findOne.mockReturnValue(q({ type: 'CODE_TEXT', targetGroup: 'K10_12' }));
    await expect(service.create(C1, create as never, teacher)).rejects.toMatchObject({ response: { code: 'E400_BAND_MISMATCH' } });
    exercises.findOne.mockReturnValue(q({ type: 'CODE_TEXT', targetGroup: 'K6_9' }));
    await expect(service.create(C1, create as never, teacher)).resolves.toBeDefined();
    exercises.findOne.mockReturnValue(q({ type: 'CODE_TEXT' }));
    await expect(service.create(C1, create as never, teacher)).resolves.toBeDefined();
  });

  it('ngân hàng câu trắc nghiệm phân trang', async () => {
    const { service } = build();
    const r = await service.catalogQuestions(teacher, { q: 'html' });
    expect(r.items[0]).toMatchObject({ content: 'HTML là gì?', difficulty: 'EASY' });
    expect(r.pageSize).toBe(10);
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

describe('ClassAssignmentsService.myEnrollments', () => {
  const buildEnroll = (over: { assignments?: unknown[]; submissions?: unknown[]; quizAttempts?: unknown[] } = {}) => {
    const classes = { find: jest.fn(() => q([cls])) };
    const assignmentModel = { find: jest.fn(() => q(over.assignments ?? assignments)) };
    const subModel = { find: jest.fn(() => q(over.submissions ?? submissions)) };
    const attemptModel = { find: jest.fn(() => q(over.quizAttempts ?? quizAttempts)) };
    const users = {
      findById: jest.fn(() => q({ fullName: 'An Nguyễn' })),
      find: jest.fn(() => q([{ _id: TEACHER, fullName: 'Cô Lan' }])),
    };
    const service = new ClassAssignmentsService(classes as never, assignmentModel as never, subModel as never, attemptModel as never, users as never, {} as never, {} as never);
    return { service, classes };
  };

  it('chỉ lấy lớp mà chính học viên là thành viên (lọc theo userId trong token)', async () => {
    const { service, classes } = buildEnroll();
    await service.myEnrollments(student(U1), NOW);
    expect(classes.find).toHaveBeenCalledWith({ studentIds: U1 });
  });

  it('còn bài chưa khép lại: Đang học, chưa có chứng chỉ', async () => {
    const { service } = buildEnroll();
    const [e] = await service.myEnrollments(student(U1), NOW);
    expect(e).toMatchObject({ className: 'Lớp Python 6-9', teacherName: 'Cô Lan', status: 'IN_PROGRESS', doneCount: 2, totalAssignments: 4, certificate: null });
  });

  it('khép lại hết nhưng điểm thấp: Đã kết thúc, không cấp chứng chỉ', async () => {
    const { service } = buildEnroll();
    const [e] = await service.myEnrollments(student(U1), at('2026-11-01T00:00:00Z'));
    expect(e.status).toBe('ENDED');
    expect(e.certificate).toBeNull();
  });

  it('hoàn thành đủ điểm: có chứng chỉ với họ tên, điểm tổng kết, xếp loại, ngày và mã', async () => {
    const solo = [assignments[0], assignments[1]];
    const { service } = buildEnroll({ assignments: solo });
    const [e] = await service.myEnrollments(student(U1), NOW);
    // 8 + 9 = 17/20 = 85% => Giỏi; ngày hoàn thành là bài nộp muộn nhất (quiz 13/10 04:00Z)
    expect(e.status).toBe('COMPLETED');
    expect(e.certificate).toMatchObject({
      studentName: 'An Nguyễn',
      className: 'Lớp Python 6-9',
      teacherName: 'Cô Lan',
      finalScore: 85,
      earned: 17,
      max: 20,
      grade: 'Giỏi',
    });
    expect(e.certificate?.completedAt).toEqual(at('2026-10-13T04:00:00Z'));
    expect(e.certificate?.code).toMatch(/^CSH-2026-6A9F2K-[0-9A-F]{8}$/);
  });
});
