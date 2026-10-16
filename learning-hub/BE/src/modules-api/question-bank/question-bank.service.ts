import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClassAssignment, ClassAssignmentDocument } from '../../modules-system/database/schemas/class-assignment.schema';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { Contest, ContestDocument } from '../../modules-system/database/schemas/contest.schema';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { canUseAiGenerator } from '../assessment/domain/tester-progress';
import { escapeRegex, normalizeDifficulty, normalizePage, toPaged } from '../class-assignments/assignment-days';
import { bandOfExercise, bankLabels, exerciseBandFilter, normalizeBankBand } from '../exercise/exercise-matrix';

export const BANK_IN_USE_MESSAGE = 'Không thể xóa bài tập đang được sử dụng trong Lớp học hoặc Cuộc thi';
const MAX_TEST_CASES = 50;
const MAX_FIELD = 20_000;

export interface BankListQuery {
  q?: string;
  band?: string;
  difficulty?: string;
  page?: string | number;
  pageSize?: string | number;
}

export interface BankUpdateInput {
  title?: unknown;
  description?: unknown;
  band?: unknown;
  difficulty?: unknown;
  testCases?: unknown;
}

type Lean = {
  _id: unknown;
  slug: string;
  title: string;
  description?: string;
  difficulty?: string;
  tags?: string[];
  points?: number;
  bankOnly?: boolean;
  bankBand?: string;
  targetGroup?: string;
  gradeBand?: string;
  authorId?: string;
  testCases?: Array<{ input: string; expectedOutput?: string; isHidden?: boolean }>;
  hiddenTestCases?: Array<{ input: string; expectedOutput?: string; isHidden?: boolean }>;
};

/**
 * Quản lý Ngân hàng đề (bài code của khối 6-9 / 10-12): xem, lọc, sửa, xóa.
 *  - Chỉ giảng viên đang phụ trách lớp 6-9 / 10-12 còn hoạt động (và Admin) được dùng; còn lại 403 E403_QUESTION_BANK_NOT_ELIGIBLE.
 *  - Bài do giảng viên/AI tạo (bankOnly) được sửa/xóa. Bài của Code Playground cố định chỉ XEM (khối chỉ là nhãn phân loại), không sửa/xóa
 *    để kho Playground giữ nguyên 100%.
 *  - Bài đang được gán vào Ngày học của lớp hoặc nằm trong đề của cuộc thi thì không xóa được.
 */
@Injectable()
export class QuestionBankService {
  constructor(
    @InjectModel(Exercise.name) private readonly exercises: Model<ExerciseDocument>,
    @InjectModel(Classroom.name) private readonly classes: Model<ClassroomDocument>,
    @InjectModel(ClassAssignment.name) private readonly assignments: Model<ClassAssignmentDocument>,
    @InjectModel(Contest.name) private readonly contests: Model<ContestDocument>,
  ) {}

  async assertEligible(user: JwtPayload): Promise<void> {
    if (user.role === 'ADMIN') return;
    if (user.role !== 'TEACHER') throw this.notEligible();
    const mine = await this.classes
      .find({ archived: { $ne: true }, $or: [{ teacherId: user.sub }, { teacherIds: user.sub }] })
      .select('ageGroup courseKey archived')
      .lean<Array<{ ageGroup?: string; courseKey?: string; archived?: boolean }>>();
    if (!canUseAiGenerator(mine)) throw this.notEligible();
  }

  private notEligible() {
    return new ForbiddenException({ code: 'E403_QUESTION_BANK_NOT_ELIGIBLE', message: 'Ngân hàng đề chỉ dành cho giảng viên phụ trách lớp khối 6-9 hoặc 10-12.' });
  }

  private baseFilter(): Record<string, unknown> {
    return { type: 'CODE_TEXT', resource_id: { $exists: false } };
  }

  /** Số lớp/cuộc thi đang dùng từng slug. */
  async usageOf(slugs: string[]): Promise<Map<string, { classes: number; contests: number }>> {
    const out = new Map<string, { classes: number; contests: number }>(slugs.map((s) => [s, { classes: 0, contests: 0 }]));
    if (slugs.length === 0) return out;
    const [fromClasses, fromContests] = await Promise.all([
      this.assignments.aggregate<{ _id: string; n: number }>([{ $match: { type: 'CODING', exerciseSlug: { $in: slugs } } }, { $group: { _id: '$exerciseSlug', n: { $sum: 1 } } }]),
      this.contests.find({ $or: [{ 'problems.exerciseSlug': { $in: slugs } }, { problems: { $elemMatch: { source: 'exercise', slug: { $in: slugs } } } }] }).select('problems').lean<Array<{ problems?: Array<{ exerciseSlug?: string; slug?: string; source?: string }> }>>(),
    ]);
    for (const r of fromClasses) if (out.has(r._id)) out.get(r._id)!.classes = r.n;
    for (const c of fromContests) {
      const hit = new Set<string>();
      for (const p of c.problems ?? []) {
        if (p.exerciseSlug && out.has(p.exerciseSlug)) hit.add(p.exerciseSlug);
        if (p.source === 'exercise' && p.slug && out.has(p.slug)) hit.add(p.slug);
      }
      for (const s of hit) out.get(s)!.contests += 1;
    }
    return out;
  }

  async list(user: JwtPayload, q: BankListQuery) {
    await this.assertEligible(user);
    const { page, pageSize } = normalizePage(q);
    const filter: Record<string, unknown> = this.baseFilter();
    const and: Record<string, unknown>[] = [];
    const term = (typeof q.q === 'string' ? q.q : '').trim().slice(0, 60);
    if (term) {
      const rx = { $regex: escapeRegex(term), $options: 'i' };
      and.push({ $or: [{ title: rx }, { slug: rx }, { tags: rx }] });
    }
    const band = normalizeBankBand(q.band);
    if (band) and.push(exerciseBandFilter(band));
    if (and.length) filter.$and = and;
    const difficulty = normalizeDifficulty(q.difficulty);
    if (difficulty) filter.difficulty = difficulty;

    const [total, docs] = await Promise.all([
      this.exercises.countDocuments(filter),
      this.exercises
        .find(filter)
        .select('slug title difficulty tags points bankOnly bankBand targetGroup gradeBand authorId')
        .sort({ bankOnly: -1, title: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<Lean[]>(),
    ]);
    const usage = await this.usageOf(docs.map((d) => d.slug));
    const items = docs.map((d) => this.toRow(d, usage.get(d.slug)));
    return toPaged(items, total, page, pageSize);
  }

  private toRow(d: Lean, use?: { classes: number; contests: number }) {
    const inUse = (use?.classes ?? 0) + (use?.contests ?? 0);
    return {
      slug: d.slug,
      title: d.title,
      difficulty: d.difficulty ?? null,
      tags: d.tags ?? [],
      points: d.points ?? null,
      band: bandOfExercise(d),
      source: d.bankOnly === true ? ('BANK' as const) : ('PLAYGROUND' as const),
      editable: d.bankOnly === true,
      usage: { classes: use?.classes ?? 0, contests: use?.contests ?? 0 },
      inUse: inUse > 0,
    };
  }

  private async load(slug: string, withHidden = false): Promise<Lean> {
    const sel = this.exercises.findOne({ slug: String(slug), ...this.baseFilter() });
    if (withHidden) sel.select('+hiddenTestCases');
    const doc = await sel.lean<Lean>();
    if (!doc) throw new NotFoundException('Không tìm thấy bài trong Ngân hàng đề.');
    return doc;
  }

  async detail(user: JwtPayload, slug: string) {
    await this.assertEligible(user);
    const doc = await this.load(slug, true);
    const usage = await this.usageOf([doc.slug]);
    const cases = [...(doc.testCases ?? []), ...(doc.hiddenTestCases ?? []).map((t) => ({ ...t, isHidden: true }))];
    return {
      ...this.toRow(doc, usage.get(doc.slug)),
      description: doc.description ?? '',
      testCases: cases.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput ?? '', isHidden: t.isHidden === true })),
    };
  }

  private requireEditable(doc: Lean) {
    if (doc.bankOnly !== true) {
      throw new ForbiddenException({ code: 'E403_PLAYGROUND_FIXED', message: 'Bài thuộc kho Code Playground cố định: chỉ xem, không sửa hoặc xóa trong Ngân hàng đề.' });
    }
  }

  async update(user: JwtPayload, slug: string, input: BankUpdateInput) {
    await this.assertEligible(user);
    const doc = await this.load(slug, true);
    this.requireEditable(doc);
    const set: Record<string, unknown> = {};

    if (input.title !== undefined) {
      const t = String(input.title ?? '').trim();
      if (!t || t.length > 200) throw new BadRequestException('Tiêu đề không được rỗng và tối đa 200 ký tự.');
      set.title = t;
    }
    if (input.description !== undefined) {
      const d = String(input.description ?? '').trim();
      if (!d || d.length > MAX_FIELD) throw new BadRequestException('Mô tả đề bài không được rỗng.');
      set.description = d;
    }
    if (input.difficulty !== undefined) {
      const diff = normalizeDifficulty(input.difficulty);
      if (!diff) throw new BadRequestException('Độ khó phải là EASY, MEDIUM hoặc HARD.');
      set.difficulty = diff;
    }
    if (input.band !== undefined) {
      const band = normalizeBankBand(input.band);
      if (!band) throw new BadRequestException({ code: 'E400_INVALID_BAND', message: 'Khối phải là 6-9 hoặc 10-12.' });
      if (band !== bandOfExercise(doc)) {
        const use = (await this.usageOf([doc.slug])).get(doc.slug)!;
        if (use.classes + use.contests > 0) {
          throw new ConflictException({ code: 'E409_BANK_EXERCISE_IN_USE', message: 'Bài đang được dùng trong Lớp học hoặc Cuộc thi nên không đổi khối được.' });
        }
        Object.assign(set, bankLabels(band), { bankBand: band });
      }
    }
    if (input.testCases !== undefined) {
      const cases = this.validateCases(input.testCases);
      set.testCases = cases;
      set.hiddenTestCases = [];
    }
    if (Object.keys(set).length === 0) throw new BadRequestException('Không có trường hợp lệ nào để cập nhật.');
    await this.exercises.updateOne({ slug: doc.slug }, { $set: set }, { runValidators: true });
    return this.detail(user, doc.slug);
  }

  private validateCases(raw: unknown): Array<{ input: string; expectedOutput: string; isHidden: boolean }> {
    if (!Array.isArray(raw) || raw.length < 2 || raw.length > MAX_TEST_CASES) {
      throw new BadRequestException(`Cần từ 2 đến ${MAX_TEST_CASES} test case.`);
    }
    const out = raw.map((t, i) => {
      const o = (t ?? {}) as Record<string, unknown>;
      if (typeof o.input !== 'string' || typeof o.expectedOutput !== 'string') throw new BadRequestException(`Test case #${i + 1} thiếu input hoặc expectedOutput (chuỗi).`);
      if (o.input.length > MAX_FIELD || o.expectedOutput.length > MAX_FIELD) throw new BadRequestException(`Test case #${i + 1} quá dài.`);
      return { input: o.input, expectedOutput: o.expectedOutput, isHidden: o.isHidden === true };
    });
    if (!out.some((t) => !t.isHidden)) throw new BadRequestException('Cần ít nhất một test case hiện cho học viên xem.');
    return out;
  }

  async remove(user: JwtPayload, slug: string) {
    await this.assertEligible(user);
    const doc = await this.load(slug);
    this.requireEditable(doc);
    const use = (await this.usageOf([doc.slug])).get(doc.slug)!;
    if (use.classes + use.contests > 0) {
      throw new ConflictException({ code: 'E409_BANK_EXERCISE_IN_USE', message: BANK_IN_USE_MESSAGE, usage: use });
    }
    await this.exercises.deleteOne({ slug: doc.slug, bankOnly: true });
    return { deleted: true, slug: doc.slug };
  }

  /** Dành cho FE: giảng viên có được vào Ngân hàng đề không. */
  async access(user: JwtPayload) {
    await this.assertEligible(user);
    return { eligible: true };
  }

}

