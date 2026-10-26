import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { ClassAssignment, ClassAssignmentDocument } from '../../modules-system/database/schemas/class-assignment.schema';
import { Contest, ContestDocument } from '../../modules-system/database/schemas/contest.schema';
import { Question, QuestionDocument } from '../../modules-system/database/schemas/question.schema';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { escapeRegex, normalizeDifficulty, normalizePage, toPaged } from '../class-assignments/assignment-days';
import { normalizeBankBand, type BankBand } from '../exercise/exercise-matrix';
import { QuestionBankService } from './question-bank.service';

export const QUIZ_IN_USE_MESSAGE = 'Không thể xóa câu hỏi đang được dùng trong bài giao của Lớp học hoặc đề Cuộc thi';
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;
const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];
const LIMITS = { content: 2000, codeSnippet: 5000, option: 500, explanation: 2000, category: 40, tag: 30, tags: 10 };
const DEFAULT_CATEGORY = 'Ngân hàng đề';

export interface QuizQuestionInput {
  content?: unknown;
  codeSnippet?: unknown;
  options?: unknown;
  explanation?: unknown;
  difficulty?: unknown;
  band?: unknown;
  category?: unknown;
  tags?: unknown;
  points?: unknown;
}

export interface QuizBankListQuery {
  q?: string;
  band?: string;
  difficulty?: string;
  page?: string;
  pageSize?: string;
}

type QuestionLean = {
  _id: unknown;
  content: string;
  codeSnippet?: string;
  options: Array<{ key: string; text: string; isCorrect: boolean }>;
  explanation: string;
  difficulty?: string;
  category?: string;
  tags?: string[];
  points?: number;
  gradeBands?: string[];
  bankOnly?: boolean;
  authorId?: string;
  createdAt?: Date;
};

const asId = (v: unknown) => String(v);
const text = (v: unknown, field: string, max: number, required = true): string => {
  if (v === undefined || v === null) {
    if (required) throw new BadRequestException(`Thiếu ${field}.`);
    return '';
  }
  if (typeof v !== 'string') throw new BadRequestException(`${field} phải là chuỗi ký tự.`);
  const t = v.trim();
  if (required && !t) throw new BadRequestException(`${field} không được để trống.`);
  if (t.length > max) throw new BadRequestException(`${field} tối đa ${max} ký tự.`);
  return t;
};

/**
 * Chuẩn hóa và kiểm tra một câu trắc nghiệm (dùng cho tạo mới; khi sửa chỉ kiểm tra các trường được gửi lên).
 * Đáp án: 2–6 lựa chọn, ĐÚNG MỘT đáp án đúng; máy chủ tự gán key A, B, C… theo thứ tự giảng viên nhập.
 */
export function parseQuizQuestion(input: QuizQuestionInput, partial = false) {
  const out: Record<string, unknown> = {};
  if (!partial || input.content !== undefined) out.content = text(input.content, 'Nội dung câu hỏi', LIMITS.content);
  if (input.codeSnippet !== undefined) out.codeSnippet = text(input.codeSnippet, 'Đoạn code minh họa', LIMITS.codeSnippet, false) || undefined;
  if (!partial || input.explanation !== undefined) out.explanation = text(input.explanation, 'Giải thích đáp án', LIMITS.explanation);
  if (!partial || input.options !== undefined) {
    if (!Array.isArray(input.options) || input.options.length < MIN_OPTIONS || input.options.length > MAX_OPTIONS) {
      throw new BadRequestException(`Cần từ ${MIN_OPTIONS} đến ${MAX_OPTIONS} đáp án.`);
    }
    const options = input.options.map((o, i) => {
      const item = o as { text?: unknown; isCorrect?: unknown } | null;
      if (!item || typeof item !== 'object') throw new BadRequestException(`Đáp án ${OPTION_KEYS[i]} không hợp lệ.`);
      return { key: OPTION_KEYS[i], text: text(item.text, `Đáp án ${OPTION_KEYS[i]}`, LIMITS.option), isCorrect: item.isCorrect === true };
    });
    if (options.filter((o) => o.isCorrect).length !== 1) throw new BadRequestException('Phải chọn đúng MỘT đáp án đúng.');
    if (new Set(options.map((o) => o.text.toLowerCase())).size !== options.length) throw new BadRequestException('Các đáp án không được trùng nhau.');
    out.options = options;
  }
  if (!partial || input.difficulty !== undefined) {
    const d = normalizeDifficulty(input.difficulty as string);
    if (!d) throw new BadRequestException('Độ khó chỉ nhận EASY, MEDIUM hoặc HARD.');
    out.difficulty = d;
  }
  if (!partial || input.band !== undefined) {
    const band = normalizeBankBand(input.band);
    if (!band) throw new BadRequestException({ code: 'E400_INVALID_BAND', message: 'Khối chỉ nhận 6-9 hoặc 10-12.' });
    out.gradeBands = [band];
  }
  if (input.category !== undefined || !partial) out.category = text(input.category, 'Chủ đề', LIMITS.category, false) || DEFAULT_CATEGORY;
  if (input.tags !== undefined) {
    if (!Array.isArray(input.tags) || input.tags.length > LIMITS.tags) throw new BadRequestException(`Tối đa ${LIMITS.tags} thẻ.`);
    out.tags = [...new Set(input.tags.map((t) => text(t, 'Thẻ', LIMITS.tag)))];
  }
  if (input.points !== undefined || !partial) {
    const p = input.points === undefined ? 10 : Number(input.points);
    if (!Number.isInteger(p) || p < 1 || p > 100) throw new BadRequestException('Điểm của câu từ 1 đến 100.');
    out.points = p;
  }
  return out;
}

/**
 * Ngân hàng đề TRẮC NGHIỆM (Day 30): giảng viên khối 6-9 / 10-12 soạn câu hỏi, dùng cho bài giao theo Ngày của lớp và đề
 * Cuộc thi (cả hai chọn câu qua questionIds). Câu luôn bankOnly nên không lọt vào /quiz tự luyện công khai.
 */
@Injectable()
export class QuizBankService {
  constructor(
    @InjectModel(Question.name) private readonly questions: Model<QuestionDocument>,
    @InjectModel(ClassAssignment.name) private readonly assignments: Model<ClassAssignmentDocument>,
    @InjectModel(Contest.name) private readonly contests: Model<ContestDocument>,
    private readonly bank: QuestionBankService,
  ) {}

  /** Số bài giao lớp / cuộc thi đang dùng từng câu. */
  async usageOf(ids: string[]): Promise<Map<string, { classes: number; contests: number }>> {
    const out = new Map(ids.map((id) => [id, { classes: 0, contests: 0 }]));
    if (ids.length === 0) return out;
    const [asg, contests] = await Promise.all([
      this.assignments.find({ questionIds: { $in: ids } }).select('questionIds').lean<Array<{ questionIds?: string[] }>>(),
      this.contests.find({ 'problems.questionIds': { $in: ids } }).select('problems.questionIds').lean<Array<{ problems?: Array<{ questionIds?: string[] }> }>>(),
    ]);
    for (const a of asg) for (const id of new Set((a.questionIds ?? []).map(String))) if (out.has(id)) out.get(id)!.classes += 1;
    for (const c of contests) {
      const hit = new Set((c.problems ?? []).flatMap((p) => (p.questionIds ?? []).map(String)));
      for (const id of hit) if (out.has(id)) out.get(id)!.contests += 1;
    }
    return out;
  }

  private toRow(q: QuestionLean, use?: { classes: number; contests: number }, user?: JwtPayload) {
    const inUse = (use?.classes ?? 0) + (use?.contests ?? 0);
    return {
      id: asId(q._id),
      content: q.content,
      difficulty: q.difficulty ?? 'MEDIUM',
      band: (q.gradeBands?.[0] as BankBand | undefined) ?? null,
      category: q.category ?? null,
      tags: q.tags ?? [],
      points: q.points ?? 10,
      optionCount: q.options?.length ?? 0,
      usage: { classes: use?.classes ?? 0, contests: use?.contests ?? 0 },
      inUse: inUse > 0,
      mine: !!user && q.authorId === user.sub,
      createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : null,
    };
  }

  private async load(id: string): Promise<QuestionLean> {
    if (!isValidObjectId(id)) throw new NotFoundException('Không tìm thấy câu hỏi.');
    const q = await this.questions.findOne({ _id: id, bankOnly: true }).lean<QuestionLean>();
    if (!q) throw new NotFoundException('Không tìm thấy câu hỏi trong Ngân hàng đề.');
    return q;
  }

  /** Giảng viên chỉ đụng câu do mình soạn và thuộc khối mình đang phụ trách; Admin không giới hạn. */
  private assertCanEdit(q: QuestionLean, bands: string[] | null, user: JwtPayload) {
    if (user.role === 'ADMIN') return;
    if (q.authorId && q.authorId !== user.sub) {
      throw new ForbiddenException({ code: 'E403_NOT_OWNER', message: 'Bạn chỉ được sửa/xóa câu hỏi do chính mình soạn.' });
    }
    const band = q.gradeBands?.[0];
    if (bands && band && !bands.includes(band)) {
      throw new ForbiddenException({ code: 'E403_BAND_NOT_OWNED', message: `Câu hỏi thuộc Khối ${band}: bạn không phụ trách lớp khối này.` });
    }
  }

  private assertBandOwned(band: string, bands: string[] | null) {
    if (bands && !bands.includes(band)) {
      throw new ForbiddenException({ code: 'E403_BAND_NOT_OWNED', message: `Bạn không phụ trách lớp Khối ${band} nên không soạn câu cho khối này.` });
    }
  }

  async list(user: JwtPayload, q: QuizBankListQuery) {
    await this.bank.assertEligible(user);
    const { page, pageSize } = normalizePage(q);
    const filter: Record<string, unknown> = { bankOnly: true };
    const term = (typeof q.q === 'string' ? q.q : '').trim().slice(0, 60);
    if (term) {
      const rx = { $regex: escapeRegex(term), $options: 'i' };
      filter.$or = [{ content: rx }, { category: rx }, { tags: rx }];
    }
    const band = normalizeBankBand(q.band);
    if (band) filter.gradeBands = band;
    const difficulty = normalizeDifficulty(q.difficulty);
    if (difficulty) filter.difficulty = difficulty;
    const [total, docs] = await Promise.all([
      this.questions.countDocuments(filter),
      this.questions
        .find(filter)
        .select('content difficulty category tags points gradeBands options authorId createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<QuestionLean[]>(),
    ]);
    const usage = await this.usageOf(docs.map((d) => asId(d._id)));
    return toPaged(docs.map((d) => this.toRow(d, usage.get(asId(d._id)), user)), total, page, pageSize);
  }

  async detail(user: JwtPayload, id: string) {
    await this.bank.assertEligible(user);
    const q = await this.load(id);
    const usage = await this.usageOf([asId(q._id)]);
    return {
      ...this.toRow(q, usage.get(asId(q._id)), user),
      codeSnippet: q.codeSnippet ?? '',
      explanation: q.explanation,
      options: q.options.map((o) => ({ key: o.key, text: o.text, isCorrect: o.isCorrect })),
    };
  }

  async create(user: JwtPayload, input: QuizQuestionInput) {
    const bands = await this.bank.assertEligible(user);
    const data = parseQuizQuestion(input ?? {});
    this.assertBandOwned((data.gradeBands as string[])[0], bands);
    const created = await this.questions.create({ ...data, bankOnly: true, authorId: user.sub });
    return this.detail(user, asId(created._id));
  }

  async update(user: JwtPayload, id: string, input: QuizQuestionInput) {
    const bands = await this.bank.assertEligible(user);
    const q = await this.load(id);
    this.assertCanEdit(q, bands, user);
    const set = parseQuizQuestion(input ?? {}, true);
    if (Object.keys(set).length === 0) throw new BadRequestException('Không có thông tin nào để cập nhật.');
    if (set.gradeBands) {
      const nextBand = (set.gradeBands as string[])[0];
      this.assertBandOwned(nextBand, bands);
      if (nextBand !== q.gradeBands?.[0]) {
        const use = (await this.usageOf([asId(q._id)])).get(asId(q._id))!;
        if (use.classes + use.contests > 0) {
          throw new ConflictException({ code: 'E409_BANK_QUESTION_IN_USE', message: 'Câu hỏi đang được dùng trong Lớp học hoặc Cuộc thi nên không đổi khối được.', usage: use });
        }
      }
    }
    await this.questions.updateOne({ _id: asId(q._id) }, { $set: set });
    return this.detail(user, id);
  }

  async remove(user: JwtPayload, id: string) {
    const bands = await this.bank.assertEligible(user);
    const q = await this.load(id);
    this.assertCanEdit(q, bands, user);
    const use = (await this.usageOf([asId(q._id)])).get(asId(q._id))!;
    if (use.classes + use.contests > 0) {
      throw new ConflictException({ code: 'E409_BANK_QUESTION_IN_USE', message: QUIZ_IN_USE_MESSAGE, usage: use });
    }
    await this.questions.deleteOne({ _id: asId(q._id), bankOnly: true });
    return { deleted: true, id };
  }
}
