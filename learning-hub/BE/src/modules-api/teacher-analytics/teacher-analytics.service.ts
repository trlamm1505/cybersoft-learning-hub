import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { AiLabSubmission } from '../../modules-system/database/schemas/ai-lab-submission.schema';
import {
  Classroom,
  ClassroomDocument,
} from '../../modules-system/database/schemas/classroom.schema';
import {
  DaLabSubmission,
  DaLabSubmissionDocument,
} from '../../modules-system/database/schemas/da-lab-submission.schema';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  HintUsage,
  HintUsageDocument,
} from '../../modules-system/database/schemas/hint-usage.schema';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import { MAX_ROSTER_ROWS, parseRosterFile, RosterFile } from './roster-import';
import {
  AnalyticsInput,
  AnalyticsSubmission,
  computeClassAnalytics,
  exerciseBreakdown,
  expandAggregate,
  GRADED_STATUSES,
  studentBreakdown,
} from './analytics-core';

export interface ClassInput {
  name?: unknown;
  teacherId?: unknown;
  description?: unknown;
  archived?: unknown;
  studentIds?: unknown;
  exerciseSlugs?: unknown;
}

type ClassLean = Classroom & { _id: Types.ObjectId };

const asId = (v: unknown) => String(v);

/** Tối đa danh tính (email/mã học viên) thêm trong một lần, và số dòng gợi ý trả về. */
export const MAX_ADD_IDENTIFIERS = 200;
const CATALOG_LIMIT = 20;
/** Bài DA Insight tính là đạt khi điểm tốt nhất từ ngưỡng này. */
const INSIGHT_PASS_RATIO = 0.6;
const STUDENT_CODE = /^C\d+$/i;

interface ExerciseLean {
  _id: unknown;
  slug: string;
  title: string;
  type?: string;
  difficulty?: string;
  tags?: string[];
  topic?: string;
}

interface DaLabLean {
  userId: string;
  exerciseSlug: string;
  type?: string;
  status?: string;
  attemptCount?: number;
  score?: number;
  bestScore?: number;
  maxScore?: number;
  updatedAt?: Date;
  createdAt?: Date;
}

interface AiLabLean {
  userId: string;
  exerciseSlug: string;
  status?: string;
  totalAttempts?: number;
  best?: { status?: string };
  updatedAt?: Date;
  createdAt?: Date;
}

/** SQL đạt khi chấm đủ điểm; Insight đạt khi đã chấm xong và điểm tốt nhất từ 60% điểm tối đa. */
export function daLabPassed(r: DaLabLean): boolean {
  const max = r.maxScore ?? 0;
  const best = Math.max(r.bestScore ?? 0, r.score ?? 0);
  if (max <= 0) return false;
  if (r.type === 'SQL') return best >= max;
  return best >= max * INSIGHT_PASS_RATIO && r.status === 'GRADED';
}

export const aiLabPassed = (r: AiLabLean): boolean =>
  r.status === 'PASSED' || r.best?.status === 'PASSED';

/**
 * Quản lý lớp và Teacher Dashboard. Phân quyền:
 * - ADMIN: tạo lớp, gán giảng viên phụ trách, sửa/lưu trữ/xóa lớp, thêm/gỡ/import học viên.
 *   Các hàm này tự kiểm tra vai trò (assertAdmin) nên route nào gọi vào cũng không vượt được.
 * - TEACHER: chỉ xem số liệu và giao bài cho lớp có teacherId là chính mình (resolveClass).
 * Mọi truy vấn dữ liệu đều bị giới hạn bởi danh sách học viên và bài tập CỦA LỚP, nên một lớp
 * không thể thấy dữ liệu lớp khác dù biết id.
 */
@Injectable()
export class TeacherAnalyticsService {
  constructor(
    @InjectModel(Classroom.name)
    private readonly classes: Model<ClassroomDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Exercise.name)
    private readonly exercises: Model<ExerciseDocument>,
    @InjectModel(Submission.name)
    private readonly submissions: Model<SubmissionDocument>,
    @InjectModel(HintUsage.name)
    private readonly hints: Model<HintUsageDocument>,
    @InjectModel(DaLabSubmission.name)
    private readonly daLabs: Model<DaLabSubmissionDocument>,
    @InjectModel(AiLabSubmission.name)
    private readonly aiLabs: Model<AiLabSubmission>,
  ) {}

  // ---------- Quản trị lớp (chỉ ADMIN) ----------

  private assertAdmin(user: JwtPayload) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Chỉ quản trị viên được thực hiện thao tác này.',
      );
    }
  }

  /** Mọi lớp kèm giảng viên phụ trách, cho trang quản trị. */
  async listAllClasses(user: JwtPayload, includeArchived = true) {
    this.assertAdmin(user);
    const filter = includeArchived ? {} : { archived: { $ne: true } };
    const docs = await this.classes
      .find(filter)
      .sort({ name: 1 })
      .lean<ClassLean[]>();
    const teacherIds = [
      ...new Set(docs.map((c) => c.teacherId).filter(Boolean)),
    ];
    const teachers = teacherIds.length
      ? await this.users
          .find({ _id: { $in: teacherIds } })
          .select('fullName email')
          .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>()
      : [];
    const byId = new Map(teachers.map((t) => [asId(t._id), t]));
    return docs.map((c) => {
      const t = byId.get(c.teacherId);
      return {
        ...this.describe(c),
        teacher: t
          ? {
              id: asId(t._id),
              name: t.fullName || t.email || asId(t._id),
              email: t.email ?? '',
            }
          : null,
      };
    });
  }

  /** Giảng viên có thể được gán phụ trách lớp. */
  async catalogTeachers(user: JwtPayload, q?: string) {
    this.assertAdmin(user);
    const term = (q ?? '').trim().slice(0, 60);
    const rx = { $regex: this.escape(term), $options: 'i' };
    const docs = await this.users
      .find({
        role: 'TEACHER',
        ...(term ? { $or: [{ fullName: rx }, { email: rx }] } : {}),
      })
      .select('fullName email')
      .limit(100)
      .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>();
    return docs.map((u) => ({
      id: asId(u._id),
      name: u.fullName || u.email || asId(u._id),
      email: u.email ?? '',
    }));
  }

  // ---------- Lớp của giảng viên ----------

  async listClasses(user: JwtPayload, includeArchived = false) {
    const filter: Record<string, unknown> =
      user.role === 'ADMIN' ? {} : { teacherId: user.sub };
    if (!includeArchived) filter.archived = { $ne: true };
    const docs = await this.classes
      .find(filter)
      .sort({ name: 1 })
      .lean<ClassLean[]>();
    return docs.map((c) => this.describe(c));
  }

  // ---------- Lớp của học viên ----------

  /**
   * Lớp (chưa lưu trữ) mà học viên đang tham gia, kèm bài giảng viên đã giao và trạng thái từng bài.
   * Trạng thái lấy từ cùng nguồn dữ liệu và cùng công thức với Teacher Dashboard (loadInput +
   * studentBreakdown) nên một lượt nộp bài hiện ra ở cả hai nơi ngay lập tức, không có bản sao nào để lệch.
   * Chỉ trả dữ liệu của chính người gọi: không nhận id học viên từ client.
   */
  async listMyClasses(user: JwtPayload) {
    if (user.role !== 'STUDENT') {
      throw new ForbiddenException('Chỉ học viên có danh sách lớp của mình.');
    }
    const docs = await this.classes
      .find({ studentIds: user.sub, archived: { $ne: true } })
      .sort({ name: 1 })
      .lean<ClassLean[]>();
    if (docs.length === 0) return [];

    const teacherIds = [
      ...new Set(docs.map((c) => c.teacherId).filter(Boolean)),
    ];
    const allSlugs = [...new Set(docs.flatMap((c) => c.exerciseSlugs ?? []))];
    const [teachers, typed] = await Promise.all([
      teacherIds.length
        ? this.users
            .find({ _id: { $in: teacherIds } })
            .select('fullName email')
            .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>()
        : [],
      allSlugs.length
        ? this.exercises
            .find({ slug: { $in: allSlugs } })
            .select('slug type')
            .lean<Array<{ slug: string; type?: string }>>()
        : [],
    ]);
    const teacherById = new Map(teachers.map((t) => [asId(t._id), t]));
    const typeBySlug = new Map(typed.map((e) => [e.slug, e.type ?? null]));

    const out = [];
    for (const c of docs) {
      // Ép phạm vi về một mình học viên này: thống kê và bài nộp chỉ của họ.
      const input = await this.loadInput({ ...c, studentIds: [user.sub] });
      const rows = studentBreakdown(input, user.sub);
      const byRow = new Map(rows.map((r) => [r.slug, r]));
      const exercises = input.exercises.map((e) => {
        const r = byRow.get(e.slug)!;
        return {
          slug: e.slug,
          title: e.title,
          type: typeBySlug.get(e.slug) ?? null,
          difficulty: e.difficulty ?? null,
          tags: e.tags,
          status: r.status,
          attempts: r.attempts,
          lastAt: r.lastAt,
        };
      });
      const t = teacherById.get(c.teacherId);
      out.push({
        id: asId(c._id),
        name: c.name,
        description: c.description ?? '',
        teacher: t ? { name: t.fullName || t.email || '' } : null,
        progress: {
          total: exercises.length,
          passed: exercises.filter((e) => e.status === 'PASSED').length,
          attempted: exercises.filter((e) => e.status !== 'NOT_STARTED')
            .length,
        },
        exercises,
      });
    }
    return out;
  }

  async createClass(user: JwtPayload, body: ClassInput) {
    this.assertAdmin(user);
    const data = await this.validateClassInput(body, true);
    const doc = await this.classes.create(data);
    return this.describe(doc.toObject() as ClassLean);
  }

  async updateClass(user: JwtPayload, classId: string, body: ClassInput) {
    this.assertAdmin(user);
    const cls = await this.resolveClass(user, classId);
    const data = await this.validateClassInput(body, false);
    const updated = await this.classes
      .findByIdAndUpdate(cls._id, { $set: data }, { new: true })
      .lean<ClassLean>();
    return this.describe(updated ?? { ...cls, ...data });
  }

  async deleteClass(user: JwtPayload, classId: string) {
    this.assertAdmin(user);
    const cls = await this.resolveClass(user, classId);
    await this.classes.deleteOne({ _id: cls._id });
    return { id: asId(cls._id), deleted: true };
  }

  /** Chi tiết để quản lý: danh sách học viên và bài đã giao (kèm thông tin hiển thị). */
  async getClassDetail(user: JwtPayload, classId: string) {
    const cls = await this.resolveClass(user, classId);
    const studentIds = cls.studentIds ?? [];
    const slugs = cls.exerciseSlugs ?? [];
    const [studentDocs, exerciseDocs] = await Promise.all([
      studentIds.length
        ? this.users
            .find({ _id: { $in: studentIds }, role: 'STUDENT' })
            .select('fullName email studentCode')
            .lean<
              Array<{
                _id: unknown;
                fullName?: string;
                email?: string;
                studentCode?: string;
              }>
            >()
        : [],
      slugs.length
        ? this.exercises
            .find({ slug: { $in: slugs } })
            .select('slug title type difficulty tags')
            .lean<ExerciseLean[]>()
        : [],
    ]);
    const byId = new Map(studentDocs.map((u) => [asId(u._id), u]));
    const bySlug = new Map(exerciseDocs.map((e) => [e.slug, e]));
    const teacher = cls.teacherId
      ? await this.users
          .find({ _id: { $in: [cls.teacherId] } })
          .select('fullName email')
          .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>()
      : [];
    return {
      ...this.describe(cls),
      teacher: teacher[0]
        ? {
            id: asId(teacher[0]._id),
            name:
              teacher[0].fullName || teacher[0].email || asId(teacher[0]._id),
            email: teacher[0].email ?? '',
          }
        : null,
      students: studentIds
        .filter((id) => byId.has(id))
        .map((id) => {
          const u = byId.get(id)!;
          return {
            id,
            name: u.fullName || u.email || id,
            email: u.email ?? '',
            studentCode: u.studentCode ?? null,
          };
        }),
      exercises: slugs
        .filter((slug) => bySlug.has(slug))
        .map((slug) => {
          const e = bySlug.get(slug)!;
          return {
            slug,
            title: e.title,
            type: e.type ?? null,
            difficulty: e.difficulty ?? null,
            tags: e.tags ?? [],
          };
        }),
    };
  }

  /**
   * Thêm học viên theo email hoặc mã học viên (Cxxxx). Người không tồn tại hoặc không phải
   * học viên được trả về ở `notFound` thay vì làm hỏng cả lượt; người đã trong lớp ở `already`.
   */
  async addStudents(user: JwtPayload, classId: string, identifiers: unknown) {
    this.assertAdmin(user);
    const cls = await this.resolveClass(user, classId);
    return this.addStudentsToClass(cls, identifiers, MAX_ADD_IDENTIFIERS);
  }

  /**
   * Import hàng loạt từ file Excel/CSV: chỉ email đã tồn tại với vai trò học viên mới được thêm;
   * báo cáo tách rõ đã thêm, đã có trong lớp, không tồn tại (hoặc không phải học viên), sai cú pháp.
   */
  async importStudents(
    user: JwtPayload,
    classId: string,
    file: RosterFile | undefined,
  ) {
    this.assertAdmin(user);
    const cls = await this.resolveClass(user, classId);
    const parsed = parseRosterFile(file);
    const result =
      parsed.emails.length > 0
        ? await this.addStudentsToClass(cls, parsed.emails, MAX_ROSTER_ROWS)
        : { added: [], already: [], notFound: [] };
    return {
      ...result,
      invalid: parsed.invalid,
      duplicatesInFile: parsed.duplicatesInFile,
      totalRows: parsed.rowCount,
    };
  }

  private async addStudentsToClass(
    cls: ClassLean,
    identifiers: unknown,
    max: number,
  ) {
    const list = this.stringList(identifiers, 'identifiers')
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      throw new BadRequestException('Nhập ít nhất một email hoặc mã học viên.');
    }
    if (list.length > max) {
      throw new BadRequestException(`Mỗi lần thêm tối đa ${max} học viên.`);
    }
    const emails = list
      .filter((s) => !STUDENT_CODE.test(s))
      .map((s) => s.toLowerCase());
    const codes = list
      .filter((s) => STUDENT_CODE.test(s))
      .map((s) => s.toUpperCase());

    const found = await this.users
      .find({
        role: 'STUDENT',
        $or: [{ email: { $in: emails } }, { studentCode: { $in: codes } }],
      })
      .select('fullName email studentCode')
      .lean<
        Array<{
          _id: unknown;
          fullName?: string;
          email?: string;
          studentCode?: string;
        }>
      >();

    const members = new Set(cls.studentIds ?? []);
    const added: Array<{ id: string; name: string }> = [];
    const already: string[] = [];
    const matched = new Set<string>();
    for (const u of found) {
      const id = asId(u._id);
      if (u.email) matched.add(u.email.toLowerCase());
      if (u.studentCode) matched.add(u.studentCode.toUpperCase());
      if (members.has(id)) {
        already.push(u.email ?? id);
        continue;
      }
      members.add(id);
      added.push({ id, name: u.fullName || u.email || id });
    }
    const notFound = list.filter(
      (s) =>
        !matched.has(STUDENT_CODE.test(s) ? s.toUpperCase() : s.toLowerCase()),
    );
    if (added.length) {
      await this.classes.updateOne(
        { _id: cls._id },
        { $addToSet: { studentIds: { $each: added.map((a) => a.id) } } },
      );
    }
    return { added, already, notFound: [...new Set(notFound)] };
  }

  async removeStudent(user: JwtPayload, classId: string, studentId: string) {
    this.assertAdmin(user);
    const cls = await this.resolveClass(user, classId);
    if (!(cls.studentIds ?? []).includes(studentId)) {
      throw new NotFoundException('Học viên không thuộc lớp này.');
    }
    await this.classes.updateOne(
      { _id: cls._id },
      { $pull: { studentIds: studentId } },
    );
    return { id: studentId, removed: true };
  }

  /** Thay toàn bộ danh mục bài được giao (danh sách tích chọn gửi lên là bản đầy đủ). */
  async setExercises(user: JwtPayload, classId: string, slugs: unknown) {
    const cls = await this.resolveClass(user, classId);
    const data = await this.validateClassInput({ exerciseSlugs: slugs }, false);
    await this.classes.updateOne(
      { _id: cls._id },
      { $set: { exerciseSlugs: data.exerciseSlugs ?? [] } },
    );
    return { exerciseSlugs: data.exerciseSlugs ?? [] };
  }

  /** Danh mục bài có thể giao cho lớp. */
  async catalogExercises(q?: string) {
    const term = (q ?? '').trim().slice(0, 60);
    const rx = { $regex: this.escape(term), $options: 'i' };
    const filter = term
      ? { $or: [{ title: rx }, { slug: rx }, { tags: rx }] }
      : {};
    const docs = await this.exercises
      .find(filter)
      .select('slug title type difficulty tags')
      .sort({ title: 1 })
      .limit(100)
      .lean<ExerciseLean[]>();
    return docs.map((e) => ({
      slug: e.slug,
      title: e.title,
      type: e.type ?? null,
      difficulty: e.difficulty ?? null,
      tags: e.tags ?? [],
    }));
  }

  /** Gợi ý học viên để thêm nhanh (tìm theo tên, email hoặc mã). */
  async catalogStudents(user: JwtPayload, q?: string) {
    this.assertAdmin(user);
    const term = (q ?? '').trim().slice(0, 60);
    if (!term) return [];
    const rx = { $regex: this.escape(term), $options: 'i' };
    const docs = await this.users
      .find({
        role: 'STUDENT',
        $or: [{ fullName: rx }, { email: rx }, { studentCode: rx }],
      })
      .select('fullName email studentCode')
      .limit(CATALOG_LIMIT)
      .lean<
        Array<{
          _id: unknown;
          fullName?: string;
          email?: string;
          studentCode?: string;
        }>
      >();
    return docs.map((u) => ({
      id: asId(u._id),
      name: u.fullName || u.email || asId(u._id),
      email: u.email ?? '',
      studentCode: u.studentCode ?? null,
    }));
  }

  // ---------- Thống kê ----------

  async getOverview(user: JwtPayload, classId: string) {
    const cls = await this.resolveClass(user, classId);
    const input = await this.loadInput(cls);
    return { class: this.describe(cls), ...computeClassAnalytics(input) };
  }

  async getStudent(user: JwtPayload, classId: string, studentId: string) {
    const cls = await this.resolveClass(user, classId);
    if (!(cls.studentIds ?? []).includes(studentId)) {
      throw new NotFoundException('Học viên không thuộc lớp này.');
    }
    const input = await this.loadInput(cls);
    const row = computeClassAnalytics(input).students.find(
      (s) => s.id === studentId,
    );
    if (!row) throw new NotFoundException('Học viên không thuộc lớp này.');
    return {
      class: this.describe(cls),
      student: row,
      exercises: studentBreakdown(input, studentId),
    };
  }

  async getExercise(user: JwtPayload, classId: string, slug: string) {
    const cls = await this.resolveClass(user, classId);
    if (!(cls.exerciseSlugs ?? []).includes(slug)) {
      throw new NotFoundException('Bài tập không được giao cho lớp này.');
    }
    const input = await this.loadInput(cls);
    const row = computeClassAnalytics(input).exercises.find(
      (e) => e.slug === slug,
    );
    if (!row)
      throw new NotFoundException('Bài tập không được giao cho lớp này.');
    return {
      class: this.describe(cls),
      exercise: row,
      students: exerciseBreakdown(input, slug),
    };
  }

  // ---------- Nội bộ ----------

  private describe(c: ClassLean) {
    return {
      id: asId(c._id),
      name: c.name,
      teacherId: c.teacherId,
      description: c.description ?? '',
      archived: c.archived === true,
      studentCount: (c.studentIds ?? []).length,
      exerciseCount: (c.exerciseSlugs ?? []).length,
    };
  }

  private escape(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Mở lớp theo quyền: không tồn tại → 404; lớp của giảng viên khác → 403. */
  private async resolveClass(user: JwtPayload, classId: string) {
    if (!isValidObjectId(classId)) {
      throw new NotFoundException('Không tìm thấy lớp.');
    }
    const cls = await this.classes.findById(classId).lean<ClassLean>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    if (user.role !== 'ADMIN' && cls.teacherId !== user.sub) {
      throw new ForbiddenException('Bạn không có quyền với lớp này.');
    }
    return cls;
  }

  private toExercise(e: ExerciseLean) {
    return {
      slug: e.slug,
      title: e.title,
      difficulty: e.difficulty,
      tags: e.tags ?? [],
      topic: e.topic,
    };
  }

  /** Chỉ đọc dữ liệu của học viên và bài tập thuộc lớp; không có truy vấn nào không giới hạn. */
  private async loadInput(cls: ClassLean): Promise<AnalyticsInput> {
    const classStudentIds = cls.studentIds ?? [];
    const classSlugs = cls.exerciseSlugs ?? [];
    const [userDocs, exerciseDocs] = await Promise.all([
      classStudentIds.length
        ? this.users
            .find({ _id: { $in: classStudentIds }, role: 'STUDENT' })
            .select('fullName email')
            .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>()
        : [],
      classSlugs.length
        ? this.exercises
            .find({ slug: { $in: classSlugs } })
            .select('slug title difficulty tags topic')
            .lean<ExerciseLean[]>()
        : [],
    ]);

    const userById = new Map(userDocs.map((u) => [asId(u._id), u]));
    // Giữ thứ tự do giảng viên sắp xếp; bỏ id không còn là học viên.
    const students = classStudentIds
      .filter((id) => userById.has(id))
      .map((id) => {
        const u = userById.get(id)!;
        return { id, name: u.fullName || u.email || id };
      });
    const exBySlug = new Map(exerciseDocs.map((e) => [e.slug, e]));
    const ordered = classSlugs
      .filter((slug) => exBySlug.has(slug))
      .map((slug) => exBySlug.get(slug)!);
    const exercises = ordered.map((e) => this.toExercise(e));

    const studentIds = students.map((s) => s.id);
    const slugs = ordered.map((e) => e.slug);
    const exerciseIdToSlug = new Map(ordered.map((e) => [asId(e._id), e.slug]));
    if (!studentIds.length || !slugs.length) {
      return { students, exercises, submissions: [], hints: [] };
    }

    const [subs, hintDocs, daDocs, aiDocs] = await Promise.all([
      this.submissions
        .find({
          userId: { $in: studentIds },
          exerciseId: { $in: [...exerciseIdToSlug.keys()] },
          status: { $in: [...GRADED_STATUSES] },
        })
        .select('userId exerciseId status createdAt')
        .lean<
          Array<{
            userId: string;
            exerciseId: string;
            status: string;
            createdAt: Date;
          }>
        >(),
      this.hints
        .find({ userId: { $in: studentIds }, exerciseSlug: { $in: slugs } })
        .select('userId exerciseSlug')
        .lean<Array<{ userId: string; exerciseSlug: string }>>(),
      this.daLabs
        .find({ userId: { $in: studentIds }, exerciseSlug: { $in: slugs } })
        .select(
          'userId exerciseSlug type status attemptCount score bestScore maxScore createdAt updatedAt',
        )
        .lean<DaLabLean[]>(),
      this.aiLabs
        .find({ userId: { $in: studentIds }, exerciseSlug: { $in: slugs } })
        .select(
          'userId exerciseSlug status totalAttempts best createdAt updatedAt',
        )
        .lean<AiLabLean[]>(),
    ]);

    const submissions: AnalyticsSubmission[] = subs.map((s) => ({
      userId: s.userId,
      exerciseSlug: exerciseIdToSlug.get(s.exerciseId)!,
      status: s.status,
      at: s.createdAt,
    }));
    for (const r of daDocs) {
      submissions.push(
        ...expandAggregate({
          userId: r.userId,
          exerciseSlug: r.exerciseSlug,
          attempts: r.attemptCount ?? 1,
          passed: daLabPassed(r),
          at: r.updatedAt ?? r.createdAt ?? new Date(0),
        }),
      );
    }
    for (const r of aiDocs) {
      submissions.push(
        ...expandAggregate({
          userId: r.userId,
          exerciseSlug: r.exerciseSlug,
          attempts: r.totalAttempts ?? 1,
          passed: aiLabPassed(r),
          at: r.updatedAt ?? r.createdAt ?? new Date(0),
        }),
      );
    }

    return {
      students,
      exercises,
      submissions,
      hints: hintDocs.map((h) => ({
        userId: h.userId,
        exerciseSlug: h.exerciseSlug,
      })),
    };
  }

  private async validateClassInput(body: ClassInput, creating: boolean) {
    const out: Partial<
      Pick<
        Classroom,
        | 'name'
        | 'teacherId'
        | 'description'
        | 'archived'
        | 'studentIds'
        | 'exerciseSlugs'
      >
    > = {};
    if (body.name !== undefined || creating) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name || name.length > 100) {
        throw new BadRequestException('Tên lớp bắt buộc, tối đa 100 ký tự.');
      }
      out.name = name;
    }
    if (body.teacherId !== undefined || creating) {
      const id = typeof body.teacherId === 'string' ? body.teacherId : '';
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Chọn giảng viên phụ trách lớp.');
      }
      const teacher = await this.users
        .find({ _id: { $in: [id] }, role: 'TEACHER' })
        .select('_id')
        .lean<Array<{ _id: unknown }>>();
      if (teacher.length !== 1) {
        throw new BadRequestException('Giảng viên phụ trách không tồn tại.');
      }
      out.teacherId = id;
    }
    if (body.description !== undefined) {
      if (
        typeof body.description !== 'string' ||
        body.description.length > 300
      ) {
        throw new BadRequestException('Mô tả tối đa 300 ký tự.');
      }
      out.description = body.description.trim();
    }
    if (body.archived !== undefined) {
      if (typeof body.archived !== 'boolean') {
        throw new BadRequestException('archived phải là true hoặc false.');
      }
      out.archived = body.archived;
    }
    if (body.studentIds !== undefined) {
      const ids = this.stringList(body.studentIds, 'studentIds');
      if (!ids.every((id) => isValidObjectId(id))) {
        throw new BadRequestException('studentIds chứa id không hợp lệ.');
      }
      const found = ids.length
        ? await this.users
            .find({ _id: { $in: ids }, role: 'STUDENT' })
            .select('_id')
            .lean<Array<{ _id: unknown }>>()
        : [];
      if (found.length !== ids.length) {
        throw new BadRequestException(
          'studentIds có người không phải học viên.',
        );
      }
      out.studentIds = ids;
    }
    if (body.exerciseSlugs !== undefined) {
      const slugs = this.stringList(body.exerciseSlugs, 'exerciseSlugs');
      const found = slugs.length
        ? await this.exercises
            .find({ slug: { $in: slugs } })
            .select('slug')
            .lean<Array<{ slug: string }>>()
        : [];
      if (found.length !== slugs.length) {
        throw new BadRequestException(
          'exerciseSlugs có bài tập không tồn tại.',
        );
      }
      out.exerciseSlugs = slugs;
    }
    return out;
  }

  private stringList(value: unknown, field: string): string[] {
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      throw new BadRequestException(`${field} phải là mảng chuỗi.`);
    }
    return [...new Set(value as string[])];
  }
}
