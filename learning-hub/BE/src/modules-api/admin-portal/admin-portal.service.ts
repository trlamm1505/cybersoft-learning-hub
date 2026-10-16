import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, isValidObjectId, Model } from 'mongoose';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { ClassAssignment, ClassAssignmentDocument } from '../../modules-system/database/schemas/class-assignment.schema';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import { TesterLab, TesterLabDocument } from '../../modules-system/database/schemas/tester-lab.schema';
import { Contest, ContestDocument } from '../../modules-system/database/schemas/contest.schema';
import { Submission, SubmissionDocument } from '../../modules-system/database/schemas/submission.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { SANDBOX_SQL_EXECUTOR } from '../da-labs/sandbox-sql.executor';
import type { SandboxSqlExecutor } from '../da-labs/sandbox-sql.executor';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { buildSandboxDbUrl } from '../../common/config/sandbox-env';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { AuditLogService } from './audit-log.service';
import { SystemConfigService } from './system-config.service';

export const AGE_GROUPS = ['3-5', '6-9', '10-12', 'CAREER_ADULT'] as const;
export const MAX_TEACHERS_PER_CLASS = 10;
export const HEALTH_PING_TIMEOUT_MS = 2_000;
/** Chậm hơn ngưỡng này thì cụm được coi là DEGRADED (vàng). */
export const SLOW_MS = 1_000;

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'DOWN';
export interface ClusterHealth {
  key: 'auth_db' | 'core_engine' | 'ai_gateway' | 'submissions_classes' | 'contests';
  label: string;
  status: HealthStatus;
  latencyMs: number;
  detail: string;
}

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 00:00 giờ Việt Nam (UTC+7) của ngày chứa `now`, trả về dạng Date UTC. */
export function vnDayStart(now: Date, daysAgo = 0): Date {
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const startVn = Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - daysAgo * DAY_MS;
  return new Date(startVn - VN_OFFSET_MS);
}

/** Chạy một phép kiểm tra với timeout cứng; đo độ trễ; lỗi/timeout thành DOWN thay vì ném ra ngoài. */
export async function runCheck(
  key: ClusterHealth['key'],
  label: string,
  fn: () => Promise<{ status?: HealthStatus; detail: string }>,
  timeoutMs = HEALTH_PING_TIMEOUT_MS,
): Promise<ClusterHealth> {
  const started = Date.now();
  let timer: NodeJS.Timeout | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Quá ${timeoutMs}ms không phản hồi`)), timeoutMs);
    });
    const res = await Promise.race([fn(), timeout]);
    const latencyMs = Date.now() - started;
    const status: HealthStatus = res.status ?? (latencyMs > SLOW_MS ? 'DEGRADED' : 'HEALTHY');
    return { key, label, status: status === 'HEALTHY' && latencyMs > SLOW_MS ? 'DEGRADED' : status, latencyMs, detail: res.detail };
  } catch (err) {
    return { key, label, status: 'DOWN', latencyMs: Date.now() - started, detail: (err as Error).message || 'Lỗi không xác định' };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Tổng hợp trạng thái chung: có cụm DOWN thì DOWN; có cụm DEGRADED thì DEGRADED; còn lại HEALTHY. */
export function overallStatus(clusters: Array<Pick<ClusterHealth, 'status'>>): HealthStatus {
  if (clusters.some((c) => c.status === 'DOWN')) return 'DOWN';
  if (clusters.some((c) => c.status === 'DEGRADED')) return 'DEGRADED';
  return 'HEALTHY';
}

@Injectable()
export class AdminPortalService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Classroom.name) private readonly classes: Model<ClassroomDocument>,
    @InjectModel(Submission.name) private readonly submissions: Model<SubmissionDocument>,
    @InjectModel(Contest.name) private readonly contests: Model<ContestDocument>,
    @InjectModel(ClassAssignment.name) private readonly assignments: Model<ClassAssignmentDocument>,
    @InjectModel(Exercise.name) private readonly exercises: Model<ExerciseDocument>,
    @InjectModel(TesterLab.name) private readonly testerLabs: Model<TesterLabDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly audit: AuditLogService,
    private readonly sysConfig: SystemConfigService,
    private readonly leaderboard: LeaderboardService,
    @Optional() @Inject(SANDBOX_SQL_EXECUTOR) private readonly sqlExecutor?: SandboxSqlExecutor,
  ) {}

  private assertAdmin(user: JwtPayload) {
    if (user.role !== 'ADMIN') throw new ForbiddenException('Chỉ quản trị viên được thực hiện thao tác này.');
  }

  // ------------------------------- Dashboard -------------------------------

  async dashboardSummary(user: JwtPayload, now: Date = new Date()) {
    this.assertAdmin(user);
    const todayStart = vnDayStart(now);
    const weekStart = vnDayStart(now, 6);
    const [byRoleRows, byAgeRows, openClasses, totalClasses, todayTotal, todayAc, week, locked] = await Promise.all([
      this.users.aggregate([{ $group: { _id: '$role', n: { $sum: 1 } } }]),
      this.users.aggregate([{ $match: { role: 'STUDENT' } }, { $group: { _id: { $ifNull: ['$ageGroup', 'NONE'] }, n: { $sum: 1 } } }]),
      this.classes.countDocuments({ archived: { $ne: true } }),
      this.classes.countDocuments({}),
      this.submissions.countDocuments({ createdAt: { $gte: todayStart } }),
      this.submissions.countDocuments({ createdAt: { $gte: todayStart }, status: 'AC' }),
      this.submissions.aggregate([
        { $match: { createdAt: { $gte: weekStart } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' } }, n: { $sum: 1 } } },
      ]),
      this.users.countDocuments({ status: 'LOCKED' }),
    ]);

    const byRole: Record<string, number> = { STUDENT: 0, TEACHER: 0, ADMIN: 0 };
    for (const r of byRoleRows) byRole[r._id] = r.n;
    const students: Record<string, number> = { '3-5': 0, '6-9': 0, '10-12': 0, CAREER_ADULT: 0, NONE: 0 };
    for (const r of byAgeRows) students[r._id] = r.n;
    const perDay = new Map<string, number>(week.map((w: { _id: string; n: number }) => [w._id, w.n]));
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const key = new Date(vnDayStart(now, i).getTime() + VN_OFFSET_MS).toISOString().slice(0, 10);
      days.push({ date: key, count: perDay.get(key) ?? 0 });
    }
    return {
      totalUsers: byRole.STUDENT + byRole.TEACHER + byRole.ADMIN,
      byRole,
      lockedUsers: locked,
      studentsByAgeGroup: students,
      openClasses,
      totalClasses,
      submissionsToday: todayTotal,
      acToday: todayAc,
      /** Tỷ lệ bài nộp hôm nay đạt (AC), làm tròn %. 0 khi chưa có bài nào. */
      completionRateToday: todayTotal ? Math.round((todayAc / todayTotal) * 100) : 0,
      submissionsLast7Days: days,
      generatedAt: now.toISOString(),
    };
  }

  // ------------------------------- Lớp học & giảng viên -------------------------------

  /** Số bài lab của từng khóa Người đi làm (đếm từ kho bài thật, không hardcode). */
  private async careerLabCounts(): Promise<Record<string, number>> {
    const [tester, data, ai] = await Promise.all([
      this.testerLabs.countDocuments({}),
      this.exercises.countDocuments({ topic: 'da-lab-pack', resource_id: { $exists: true } }),
      this.exercises.countDocuments({ topic: 'ai-lab-pack', type: 'AI_LAB' }),
    ]);
    return { 'tester-qa': tester, 'data-sql': data, 'ai-prompt': ai };
  }

  /** Học viên ghi danh khóa Người đi làm: mọi tài khoản CAREER_ADULT đang hoạt động (đều học đủ 3 khóa). */
  private careerStudents(limit = 200) {
    return this.users
      .find({ role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: { $ne: 'LOCKED' } })
      .sort({ email: 1 })
      .limit(limit)
      .select('fullName email studentCode ageGroup')
      .lean<Array<{ _id: unknown; fullName?: string; email: string; studentCode?: string; ageGroup?: string }>>();
  }

  /**
   * Danh sách lớp và khóa học: khối tuổi (suy ra từ học viên; khóa chuyên ngành luôn là CAREER_ADULT), giảng viên phụ trách,
   * sĩ số, số bài tập và trạng thái. ageGroupFilter lọc theo khối đào tạo.
   */
  async classesOverview(user: JwtPayload, ageGroupFilter?: string) {
    this.assertAdmin(user);
    if (ageGroupFilter && !(AGE_GROUPS as readonly string[]).includes(ageGroupFilter)) throw new BadRequestException('Khối đào tạo không hợp lệ.');
    const classes = await this.classes.find({}).sort({ archived: 1, name: 1 }).lean<
      Array<{ _id: unknown; name: string; code?: string; description?: string; ageGroup?: string; courseKey?: string; archived?: boolean; teacherId?: string; teacherIds?: string[]; studentIds?: string[]; exerciseSlugs?: string[] }>
    >();
    const hasCareer = classes.some((c) => c.courseKey);
    const [labCounts, careerCount, asgCounts] = await Promise.all([
      hasCareer ? this.careerLabCounts() : Promise.resolve({} as Record<string, number>),
      hasCareer ? this.users.countDocuments({ role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: { $ne: 'LOCKED' } }) : Promise.resolve(0),
      this.assignments.aggregate([{ $match: { classId: { $in: classes.map((c) => String(c._id)) } } }, { $group: { _id: '$classId', n: { $sum: 1 } } }]),
    ]);
    const asgByClass = new Map<string, number>(asgCounts.map((a: { _id: string; n: number }) => [a._id, a.n]));
    const teacherIds = new Set<string>();
    const studentIds = new Set<string>();
    for (const c of classes) {
      for (const t of this.teachersOf(c)) teacherIds.add(t);
      for (const s of c.studentIds ?? []) studentIds.add(s);
    }
    const valid = (ids: Set<string>) => [...ids].filter(isValidObjectId);
    const [teachers, students] = await Promise.all([
      this.users.find({ _id: { $in: valid(teacherIds) } }).select('fullName email status').lean<Array<{ _id: unknown; fullName?: string; email?: string; status?: string }>>(),
      this.users.find({ _id: { $in: valid(studentIds) } }).select('ageGroup').lean<Array<{ _id: unknown; ageGroup?: string }>>(),
    ]);
    const tName = new Map(teachers.map((t) => [String(t._id), t.fullName || t.email || String(t._id)]));
    const tLocked = new Set(teachers.filter((t) => t.status === 'LOCKED').map((t) => String(t._id)));
    const sAge = new Map(students.map((s) => [String(s._id), s.ageGroup]));
    const rows = classes.map((c) => {
      const counts = new Map<string, number>();
      for (const s of c.studentIds ?? []) {
        const g = sAge.get(s);
        if (g) counts.set(g, (counts.get(g) ?? 0) + 1);
      }
      const band = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      const career = !!c.courseKey;
      const exerciseCount = career ? (labCounts[c.courseKey!] ?? 0) : (asgByClass.get(String(c._id)) || (c.exerciseSlugs ?? []).length);
      return {
        id: String(c._id),
        code: c.code ?? null,
        name: c.name,
        description: c.description ?? '',
        kind: career ? ('CAREER' as const) : ('SCHOOL' as const),
        courseKey: c.courseKey ?? null,
        ageGroup: career ? ('CAREER_ADULT' as const) : ((c.ageGroup as typeof band) ?? band),
        // locked: tài khoản giảng viên đang bị khóa; lịch sử phân công vẫn giữ nhưng giao diện cảnh báo bằng badge xám.
        teachers: this.teachersOf(c).map((id) => ({ id, name: tName.get(id) ?? 'Giảng viên không còn tồn tại', locked: tLocked.has(id) })),
        studentCount: career ? careerCount : (c.studentIds ?? []).length,
        exerciseCount,
        status: c.archived ? ('ARCHIVED' as const) : ('OPEN' as const),
      };
    });
    return ageGroupFilter ? rows.filter((r) => r.ageGroup === ageGroupFilter) : rows;
  }

  /** Chi tiết một lớp/khóa: dòng tổng quan + danh sách học viên ghi danh (tối đa 200). */
  async classDetail(user: JwtPayload, classId: string) {
    this.assertAdmin(user);
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp.');
    const cls = await this.classes.findById(classId).lean<{ courseKey?: string; studentIds?: string[] }>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    const overview = (await this.classesOverview(user)).find((r) => r.id === classId);
    if (!overview) throw new NotFoundException('Không tìm thấy lớp.');
    const students = cls.courseKey
      ? await this.careerStudents()
      : await this.users
          .find({ _id: { $in: (cls.studentIds ?? []).filter(isValidObjectId).slice(0, 200) } })
          .sort({ fullName: 1 })
          .select('fullName email studentCode ageGroup')
          .lean<Array<{ _id: unknown; fullName?: string; email: string; studentCode?: string; ageGroup?: string }>>();
    const exercises = await this.classExercises(classId, cls);
    return {
      ...overview,
      exercises,
      students: students.map((s) => ({ id: String(s._id), fullName: s.fullName ?? '', email: s.email, studentCode: s.studentCode ?? null, ageGroup: s.ageGroup ?? null })),
    };
  }

  /**
   * Bài tập/lab của lớp kèm trạng thái. Lớp phổ thông: bài giao (Chưa mở / Đang mở / Đã hết hạn theo thời gian thật).
   * Khóa Người đi làm: các bài lab của khóa (luôn mở để học viên làm bất cứ lúc nào).
   */
  private async classExercises(classId: string, cls: { courseKey?: string }) {
    type Item = { title: string; kind: string; status: 'UPCOMING' | 'OPEN' | 'CLOSED'; dueAt: string | null };
    const out: Item[] = [];
    if (cls.courseKey === 'tester-qa') {
      const labs = await this.testerLabs.find({}).sort({ labCode: 1 }).limit(100).select('labCode title').lean<Array<{ labCode: string; title: string }>>();
      for (const l of labs) out.push({ title: `${l.labCode} · ${l.title}`, kind: 'TESTER', status: 'OPEN', dueAt: null });
    } else if (cls.courseKey === 'data-sql' || cls.courseKey === 'ai-prompt') {
      const filter = cls.courseKey === 'data-sql' ? { topic: 'da-lab-pack', resource_id: { $exists: true } } : { topic: 'ai-lab-pack', type: 'AI_LAB' };
      const labs = await this.exercises.find(filter).sort({ orderInTopic: 1 }).limit(100).select('title type').lean<Array<{ title: string; type?: string }>>();
      for (const l of labs) out.push({ title: l.title, kind: cls.courseKey === 'ai-prompt' ? 'AI' : l.type === 'SQL_LAB' ? 'SQL' : 'INSIGHT', status: 'OPEN', dueAt: null });
    } else {
      const now = Date.now();
      const asg = await this.assignments.find({ classId }).sort({ order: 1 }).limit(100).select('title type startAt dueAt').lean<Array<{ title: string; type: string; startAt: Date; dueAt: Date }>>();
      for (const a of asg) {
        const status = new Date(a.startAt).getTime() > now ? 'UPCOMING' : new Date(a.dueAt).getTime() < now ? 'CLOSED' : 'OPEN';
        out.push({ title: a.title, kind: a.type, status, dueAt: new Date(a.dueAt).toISOString() });
      }
    }
    return out;
  }

  /** Chuyển lớp/khóa vào Lưu trữ (đã bế giảng) hoặc kích hoạt lại; ghi audit CLASS_ARCHIVE. */
  async setArchived(user: JwtPayload, classId: string, archived: unknown) {
    this.assertAdmin(user);
    if (typeof archived !== 'boolean') throw new BadRequestException('archived phải là true hoặc false.');
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp.');
    const cls = await this.classes.findById(classId).lean<{ name: string; archived?: boolean }>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    if ((cls.archived === true) !== archived) {
      await this.classes.updateOne({ _id: classId }, { $set: { archived } });
      await this.audit.record(user, 'CLASS_ARCHIVE', 'CLASS', classId, { className: cls.name, archived: cls.archived === true }, { className: cls.name, archived });
    }
    return { classId, archived };
  }

  /** Giảng viên phụ trách của lớp: teacherIds (nhiều người) hoặc teacherId cũ (một người). */
  teachersOf(c: { teacherId?: string; teacherIds?: string[] }): string[] {
    const ids = c.teacherIds && c.teacherIds.length > 0 ? c.teacherIds : c.teacherId ? [c.teacherId] : [];
    return [...new Set(ids)];
  }

  /**
   * Gán một hoặc nhiều giảng viên phụ trách một lớp. Có hiệu lực ngay: mọi API của giảng viên (GET /teacher/classes, giao bài,
   * xem số liệu) đều nhận ra quyền mới ở request kế tiếp. Ghi audit CLASS_ASSIGN với danh sách trước/sau.
   */
  async assignTeachers(user: JwtPayload, classId: string, rawIds: unknown) {
    this.assertAdmin(user);
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp.');
    if (!Array.isArray(rawIds)) throw new BadRequestException('teacherIds phải là mảng id giảng viên.');
    const ids = [...new Set(rawIds.map((x) => (typeof x === 'string' ? x.trim() : '')))];
    if (ids.length === 0 || ids.some((x) => !isValidObjectId(x))) throw new BadRequestException('Cần ít nhất một giảng viên với id hợp lệ.');
    if (ids.length > MAX_TEACHERS_PER_CLASS) throw new BadRequestException(`Tối đa ${MAX_TEACHERS_PER_CLASS} giảng viên cho một lớp.`);

    const cls = await this.classes.findById(classId).lean<{ name: string; teacherId?: string; teacherIds?: string[] }>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    const found = await this.users.find({ _id: { $in: ids } }).select('fullName email role status').lean<Array<{ _id: unknown; fullName?: string; email?: string; role: string; status?: string }>>();
    const bad = ids.filter((id) => {
      const u = found.find((f) => String(f._id) === id);
      return !u || u.role !== 'TEACHER' || u.status === 'LOCKED';
    });
    if (bad.length > 0) throw new BadRequestException('Chỉ gán được tài khoản giảng viên đang hoạt động.');

    const before = this.teachersOf(cls);
    // teacherId giữ giảng viên chính (người đầu danh sách) để tương thích dữ liệu và mã cũ.
    await this.classes.updateOne({ _id: classId }, { $set: { teacherIds: ids, teacherId: ids[0] } });
    const name = (id: string) => found.find((f) => String(f._id) === id)?.fullName || id;
    // Tên giảng viên cũ (nếu còn tồn tại) để nhật ký hiển thị bằng tên người thay vì mã.
    const oldTeachers = before.length ? await this.users.find({ _id: { $in: before.filter(isValidObjectId) } }).select('fullName email').lean<Array<{ _id: unknown; fullName?: string; email?: string }>>() : [];
    const nameOf = (id: string) => oldTeachers.find((t) => String(t._id) === id)?.fullName || oldTeachers.find((t) => String(t._id) === id)?.email || name(id);
    await this.audit.record(
      user,
      'CLASS_ASSIGN',
      'CLASS',
      classId,
      { className: cls.name, teacherIds: before, teacherNames: before.map(nameOf) },
      { className: cls.name, teacherIds: ids, teacherNames: ids.map(name) },
    );
    return { classId, teacherIds: ids, teachers: ids.map((id) => ({ id, name: name(id) })) };
  }

  // ------------------------------- Health check -------------------------------

  async healthCheck(user: JwtPayload) {
    this.assertAdmin(user);
    const settled = await Promise.allSettled([
      runCheck('auth_db', 'Auth & Database', async () => {
        await this.connection.db!.admin().ping();
        return { detail: 'MongoDB: Connected' };
      }),
      runCheck('core_engine', 'Core Engine (SQLite in-memory)', async () => {
        if (!this.sqlExecutor) throw new Error('Engine SQL chưa được nạp');
        const r = await this.sqlExecutor.run(buildSandboxDbUrl(), 'SELECT COUNT(*) FROM customers', { timeoutMs: HEALTH_PING_TIMEOUT_MS });
        return { detail: `SQLite: Ready (in-process), ${r.rows[0]?.[0] ?? 0} dòng mẫu` };
      }),
      runCheck('ai_gateway', 'AI Gateway (Gemini)', async () => {
        const info = await this.sysConfig.keyInfo();
        if (!info.configured) return { status: 'DEGRADED' as const, detail: 'Gemini: chưa cấu hình API key (AI dùng chế độ dự phòng)' };
        const ping = await this.sysConfig.pingGemini();
        if (!ping.valid) return { status: 'DOWN' as const, detail: `Gemini: ${ping.reason ?? 'không hợp lệ'}` };
        return { status: ping.reason ? ('DEGRADED' as const) : undefined, detail: ping.reason ? `Gemini: ${ping.reason}` : `Gemini: Valid key, ${ping.latencyMs}ms` };
      }),
      runCheck('submissions_classes', 'Submissions & Classes', async () => {
        const [subs, classes, orphanTeachers] = await Promise.all([
          this.submissions.estimatedDocumentCount(),
          this.classes.countDocuments({}),
          this.classes.countDocuments({ $or: [{ teacherId: { $exists: false } }, { teacherId: '' }] }),
        ]);
        if (orphanTeachers > 0) return { status: 'DEGRADED' as const, detail: `${orphanTeachers} lớp chưa có giảng viên phụ trách (submissions: ${subs}, classes: ${classes})` };
        return { detail: `Toàn vẹn: ${subs} bài nộp, ${classes} lớp, mọi lớp đều có giảng viên` };
      }),
      runCheck('contests', 'Contests', async () => {
        const now = new Date();
        const active = await this.contests.find({ startTime: { $lte: now }, endTime: { $gte: now } }).select('_id title').limit(5).lean<Array<{ _id: unknown; title?: string }>>();
        if (active.length === 0) return { detail: 'Không có cuộc thi đang diễn ra' };
        const lb = await this.leaderboard.computeLeaderboard(String(active[0]._id));
        return { detail: `${active.length} cuộc thi đang diễn ra; bảng xếp hạng "${active[0].title ?? ''}" tính được ${lb.rows.length} thí sinh` };
      }),
    ]);
    const clusters: ClusterHealth[] = settled.map((s, i) =>
      s.status === 'fulfilled'
        ? s.value
        : { key: (['auth_db', 'core_engine', 'ai_gateway', 'submissions_classes', 'contests'] as const)[i], label: '', status: 'DOWN', latencyMs: 0, detail: String(s.reason) },
    );
    return { status: overallStatus(clusters), checkedAt: new Date().toISOString(), clusters };
  }
}
