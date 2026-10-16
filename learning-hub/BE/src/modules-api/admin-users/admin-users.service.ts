import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { isValidObjectId, Model, Types } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { AiLabSubmission } from '../../modules-system/database/schemas/ai-lab-submission.schema';
import {
  Classroom,
  ClassroomDocument,
} from '../../modules-system/database/schemas/classroom.schema';
import {
  Counter,
  CounterDocument,
} from '../../modules-system/database/schemas/counter.schema';
import {
  DaLabSubmission,
  DaLabSubmissionDocument,
} from '../../modules-system/database/schemas/da-lab-submission.schema';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import {
  User,
  UserDocument,
} from '../../modules-system/database/schemas/user.schema';
import { LearnerActivityService } from '../learner-activity/learner-activity.service';
import {
  AnalyticsInput,
  AnalyticsSubmission,
  computeClassAnalytics,
  expandAggregate,
  GRADED_STATUSES,
  studentBreakdown,
} from '../teacher-analytics/analytics-core';
import {
  aiLabPassed,
  daLabPassed,
} from '../teacher-analytics/teacher-analytics.service';

export const ROLES = ['STUDENT', 'TEACHER', 'ADMIN'] as const;
/**
 * Vai trò Admin có thể cấp hoặc đổi. KHÔNG có ADMIN: Admin không được tạo hay nâng quyền Admin cho ai
 * (chống leo thang đặc quyền); tài khoản Admin chỉ do seed hoặc vận hành hệ thống tạo.
 */
export const ASSIGNABLE_ROLES = ['STUDENT', 'TEACHER'] as const;
export const STATUSES = ['ACTIVE', 'LOCKED'] as const;
type Role = (typeof ROLES)[number];
type Status = (typeof STATUSES)[number];

export const MAX_PAGE_SIZE = 100;
const DEFAULT_PAGE_SIZE = 20;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 72; // giới hạn byte của bcrypt
const STUDENT_CODE_COUNTER_KEY = 'studentCode';
const EMAIL =
  /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".]{2,}$/;
const RECENT_LIMIT = 10;
const HISTORY_CAP = 5000;

interface UserLean {
  _id: Types.ObjectId;
  fullName?: string;
  email: string;
  role: Role;
  status?: Status;
  studentCode?: string;
  avatar?: string;
  ageGroup?: string;
  createdAt?: Date;
}

const asId = (v: unknown) => String(v);

const toRow = (u: UserLean) => ({
  id: asId(u._id),
  fullName: u.fullName ?? '',
  email: u.email,
  studentCode: u.studentCode ?? null,
  role: u.role,
  status: (u.status ?? 'ACTIVE') as Status,
  avatar: u.avatar ?? null,
  createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
});

/** Quản lý người dùng cho Admin: liệt kê, tạo, đổi vai trò, khóa/mở khóa, hồ sơ học viên. */
@Injectable()
export class AdminUsersService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Counter.name)
    private readonly counters: Model<CounterDocument>,
    @InjectModel(Classroom.name)
    private readonly classes: Model<ClassroomDocument>,
    @InjectModel(Exercise.name)
    private readonly exercises: Model<ExerciseDocument>,
    @InjectModel(Submission.name)
    private readonly submissions: Model<SubmissionDocument>,
    @InjectModel(DaLabSubmission.name)
    private readonly daLabs: Model<DaLabSubmissionDocument>,
    @InjectModel(AiLabSubmission.name)
    private readonly aiLabs: Model<AiLabSubmission>,
    private readonly activity: LearnerActivityService,
  ) {}

  private assertAdmin(user: JwtPayload) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Chỉ quản trị viên được thực hiện thao tác này.',
      );
    }
  }

  private escape(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async list(
    user: JwtPayload,
    q: {
      role?: string;
      status?: string;
      q?: string;
      page?: string;
      pageSize?: string;
    },
  ) {
    this.assertAdmin(user);
    const filter: Record<string, unknown> = {};
    if (q.role) {
      if (!(ROLES as readonly string[]).includes(q.role)) {
        throw new BadRequestException('Vai trò lọc không hợp lệ.');
      }
      filter.role = q.role;
    }
    if (q.status) {
      if (!(STATUSES as readonly string[]).includes(q.status)) {
        throw new BadRequestException('Trạng thái lọc không hợp lệ.');
      }
      // Tài khoản cũ chưa có trường status vẫn là ACTIVE.
      filter.status = q.status === 'LOCKED' ? 'LOCKED' : { $ne: 'LOCKED' };
    }
    const term = (q.q ?? '').trim().slice(0, 60);
    if (term) {
      const rx = { $regex: this.escape(term), $options: 'i' };
      filter.$or = [{ fullName: rx }, { email: rx }, { studentCode: rx }];
    }
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Math.floor(Number(q.pageSize)) || DEFAULT_PAGE_SIZE),
    );
    const page = Math.max(1, Math.floor(Number(q.page)) || 1);

    const [rows, total] = await Promise.all([
      this.users
        .find(filter)
        .select('fullName email role status studentCode avatar createdAt')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<UserLean[]>(),
      this.users.countDocuments(filter),
    ]);
    // Học viên tự đăng ký chưa thuộc lớp nào có classCount = 0 ("Chưa vào lớp"); lớp lưu trữ không tính.
    const studentIds = rows.filter((r) => r.role === 'STUDENT').map((r) => asId(r._id));
    const memberships = studentIds.length
      ? await this.classes
          .find({ studentIds: { $in: studentIds }, archived: { $ne: true } })
          .select('studentIds')
          .lean<Array<{ studentIds?: string[] }>>()
      : [];
    const classCount = new Map<string, number>();
    for (const c of memberships) {
      for (const id of c.studentIds ?? []) {
        classCount.set(id, (classCount.get(id) ?? 0) + 1);
      }
    }
    return {
      items: rows.map((r) => ({
        ...toRow(r),
        classCount: r.role === 'STUDENT' ? (classCount.get(asId(r._id)) ?? 0) : null,
      })),
      total,
      page,
      pageSize,
    };
  }

  async create(
    user: JwtPayload,
    body: {
      fullName?: unknown;
      email?: unknown;
      password?: unknown;
      role?: unknown;
    },
  ) {
    this.assertAdmin(user);
    const fullName =
      typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const role = body.role;
    if (!fullName || fullName.length > 100) {
      throw new BadRequestException('Họ tên bắt buộc, tối đa 100 ký tự.');
    }
    if (!EMAIL.test(email) || email.length > 254) {
      throw new BadRequestException('Email không hợp lệ.');
    }
    if (
      password.length < MIN_PASSWORD ||
      Buffer.byteLength(password) > MAX_PASSWORD
    ) {
      throw new BadRequestException(
        `Mật khẩu từ ${MIN_PASSWORD} đến ${MAX_PASSWORD} ký tự.`,
      );
    }
    if (role === 'ADMIN') {
      throw new ForbiddenException('Không được tạo tài khoản quản trị viên.');
    }
    if (
      typeof role !== 'string' ||
      !(ASSIGNABLE_ROLES as readonly string[]).includes(role)
    ) {
      throw new BadRequestException(
        'Vai trò không hợp lệ (chỉ học viên hoặc giảng viên).',
      );
    }
    if (await this.users.exists({ email })) {
      throw new ConflictException('Email đã được sử dụng.');
    }
    const created = await this.users.create({
      email,
      password: await bcrypt.hash(password, 10),
      fullName,
      role,
      ...(role === 'STUDENT'
        ? { studentCode: await this.nextStudentCode() }
        : {}),
    });
    return toRow(created.toObject() as unknown as UserLean);
  }

  /**
   * Chuyển vai trò giữa STUDENT và TEACHER. Không bao giờ đặt hoặc đổi vai trò ADMIN. Hạ giảng viên về
   * học viên đi qua đúng luồng thu hồi quyền (phải bàn giao lớp, đồng thời hủy phiên đăng nhập).
   */
  async setRole(user: JwtPayload, id: string, role: unknown) {
    this.assertAdmin(user);
    if (role === 'ADMIN') {
      throw new ForbiddenException(
        'Không được gán quyền quản trị viên cho tài khoản nào.',
      );
    }
    if (
      typeof role !== 'string' ||
      !(ASSIGNABLE_ROLES as readonly string[]).includes(role)
    ) {
      throw new BadRequestException(
        'Vai trò không hợp lệ (chỉ học viên hoặc giảng viên).',
      );
    }
    const target = await this.findTarget(id);
    if (target.role === 'ADMIN') {
      throw new ForbiddenException(
        'Không thể đổi vai trò của tài khoản quản trị viên.',
      );
    }
    if (target.role === role) return toRow(target);
    if (asId(target._id) === user.sub) {
      throw new ForbiddenException('Không thể tự đổi vai trò của chính mình.');
    }
    if (target.role === 'TEACHER') {
      return this.revokeTeacher(user, id, 'STUDENT');
    }
    await this.users.updateOne({ _id: target._id }, { $set: { role } });
    return toRow({ ...target, role } as UserLean);
  }

  /**
   * Thu hồi quyền giảng viên: hạ về STUDENT (mode STUDENT) hoặc khóa hẳn tài khoản (mode LOCK), và hủy mọi
   * phiên đăng nhập đang có ngay lập tức. Từ chối (409, kèm danh sách lớp) nếu giảng viên còn phụ trách lớp.
   */
  async revokeTeacher(user: JwtPayload, id: string, mode: unknown = 'STUDENT') {
    this.assertAdmin(user);
    if (mode !== 'STUDENT' && mode !== 'LOCK') {
      throw new BadRequestException(
        'Chế độ thu hồi không hợp lệ (STUDENT hoặc LOCK).',
      );
    }
    const target = await this.findTarget(id);
    if (target.role !== 'TEACHER') {
      throw new BadRequestException('Tài khoản này không phải giảng viên.');
    }
    if (asId(target._id) === user.sub) {
      throw new ForbiddenException(
        'Không thể tự thu hồi quyền của chính mình.',
      );
    }
    const led = await this.classes
      .find({ teacherId: asId(target._id) })
      .select('name')
      .lean<Array<{ _id: unknown; name: string }>>();
    if (led.length > 0) {
      throw new ConflictException({
        statusCode: 409,
        error: 'Conflict',
        message: `Giảng viên đang phụ trách ${led.length} lớp. Hãy chuyển giao lớp cho giảng viên khác trước khi thu hồi quyền.`,
        classes: led
          .slice(0, 20)
          .map((c) => ({ id: asId(c._id), name: c.name })),
      });
    }
    const visible: Record<string, unknown> = {};
    if (mode === 'LOCK') {
      visible.status = 'LOCKED';
    } else {
      visible.role = 'STUDENT';
      if (!target.studentCode) {
        visible.studentCode = await this.nextStudentCode();
      }
    }
    await this.users.updateOne(
      { _id: target._id },
      { $set: { ...visible, sessionsRevokedAt: new Date() } },
    );
    return toRow({ ...target, ...visible } as UserLean);
  }

  async setStatus(user: JwtPayload, id: string, status: unknown) {
    this.assertAdmin(user);
    if (
      typeof status !== 'string' ||
      !(STATUSES as readonly string[]).includes(status)
    ) {
      throw new BadRequestException('Trạng thái không hợp lệ.');
    }
    const target = await this.findTarget(id);
    if (status === 'LOCKED') {
      if (asId(target._id) === user.sub) {
        throw new ForbiddenException(
          'Không thể tự khóa tài khoản của chính mình.',
        );
      }
      await this.assertNotLastAdmin(target, true);
    }
    await this.users.updateOne({ _id: target._id }, { $set: { status } });
    return toRow({ ...target, status } as UserLean);
  }

  /** Hồ sơ chi tiết cho drawer: thông tin, lớp, tiến độ, bài nộp gần nhất, hoạt động. */
  async getProfile(user: JwtPayload, id: string, tzOffset?: string) {
    this.assertAdmin(user);
    const target = await this.findTarget(id);
    const uid = asId(target._id);
    const base = {
      user: { ...toRow(target), ageGroup: target.ageGroup ?? null },
    };

    if (target.role === 'TEACHER') {
      const led = await this.classes
        .find({ teacherId: uid })
        .select('name studentIds exerciseSlugs archived')
        .sort({ name: 1 })
        .lean<
          Array<{
            _id: unknown;
            name: string;
            studentIds?: string[];
            exerciseSlugs?: string[];
            archived?: boolean;
          }>
        >();
      return {
        ...base,
        classes: led.map((c) => ({
          id: asId(c._id),
          name: c.name,
          archived: c.archived === true,
          students: (c.studentIds ?? []).length,
          exercises: (c.exerciseSlugs ?? []).length,
          teacher: null,
          assigned: null,
          passed: null,
          completionRate: null,
        })),
        stats: null,
        recent: [],
        activity: null,
      };
    }
    if (target.role !== 'STUDENT') {
      return { ...base, classes: [], stats: null, recent: [], activity: null };
    }

    const memberOf = await this.classes
      .find({ studentIds: uid })
      .select('name teacherId exerciseSlugs archived')
      .sort({ name: 1 })
      .lean<
        Array<{
          _id: unknown;
          name: string;
          teacherId: string;
          exerciseSlugs?: string[];
          archived?: boolean;
        }>
      >();

    const [judge, da, ai, teachers, activity] = await Promise.all([
      this.submissions
        .find({ userId: uid, status: { $in: [...GRADED_STATUSES] } })
        .select('exerciseId status createdAt')
        .sort({ createdAt: -1 })
        .limit(HISTORY_CAP)
        .lean<Array<{ exerciseId: string; status: string; createdAt: Date }>>(),
      this.daLabs
        .find({ userId: uid })
        .select(
          'exerciseSlug type status attemptCount score bestScore maxScore createdAt updatedAt',
        )
        .limit(HISTORY_CAP)
        .lean<
          Array<{
            exerciseSlug: string;
            type?: string;
            status?: string;
            attemptCount?: number;
            score?: number;
            bestScore?: number;
            maxScore?: number;
            createdAt?: Date;
            updatedAt?: Date;
          }>
        >(),
      this.aiLabs
        .find({ userId: uid })
        .select('exerciseSlug status totalAttempts best createdAt updatedAt')
        .limit(HISTORY_CAP)
        .lean<
          Array<{
            exerciseSlug: string;
            status?: string;
            totalAttempts?: number;
            best?: { status?: string };
            createdAt?: Date;
            updatedAt?: Date;
          }>
        >(),
      this.users
        .find({
          _id: {
            $in: [...new Set(memberOf.map((c) => c.teacherId))].filter(
              isValidObjectId,
            ),
          },
        })
        .select('fullName email')
        .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>(),
      this.activity.getActivity(uid, { days: 280, tzOffset }),
    ]);

    // Tiêu đề bài: gom mọi bài đã làm hoặc được giao cho lớp.
    const exerciseIds = [...new Set(judge.map((j) => j.exerciseId))].filter(
      isValidObjectId,
    );
    const slugs = [
      ...new Set([
        ...da.map((d) => d.exerciseSlug),
        ...ai.map((a) => a.exerciseSlug),
        ...memberOf.flatMap((c) => c.exerciseSlugs ?? []),
      ]),
    ];
    const exDocs = await this.exercises
      .find({ $or: [{ _id: { $in: exerciseIds } }, { slug: { $in: slugs } }] })
      .select('slug title tags topic')
      .lean<
        Array<{
          _id: unknown;
          slug: string;
          title: string;
          tags?: string[];
          topic?: string;
        }>
      >();
    const byId = new Map(exDocs.map((e) => [asId(e._id), e]));
    const bySlug = new Map(exDocs.map((e) => [e.slug, e]));

    const submissions: AnalyticsSubmission[] = [];
    const recent: Array<{
      title: string;
      kind: string;
      status: string;
      at: Date;
    }> = [];
    for (const j of judge) {
      const e = byId.get(j.exerciseId);
      if (!e) continue;
      submissions.push({
        userId: uid,
        exerciseSlug: e.slug,
        status: j.status,
        at: j.createdAt,
      });
      recent.push({
        title: e.title,
        kind: 'CODE',
        status: j.status === 'AC' ? 'PASSED' : 'FAILED',
        at: j.createdAt,
      });
    }
    for (const d of da) {
      const at = d.updatedAt ?? d.createdAt ?? new Date(0);
      const passed = daLabPassed({ userId: uid, ...d });
      submissions.push(
        ...expandAggregate({
          userId: uid,
          exerciseSlug: d.exerciseSlug,
          attempts: d.attemptCount ?? 1,
          passed,
          at,
        }),
      );
      recent.push({
        title: bySlug.get(d.exerciseSlug)?.title ?? d.exerciseSlug,
        kind: d.type === 'SQL' ? 'SQL' : 'INSIGHT',
        status: passed
          ? 'PASSED'
          : d.status === 'PENDING_REVIEW'
            ? 'PENDING'
            : 'FAILED',
        at,
      });
    }
    for (const a of ai) {
      const at = a.updatedAt ?? a.createdAt ?? new Date(0);
      const passed = aiLabPassed({ userId: uid, ...a });
      submissions.push(
        ...expandAggregate({
          userId: uid,
          exerciseSlug: a.exerciseSlug,
          attempts: a.totalAttempts ?? 1,
          passed,
          at,
        }),
      );
      recent.push({
        title: bySlug.get(a.exerciseSlug)?.title ?? a.exerciseSlug,
        kind: 'AI_LAB',
        status: passed ? 'PASSED' : 'FAILED',
        at,
      });
    }

    const touched = new Set(submissions.map((s) => s.exerciseSlug));
    const assignedAll = new Set(memberOf.flatMap((c) => c.exerciseSlugs ?? []));
    const input: AnalyticsInput = {
      students: [{ id: uid, name: target.fullName ?? target.email }],
      exercises: [...new Set([...touched, ...assignedAll])].map((slug) => {
        const e = bySlug.get(slug);
        return {
          slug,
          title: e?.title ?? slug,
          tags: e?.tags ?? [],
          topic: e?.topic,
        };
      }),
      submissions,
      hints: [],
    };
    const summary = computeClassAnalytics(input).summary;
    const breakdown = new Map(
      studentBreakdown(input, uid).map((b) => [b.slug, b.status]),
    );
    const teacherById = new Map(
      teachers.map((t) => [asId(t._id), t.fullName || t.email || asId(t._id)]),
    );

    return {
      ...base,
      classes: memberOf.map((c) => {
        const assigned = (c.exerciseSlugs ?? []).length;
        const passed = (c.exerciseSlugs ?? []).filter(
          (s) => breakdown.get(s) === 'PASSED',
        ).length;
        return {
          id: asId(c._id),
          name: c.name,
          archived: c.archived === true,
          teacher: teacherById.get(c.teacherId) ?? null,
          assigned,
          passed,
          completionRate: assigned
            ? Math.round((passed / assigned) * 10000) / 10000
            : null,
          students: null,
          exercises: null,
        };
      }),
      stats: {
        totalSubmissions: summary.totalAttempts,
        attemptedExercises: summary.attemptedPairs,
        passedExercises: summary.passedPairs,
        passRate: summary.passRate,
      },
      recent: recent
        .sort((x, y) => y.at.getTime() - x.at.getTime())
        .slice(0, RECENT_LIMIT)
        .map((r) => ({ ...r, at: r.at.toISOString() })),
      activity,
    };
  }

  // ---------- nội bộ ----------

  private async findTarget(id: string): Promise<UserLean> {
    if (!isValidObjectId(id))
      throw new NotFoundException('Không tìm thấy người dùng.');
    const target = await this.users
      .findById(id)
      .select(
        'fullName email role status studentCode avatar ageGroup createdAt',
      )
      .lean<UserLean>();
    if (!target) throw new NotFoundException('Không tìm thấy người dùng.');
    return target;
  }

  /** Không để hệ thống không còn Admin nào đang hoạt động. */
  private async assertNotLastAdmin(target: UserLean, removing: boolean) {
    if (
      !removing ||
      target.role !== 'ADMIN' ||
      (target.status ?? 'ACTIVE') === 'LOCKED'
    )
      return;
    const others = await this.users.countDocuments({
      role: 'ADMIN',
      status: { $ne: 'LOCKED' },
      _id: { $ne: target._id },
    });
    if (others === 0) {
      throw new ConflictException(
        'Đây là Admin hoạt động cuối cùng, không thể khóa hoặc hạ quyền.',
      );
    }
  }

  private async nextStudentCode(): Promise<string> {
    const counter = await this.counters.findOneAndUpdate(
      { key: STUDENT_CODE_COUNTER_KEY },
      { $inc: { seq: 1 } },
      { new: true, upsert: true },
    );
    return `C${String(counter.seq).padStart(4, '0')}`;
  }
}
