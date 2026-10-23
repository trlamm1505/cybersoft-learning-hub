import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { BANK_IN_USE_MESSAGE, QuestionBankService } from './question-bank.service';

const q = (value: unknown) => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'sort', 'skip', 'limit']) c[m] = () => c;
  c.lean = () => Promise.resolve(value);
  return c;
};

const teacher = { sub: 't1', email: 't@x.vn', role: 'TEACHER' } as never;
const admin = { sub: 'a1', email: 'a@x.vn', role: 'ADMIN' } as never;

const bankDoc = { slug: 'bai-ai', title: 'Bài AI', description: 'Mô tả', difficulty: 'EASY', bankOnly: true, bankBand: '6-9', testCases: [{ input: '1', expectedOutput: '1', isHidden: false }, { input: '2', expectedOutput: '2', isHidden: true }] };
const playgroundDoc = { slug: 'tinh-tong', title: 'Tính tổng', description: 'x', difficulty: 'EASY', gradeBand: '6-9', targetGroup: 'K6_9', testCases: [] };

function build(opts: { classes?: unknown[]; doc?: unknown; assignments?: number; contests?: unknown[] } = {}) {
  const exercises = {
    countDocuments: jest.fn().mockResolvedValue(1),
    find: jest.fn(() => q([bankDoc, playgroundDoc])),
    findOne: jest.fn(() => q(opts.doc === undefined ? bankDoc : opts.doc)),
    updateOne: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };
  const classes = { find: jest.fn(() => q(opts.classes ?? [{ ageGroup: '6-9' }])) };
  const assignments = { aggregate: jest.fn().mockResolvedValue(opts.assignments ? [{ _id: 'bai-ai', n: opts.assignments }] : []) };
  const contests = { find: jest.fn(() => q(opts.contests ?? [])) };
  const svc = new QuestionBankService(exercises as never, classes as never, assignments as never, contests as never);
  return { svc, exercises, classes, assignments, contests };
}

describe('QuestionBankService: phân quyền', () => {
  it('giảng viên chỉ phụ trách K3-5 / Career bị 403 E403_QUESTION_BANK_NOT_ELIGIBLE ở mọi thao tác', async () => {
    for (const classes of [[{ ageGroup: '3-5' }], [{ courseKey: 'tester-qa' }], [{ ageGroup: '6-9', archived: true }], []]) {
      const { svc } = build({ classes });
      await expect(svc.list(teacher, {})).rejects.toMatchObject({ response: { code: 'E403_QUESTION_BANK_NOT_ELIGIBLE' } });
      await expect(svc.detail(teacher, 'bai-ai')).rejects.toBeInstanceOf(ForbiddenException);
      await expect(svc.update(teacher, 'bai-ai', { title: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
      await expect(svc.remove(teacher, 'bai-ai')).rejects.toBeInstanceOf(ForbiddenException);
    }
  });

  it('giảng viên phụ trách K6-9 hoặc K10-12 được vào; học viên không; Admin luôn được', async () => {
    await expect(build({ classes: [{ ageGroup: '10-12' }] }).svc.access(teacher)).resolves.toEqual({ eligible: true });
    await expect(build().svc.access({ sub: 's', role: 'STUDENT' } as never)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(build({ classes: [] }).svc.access(admin)).resolves.toEqual({ eligible: true });
  });
});

describe('QuestionBankService: tra cứu đúng bài theo slug', () => {
  it('detail/sửa/xóa luôn truy vấn ĐÚNG slug được chọn (điều kiện loại bài demo không được ghi đè slug)', async () => {
    const { svc, exercises } = build();
    await svc.detail(teacher, 'bai-ai');
    await svc.update(teacher, 'bai-ai', { title: 'Mới' });
    await svc.remove(teacher, 'bai-ai');
    expect(exercises.findOne.mock.calls.length).toBeGreaterThanOrEqual(3);
    for (const call of exercises.findOne.mock.calls as unknown as Array<[Record<string, any>]>) {
      const [filter] = call;
      expect(filter.$and).toEqual(expect.arrayContaining([{ slug: 'bai-ai' }]));
      expect(filter.$and[1].slug).toHaveProperty('$not');
      expect(filter.slug).toBeUndefined();
    }
  });
});

describe('QuestionBankService: danh sách', () => {
  it('phân trang 10 bài, lọc khối + độ khó + từ khóa (thoát regex), gắn nguồn và khả năng sửa', async () => {
    const { svc, exercises } = build();
    const r = await svc.list(teacher, { q: 'a.b*', band: '10-12', difficulty: 'HARD', page: '2' });
    const f = exercises.countDocuments.mock.calls[0][0] as Record<string, any>;
    expect(f).toMatchObject({ type: 'CODE_TEXT', difficulty: 'HARD' });
    expect(f.$and[0].$or[0].title.$regex).toBe('a\\.b\\*');
    expect(JSON.stringify(f.$and[1])).toContain('10-12');
    expect(r).toMatchObject({ page: 2, pageSize: 10, total: 1 });
    expect(r.items[0]).toMatchObject({ slug: 'bai-ai', source: 'BANK', editable: true, band: '6-9' });
    expect(r.items[1]).toMatchObject({ slug: 'tinh-tong', source: 'PLAYGROUND', editable: false, band: '6-9' });
  });

  it('khối lạ và độ khó lạ bị bỏ qua', async () => {
    const { svc, exercises } = build();
    await svc.list(teacher, { band: '3-5', difficulty: 'IMPOSSIBLE' });
    const f = exercises.countDocuments.mock.calls[0][0] as Record<string, unknown>;
    expect(f).not.toHaveProperty('$and');
    expect(f).not.toHaveProperty('difficulty');
  });

  it('đánh dấu bài đang dùng trong lớp', async () => {
    const { svc } = build({ assignments: 2 });
    const r = await svc.list(teacher, {});
    expect(r.items[0]).toMatchObject({ inUse: true, usage: { classes: 2, contests: 0 } });
  });
});

describe('QuestionBankService: sửa', () => {
  it('sửa tiêu đề, mô tả, độ khó và test case (gộp test ẩn vào testCases)', async () => {
    const { svc, exercises } = build();
    await svc.update(teacher, 'bai-ai', { title: ' Tên mới ', description: 'Mô tả mới', difficulty: 'HARD', testCases: [{ input: '1', expectedOutput: '2', isHidden: false }, { input: '3', expectedOutput: '4', isHidden: true }] });
    expect(exercises.updateOne.mock.calls[0][1].$set).toMatchObject({ title: 'Tên mới', description: 'Mô tả mới', difficulty: 'HARD', hiddenTestCases: [] });
  });

  it('đổi khối: cập nhật bankBand + targetGroup/labType/gradeBand đồng bộ', async () => {
    const { svc, exercises } = build();
    await svc.update(teacher, 'bai-ai', { band: '10-12' });
    expect(exercises.updateOne.mock.calls[0][1].$set).toMatchObject({ bankBand: '10-12', targetGroup: 'K10_12', labType: 'ALGO_JUDGE', gradeBand: '9-12' });
  });

  it('không đổi khối khi bài đang dùng (409); dữ liệu sai bị 400', async () => {
    await expect(build({ assignments: 1 }).svc.update(teacher, 'bai-ai', { band: '10-12' })).rejects.toBeInstanceOf(ConflictException);
    const { svc } = build();
    await expect(svc.update(teacher, 'bai-ai', { band: '3-5' })).rejects.toMatchObject({ response: { code: 'E400_INVALID_BAND' } });
    await expect(svc.update(teacher, 'bai-ai', { title: '  ' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update(teacher, 'bai-ai', { difficulty: 'X' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update(teacher, 'bai-ai', { testCases: [{ input: '1', expectedOutput: '1' }] })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.update(teacher, 'bai-ai', { testCases: [{ input: '1', expectedOutput: '1', isHidden: true }, { input: '2', expectedOutput: '2', isHidden: true }] })).rejects.toThrow(/test case hiện/);
    await expect(svc.update(teacher, 'bai-ai', {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('bài của Code Playground cố định không sửa được (403 E403_PLAYGROUND_FIXED)', async () => {
    const { svc, exercises } = build({ doc: playgroundDoc });
    await expect(svc.update(teacher, 'tinh-tong', { title: 'x' })).rejects.toMatchObject({ response: { code: 'E403_PLAYGROUND_FIXED' } });
    expect(exercises.updateOne).not.toHaveBeenCalled();
  });

  it('bài không tồn tại: 404', async () => {
    await expect(build({ doc: null }).svc.detail(teacher, 'khong-co')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('QuestionBankService: xóa an toàn', () => {
  it('xóa được bài không dùng ở đâu', async () => {
    const { svc, exercises } = build();
    await expect(svc.remove(teacher, 'bai-ai')).resolves.toEqual({ deleted: true, slug: 'bai-ai' });
    expect(exercises.deleteOne).toHaveBeenCalledWith({ slug: 'bai-ai', bankOnly: true });
  });

  it('đang gán vào Ngày học của lớp: chặn xóa với thông báo chuẩn (409)', async () => {
    const { svc, exercises } = build({ assignments: 1 });
    await expect(svc.remove(teacher, 'bai-ai')).rejects.toMatchObject({ response: { code: 'E409_BANK_EXERCISE_IN_USE', message: BANK_IN_USE_MESSAGE } });
    expect(BANK_IN_USE_MESSAGE).toBe('Không thể xóa bài tập đang được sử dụng trong Lớp học hoặc Cuộc thi');
    expect(exercises.deleteOne).not.toHaveBeenCalled();
  });

  it('đang nằm trong đề cuộc thi: chặn xóa', async () => {
    const { svc, exercises } = build({ contests: [{ problems: [{ source: 'exercise', slug: 'bai-ai', exerciseSlug: 'bai-ai' }] }] });
    await expect(svc.remove(teacher, 'bai-ai')).rejects.toBeInstanceOf(ConflictException);
    expect(exercises.deleteOne).not.toHaveBeenCalled();
  });

  it('bài Code Playground không xóa được', async () => {
    const { svc, exercises } = build({ doc: playgroundDoc });
    await expect(svc.remove(teacher, 'tinh-tong')).rejects.toMatchObject({ response: { code: 'E403_PLAYGROUND_FIXED' } });
    expect(exercises.deleteOne).not.toHaveBeenCalled();
  });
});
