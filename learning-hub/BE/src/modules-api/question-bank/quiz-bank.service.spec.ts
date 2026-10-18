import 'reflect-metadata';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { parseQuizQuestion, QuizBankService } from './quiz-bank.service';
import { QuizBankController } from './quiz-bank.controller';
import { QuestionBankController } from './question-bank.controller';
import { QuestionBankModule } from './question-bank.module';

/** Day 30 — Soạn câu hỏi trắc nghiệm & Ngân hàng đề trắc nghiệm (Khối 6-9, 10-12). */
const Q1 = '64b0000000000000000000a1';
const teacher = { sub: 't1', email: 't@x', role: 'TEACHER' } as never;
const other = { sub: 't2', email: 'o@x', role: 'TEACHER' } as never;
const admin = { sub: 'a1', email: 'a@x', role: 'ADMIN' } as never;

const q = (value: unknown) => {
  const c: Record<string, unknown> = {};
  for (const m of ['select', 'sort', 'skip', 'limit']) c[m] = () => c;
  c.lean = () => Promise.resolve(value);
  return c;
};

const valid = {
  content: 'Kết quả của 3 // 2 trong Python?',
  options: [{ text: '1', isCorrect: true }, { text: '1.5' }, { text: '2' }],
  explanation: 'Phép // là chia lấy phần nguyên.',
  difficulty: 'EASY',
  band: '6-9',
};

function build(opts: { doc?: unknown; bands?: string[] | null; asgIds?: string[][]; contestIds?: string[][] } = {}) {
  const store: any = opts.doc === undefined ? { _id: Q1, ...parseQuizQuestion(valid), bankOnly: true, authorId: 't1' } : opts.doc;
  const questions: any = {
    create: jest.fn(async (d: any) => ({ _id: Q1, ...d })),
    findOne: jest.fn(() => q(store)),
    find: jest.fn(() => q(store ? [store] : [])),
    countDocuments: jest.fn().mockResolvedValue(store ? 1 : 0),
    updateOne: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  };
  const assignments: any = { find: jest.fn(() => q((opts.asgIds ?? []).map((ids) => ({ questionIds: ids })))) };
  const contests: any = { find: jest.fn(() => q((opts.contestIds ?? []).map((ids) => ({ problems: [{ questionIds: ids }] })))) };
  const bank: any = { assertEligible: jest.fn().mockResolvedValue(opts.bands === undefined ? ['6-9'] : opts.bands) };
  return { svc: new QuizBankService(questions, assignments, contests, bank), questions, bank };
}

describe('parseQuizQuestion: kiểm tra dữ liệu câu hỏi', () => {
  it('tự gán key A, B, C…; đúng MỘT đáp án đúng; khối chỉ 6-9 / 10-12', () => {
    const out = parseQuizQuestion(valid);
    expect(out.options).toEqual([{ key: 'A', text: '1', isCorrect: true }, { key: 'B', text: '1.5', isCorrect: false }, { key: 'C', text: '2', isCorrect: false }]);
    expect(out.gradeBands).toEqual(['6-9']);
    expect(out).toMatchObject({ points: 10, category: 'Ngân hàng đề' });
  });

  it.each([
    [{ ...valid, options: [{ text: 'a', isCorrect: true }] }, /từ 2 đến 6/],
    [{ ...valid, options: [{ text: 'a' }, { text: 'b' }] }, /đúng MỘT/],
    [{ ...valid, options: [{ text: 'a', isCorrect: true }, { text: 'b', isCorrect: true }] }, /đúng MỘT/],
    [{ ...valid, options: [{ text: 'a', isCorrect: true }, { text: 'A' }] }, /trùng/],
    [{ ...valid, band: '3-5' }, /6-9 hoặc 10-12/],
    [{ ...valid, content: { $ne: null } }, /phải là chuỗi/],
    [{ ...valid, explanation: '' }, /không được để trống/],
    [{ ...valid, difficulty: 'IMPOSSIBLE' }, /Độ khó/],
    [{ ...valid, points: 0 }, /từ 1 đến 100/],
  ])('dữ liệu sai → 400 (%#)', (input, msg) => {
    expect(() => parseQuizQuestion(input as never)).toThrow(msg);
  });
});

describe('QuizBankService: CRUD, sở hữu, khối, mức sử dụng', () => {
  it('tạo câu: luôn bankOnly + authorId từ token; khối không phụ trách → 403', async () => {
    const { svc, questions } = build();
    await svc.create(teacher, valid);
    expect(questions.create.mock.calls[0][0]).toMatchObject({ bankOnly: true, authorId: 't1', gradeBands: ['6-9'] });
    await expect(svc.create(teacher, { ...valid, band: '10-12' })).rejects.toMatchObject({ response: { code: 'E403_BAND_NOT_OWNED' } });
    await expect(build({ bands: null }).svc.create(admin, { ...valid, band: '10-12' })).resolves.toBeDefined();
  });

  it('chi tiết trả đáp án đúng cho giảng viên; danh sách chỉ lấy câu bankOnly và đếm mức dùng', async () => {
    const { svc, questions } = build({ asgIds: [[Q1]], contestIds: [[Q1, 'x']] });
    const d = await svc.detail(teacher, Q1);
    expect(d.options.find((o) => o.isCorrect)?.key).toBe('A');
    const list = await svc.list(teacher, { band: '6-9' });
    expect(questions.find.mock.calls.at(-1)[0]).toMatchObject({ bankOnly: true, gradeBands: '6-9' });
    expect(list.items[0]).toMatchObject({ usage: { classes: 1, contests: 1 }, inUse: true, mine: true });
  });

  it('giảng viên khác không sửa/xóa được; Admin được', async () => {
    const { svc } = build();
    await expect(svc.update(other, Q1, { content: 'x' })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(svc.remove(other, Q1)).rejects.toThrow(/chính mình/);
    await expect(build({ bands: null }).svc.remove(admin, Q1)).resolves.toEqual({ deleted: true, id: Q1 });
  });

  it('đang dùng trong bài giao/cuộc thi: chặn xóa và chặn đổi khối (409); sửa nội dung vẫn được', async () => {
    const used = build({ asgIds: [[Q1]], bands: ['6-9', '10-12'] });
    await expect(used.svc.remove(teacher, Q1)).rejects.toBeInstanceOf(ConflictException);
    await expect(used.svc.update(teacher, Q1, { band: '10-12' })).rejects.toMatchObject({ response: { code: 'E409_BANK_QUESTION_IN_USE' } });
    await used.svc.update(teacher, Q1, { content: 'Câu mới?' });
    expect(used.questions.updateOne).toHaveBeenCalledWith({ _id: Q1 }, { $set: { content: 'Câu mới?' } });
  });

  it('sửa không có trường nào → 400', async () => {
    await expect(build().svc.update(teacher, Q1, {})).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('Định tuyến', () => {
  it('QuizBankController được đăng ký trước QuestionBankController (questions không bị nhầm là :slug)', () => {
    const controllers = Reflect.getMetadata('controllers', QuestionBankModule) as unknown[];
    expect(controllers.indexOf(QuizBankController)).toBeLessThan(controllers.indexOf(QuestionBankController));
  });
});
