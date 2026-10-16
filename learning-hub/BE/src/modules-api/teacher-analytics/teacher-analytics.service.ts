import { generateClassCode } from './class-code';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AuditLogService } from '../admin-portal/audit-log.service';
import { isCareerCourseClass, isTesterClass } from '../assessment/domain/tester-progress';
import { ClassAssignment, ClassAssignmentDocument } from '../../modules-system/database/schemas/class-assignment.schema';
import { finalizedError, requireReason } from '../tester-labs/tester-labs.service';
import { TesterLabSubmission, TesterLabSubmissionDocument } from '../../modules-system/database/schemas/tester-lab-submission.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { TesterLab, TesterLabDocument } from '../../modules-system/database/schemas/tester-lab.schema';
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
  teacherIds?: string[];
  description?: unknown;
  archived?: unknown;
  ageGroup?: unknown;
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
    // Chỉ để đếm bài lab của khóa Người đi làm; thiếu (test cũ) thì số bài của khóa tính bằng 0.
    @Optional() @InjectModel(TesterLab.name)
    private readonly testerLabs?: Model<TesterLabDocument>,
    @Optional() @InjectModel(TesterLabSubmission.name)
    private readonly testerSubmissions?: Model<TesterLabSubmissionDocument>,
    @Optional() private readonly audit?: AuditLogService,
    @Optional() @InjectModel(ClassAssignment.name)
    private readonly classAssignments?: Model<ClassAssignmentDocument>,
  ) {}

  // ---------- Quản trị lớp (chỉ ADMIN) ----------

  private assertAdmin(user: JwtPayload) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Chỉ quản trị viên được thực hiện thao tác này.',
      );
    }
  }

  /**
   * Khóa Người đi làm (lớp có courseKey) không lưu studentIds: học viên là mọi tài khoản CAREER_ADULT đang hoạt động và bài tập là
   * các bài lab của khóa. Gắn danh sách này vào lớp để giảng viên và Admin thấy CÙNG sĩ số/số bài với Admin Portal.
   */
  private async withCareerRoster<T extends ClassLean>(docs: T[]): Promise<T[]> {
    if (!docs.some((c) => c.courseKey)) return docs;
    const [roster, tester, data, ai] = await Promise.all([
      this.users.find({ role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: { $ne: 'LOCKED' } }).select('_id').lean<Array<{ _id: unknown }>>(),
      this.testerLabs ? this.testerLabs.countDocuments({}) : Promise.resolve(0),
      this.exercises.countDocuments({ topic: 'da-lab-pack', resource_id: { $exists: true } }),
      this.exercises.countDocuments({ topic: 'ai-lab-pack', type: 'AI_LAB' }),
    ]);
    const labs: Record<string, number> = { 'tester-qa': tester, 'data-sql': data, 'ai-prompt': ai };
    const ids = roster.map((r) => asId(r._id));
    return docs.map((c) => (c.courseKey ? { ...c, studentIds: ids, labCount: labs[c.courseKey] ?? 0 } : c));
  }

  /** Mọi lớp kèm giảng viên phụ trách, cho trang quản trị. */
  async listAllClasses(user: JwtPayload, includeArchived = true) {
    this.assertAdmin(user);
    const filter = includeArchived ? {} : { archived: { $ne: true } };
    const docs = await this.withCareerRoster(
      await this.classes
        .find(filter)
        .sort({ name: 1 })
        .lean<ClassLean[]>(),
    );
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
      user.role === 'ADMIN' ? {} : { $or: [{ teacherId: user.sub }, { teacherIds: user.sub }] };
    if (!includeArchived) filter.archived = { $ne: true };
    const docs = await this.classes
      .find(filter)
      .sort({ name: 1 })
      .lean<ClassLean[]>();
    const rows = await this.withCareerRoster(docs);
    const coIds = [...new Set(rows.flatMap((c) => this.teacherIdsOf(c)))].filter(isValidObjectId);
    const studentIds = [...new Set(rows.flatMap((c) => c.studentIds ?? []))];
    const [people, pending] = await Promise.all([
      coIds.length
        ? this.users.find({ _id: { $in: coIds } }).select('fullName email').lean<Array<{ _id: unknown; fullName?: string; email?: string }>>()
        : [],
      studentIds.length
        ? this.daLabs.find({ status: 'PENDING_REVIEW', userId: { $in: studentIds } }).select('userId').lean<Array<{ userId: string }>>()
        : [],
    ]);
    const pendingTester = rows.some((c) => isTesterClass(c)) && this.testerSubmissions ? await this.testerSubmissions.countDocuments({ status: 'SUBMITTED', invalidated: { $ne: true } }) : 0;
    const names = new Map(people.map((u) => [asId(u._id), u.fullName || u.email || asId(u._id)]));
    const pendingByUser = new Map<string, number>();
    for (const p of pending) pendingByUser.set(p.userId, (pendingByUser.get(p.userId) ?? 0) + 1);
    return rows.map((c) => ({
      ...this.describe(c),
      code: c.code ?? '',
      ageGroup: c.courseKey ? 'CAREER_ADULT' : (c.ageGroup ?? null),
      status: c.archived === true ? ('ARCHIVED' as const) : ('ACTIVE' as const),
      courseKey: c.courseKey ?? null,
      // Lớp Tester QA: bài chờ chấm là bài Tester Lab chờ chấm của học viên khóa; lớp khác: bài DA Lab chờ chấm của học viên trong lớp.
      pendingSubmissions: isTesterClass(c) ? pendingTester : (c.studentIds ?? []).reduce((n, id) => n + (pendingByUser.get(id) ?? 0), 0),
      isPrimaryTeacher: c.teacherId === user.sub,
      coTeachers: this.teacherIdsOf(c)
        .filter((id) => id !== user.sub)
        .map((id) => names.get(id) ?? id),
    }));
  }

  /** Mọi giảng viên phụ trách lớp, giảng viên chính đứng đầu, không trùng. */
  private teacherIdsOf(c: ClassLean): string[] {
    return [...new Set([c.teacherId, ...(c.teacherIds ?? [])].filter(Boolean))];
  }

  // ---------- Hủy kết quả bài nộp ----------

  /**
   * Hủy kết quả một bài nộp Tester Lab của học viên trong lớp mình phụ trách. Bắt buộc có lý do (>= 10 ký tự); bài đã chốt điểm
   * không hủy được (phải qua phúc khảo). Mọi lần hủy đều ghi audit log kèm lý do.
   */
  async invalidateSubmission(user: JwtPayload, classId: string, body: { submissionId?: unknown; reason?: unknown }) {
    const cls = await this.resolveClass(user, classId);
    const reason = requireReason(body?.reason);
    const submissionId = typeof body?.submissionId === 'string' ? body.submissionId : '';
    if (!this.testerSubmissions || !isValidObjectId(submissionId)) {
      throw new NotFoundException('Không tìm thấy bài nộp.');
    }
    const submission = await this.testerSubmissions.findById(submissionId);
    if (!submission) throw new NotFoundException('Không tìm thấy bài nộp.');
    const inClass = cls.courseKey
      ? !!(await this.users.exists({ _id: submission.userId, role: 'STUDENT', ageGroup: 'CAREER_ADULT' }))
      : (cls.studentIds ?? []).includes(submission.userId);
    if (!inClass) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bài nộp này không thuộc lớp của bạn.' });
    }
    if (submission.isFinalized) throw finalizedError();
    const before = { status: submission.status, invalidated: submission.invalidated === true };
    submission.invalidated = true;
    submission.invalidReason = reason;
    submission.rubricGrades = [];
    submission.status = 'SUBMITTED';
    await submission.save();
    await this.audit?.record({ sub: user.sub, email: user.email ?? '' }, 'SUBMISSION_INVALIDATE', 'SUBMISSION', submissionId, before, { status: 'SUBMITTED', invalidated: true, classId }, reason);
    return { id: submissionId, invalidated: true };
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
    // Mã lớp hiển thị cho học viên; trùng (rất hiếm) thì thử mã khác nhờ unique index.
    let doc;
    for (let attempt = 0; ; attempt++) {
      try {
        doc = await this.classes.create({ ...data, code: generateClassCode() });
        break;
      } catch (e) {
        if ((e as { code?: number })?.code !== 11000 || attempt >= 4) throw e;
      }
    }
    return this.describe(doc.toObject() as ClassLean);
  }

  async updateClass(user: JwtPayload, classId: string, body: ClassInput) {
    this.assertAdmin(user);
    const cls = await this.resolveClass(user, classId);
    if (cls.courseKey && ((body.name !== undefined && body.name !== cls.name) || body.ageGroup !== undefined)) {
      throw new BadRequestException('Không được đổi tên hoặc khối của khóa chuyên ngành Người đi làm (chỉ phân công giảng viên hoặc lưu trữ).');
    }
    const data = await this.validateClassInput(body, false);
    // Lưu thông tin lớp gửi kèm teacherId không đổi thì giữ nguyên danh sách nhiều giảng viên Admin đã phân công.
    if (data.teacherId === cls.teacherId) delete data.teacherIds;
    const updated = await this.classes
      .findByIdAndUpdate(cls._id, { $set: data }, { new: true })
      .lean<ClassLean>();
    return this.describe(updated ?? { ...cls, ...data });
  }

  async deleteClass(user: JwtPayload, classId: string) {
    this.assertAdmin(user);
    const cls = await this.resolveClass(user, classId);
    if (cls.courseKey) {
      throw new BadRequestException('Không được xóa khóa chuyên ngành của Người đi làm.');
    }
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
    const assignmentDocs = this.classAssignments
      ? await this.classAssignments.find({ classId: asId(cls._id) }).sort({ order: 1, startAt: 1 }).select('title type startAt dueAt maxPoints').lean<Array<{ _id: unknown; title: string; type: string; startAt: Date; dueAt: Date; maxPoints?: number }>>()
      : [];
    return {
      ...this.describe(cls),
      assignments: assignmentDocs.map((a) => ({ id: asId(a._id), title: a.title, type: a.type, startAt: a.startAt, dueAt: a.dueAt, maxPoints: a.maxPoints ?? null })),
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
    this.assertRosterEditable(cls);
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
      .select('fullName email studentCode ageGroup')
      .lean<
        Array<{
          _id: unknown;
          fullName?: string;
          email?: string;
          studentCode?: string;
          ageGroup?: string;
        }>
      >();

    await this.assertAgeGroupFits(cls, found, new Set((cls.studentIds ?? []).map(String)));
    // Một học viên chỉ xuất hiện MỘT lần trong lớp: bỏ trùng trong kết quả tra cứu và đối chiếu với danh sách hiện có.
    const members = new Set((cls.studentIds ?? []).map(String));
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
    this.assertRosterEditable(cls);
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
    // Lớp khóa Career (Tester QA, Data SQL, AI Prompt) theo khung Lab cố định: không có bài giao riêng.
    if (isCareerCourseClass(cls)) {
      throw new BadRequestException({ code: 'E400_TESTER_CLASS_NO_ASSIGNMENT', message: 'Lớp khóa Career học theo các Lab cố định, không giao bài tập riêng.' });
    }
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
      exerciseCount: (c as ClassLean & { labCount?: number }).labCount ?? (c.exerciseSlugs ?? []).length,
    };
  }

  /** Khối của lớp phổ thông: khối đã đặt, nếu chưa có thì nhóm đông nhất trong học viên hiện có (không có ai thì chưa ràng buộc). */
  private async classBand(cls: ClassLean): Promise<string | null> {
    if (cls.ageGroup) return cls.ageGroup;
    const ids = (cls.studentIds ?? []).filter(isValidObjectId);
    if (ids.length === 0) return null;
    const members = await this.users.find({ _id: { $in: ids } }).select('ageGroup').lean<Array<{ ageGroup?: string }>>();
    const counts = new Map<string, number>();
    for (const m of members) if (m.ageGroup && m.ageGroup !== 'CAREER_ADULT') counts.set(m.ageGroup, (counts.get(m.ageGroup) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }

  /**
   * Chặn học viên lệch khối tuổi (vd đưa học sinh 10-12 vào lớp 6-9, hoặc tài khoản Người đi làm vào lớp phổ thông) bằng 400.
   * Học viên chưa có khối (tài khoản cũ) và người đã ở trong lớp không bị chặn.
   */
  private async assertAgeGroupFits(
    cls: ClassLean,
    candidates: Array<{ _id: unknown; email?: string; ageGroup?: string }>,
    members: Set<string>,
  ) {
    const band = await this.classBand(cls);
    const bad = candidates.filter((u) => {
      if (members.has(asId(u._id)) || !u.ageGroup) return false;
      return u.ageGroup === 'CAREER_ADULT' || (!!band && u.ageGroup !== band);
    });
    if (bad.length > 0) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Học viên không thuộc độ tuổi phù hợp với lớp học này',
        mismatched: bad.map((u) => u.email ?? asId(u._id)),
      });
    }
  }

  /** Nhãn để ghi nhật ký (tên lớp, giảng viên, học viên) mà không để lộ id ra giao diện. */
  async auditContext(classId: string, userIds: string[] = []) {
    const cls = isValidObjectId(classId)
      ? await this.classes.findById(classId).select('name description archived teacherId teacherIds').lean<{ name: string; description?: string; archived?: boolean; teacherId?: string; teacherIds?: string[] }>()
      : null;
    const ids = [...new Set([...(cls?.teacherIds?.length ? cls.teacherIds : cls?.teacherId ? [cls.teacherId] : []), ...userIds])].filter(isValidObjectId);
    const people = ids.length ? await this.users.find({ _id: { $in: ids } }).select('fullName email').lean<Array<{ _id: unknown; fullName?: string; email?: string }>>() : [];
    const nameOf = (id: string) => people.find((p) => asId(p._id) === id)?.fullName || people.find((p) => asId(p._id) === id)?.email || '';
    const tIds = cls?.teacherIds?.length ? cls.teacherIds : cls?.teacherId ? [cls.teacherId] : [];
    return {
      className: cls?.name ?? '',
      description: cls?.description ?? '',
      archived: cls?.archived === true,
      teacherNames: tIds.map(nameOf),
      nameOf,
    };
  }

  /** Khóa Người đi làm tự ghi danh theo tài khoản CAREER_ADULT nên không thêm/gỡ học viên thủ công. */
  private assertRosterEditable(cls: ClassLean) {
    if (cls.courseKey) {
      throw new BadRequestException('Khóa Người đi làm tự ghi danh mọi tài khoản Người đi làm, không thêm hoặc gỡ học viên thủ công.');
    }
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
    if (user.role !== 'ADMIN' && cls.teacherId !== user.sub && !cls.teacherIds?.includes(user.sub)) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bạn không có quyền với lớp này.' });
    }
    return (await this.withCareerRoster([cls]))[0];
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
        .select('userId exerciseId status createdAt passedCount totalCount')
        .lean<
          Array<{
            userId: string;
            exerciseId: string;
            status: string;
            createdAt: Date;
            passedCount?: number;
            totalCount?: number;
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
      ...(s.totalCount ? { scorePercent: Math.round(((s.passedCount ?? 0) / s.totalCount) * 100) } : {}),
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
        | 'teacherIds'
        | 'description'
        | 'archived'
        | 'ageGroup'
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
      // Chuyển giao một giảng viên (luồng cũ) thay toàn bộ danh sách phụ trách để không lệch với teacherIds.
      out.teacherIds = [id];
    }
    if (body.ageGroup !== undefined) {
      if (body.ageGroup !== null && !['3-5', '6-9', '10-12'].includes(body.ageGroup as string)) {
        throw new BadRequestException('Khối lớp không hợp lệ (3-5, 6-9 hoặc 10-12).');
      }
      if (body.ageGroup) out.ageGroup = body.ageGroup as string;
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
