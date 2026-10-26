import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import { DaLabSubmission, DaLabSubmissionDocument } from '../../modules-system/database/schemas/da-lab-submission.schema';
import { AiLabSubmission } from '../../modules-system/database/schemas/ai-lab-submission.schema';
import { TesterLab, TesterLabDocument } from '../../modules-system/database/schemas/tester-lab.schema';
import {
  TesterLabSubmission,
  TesterLabSubmissionDocument,
} from '../../modules-system/database/schemas/tester-lab-submission.schema';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { CourseCertificate, CourseCertificateDocument } from '../../modules-system/database/schemas/course-certificate.schema';
import {
  applyIssuedCertificates,
  buildCareerCourses,
  careerCoursesToEnrollments,
  type IssuedCertificate,
  type CareerCourse,
  type CareerCourseKey,
  type CareerLabItemInput,
} from './career-courses';

const DA_LAB_TOPIC = 'da-lab-pack';
const AI_LAB_TOPIC = 'ai-lab-pack';
const SYSTEM_TEACHER_FALLBACK = null;

const asDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(v as string | number | Date);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Khóa học chuyên ngành của Người đi làm / Trái ngành: gom dữ liệu thật từ 3 phòng lab (Data Lab, AI Lab, Tester Lab) thành
 * 3 khóa với tiến độ, lịch sử nộp và nhận xét. Chỉ đọc dữ liệu của CHÍNH học viên (userId lấy từ token).
 */
@Injectable()
export class CareerCoursesService {
  constructor(
    @InjectModel(Exercise.name) private readonly exercises: Model<ExerciseDocument>,
    @InjectModel(DaLabSubmission.name) private readonly daSubs: Model<DaLabSubmissionDocument>,
    @InjectModel(AiLabSubmission.name) private readonly aiSubs: Model<AiLabSubmission>,
    @InjectModel(TesterLab.name) private readonly testerLabs: Model<TesterLabDocument>,
    @InjectModel(TesterLabSubmission.name) private readonly testerSubs: Model<TesterLabSubmissionDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    // Chứng chỉ đã cấp (bất biến). Thiếu model (test cũ) thì chỉ tính động, không cấp/khóa chứng chỉ.
    @Optional() @InjectModel(CourseCertificate.name) private readonly certificates?: Model<CourseCertificateDocument>,
    // Lớp khóa học (Admin Portal) cho biết giảng viên được phân công; thiếu (test cũ) thì chỉ dùng người chấm bài.
    @Optional() @InjectModel(Classroom.name) private readonly classrooms?: Model<ClassroomDocument>,
  ) {}

  /** Giảng viên Admin phân công cho từng khóa (giảng viên chính đứng đầu), dạng "Tên A, Tên B". */
  private async assignedTeacherNames(): Promise<Partial<Record<CareerCourseKey, string>>> {
    if (!this.classrooms) return {};
    const classes = await this.classrooms.find({ courseKey: { $exists: true, $ne: null } }).select('courseKey teacherId teacherIds').lean<Array<{ courseKey: CareerCourseKey; teacherId?: string; teacherIds?: string[] }>>();
    const idsOf = (c: { teacherId?: string; teacherIds?: string[] }) => (c.teacherIds?.length ? c.teacherIds : c.teacherId ? [c.teacherId] : []);
    const all = [...new Set(classes.flatMap(idsOf))].filter(isValidObjectId);
    if (all.length === 0) return {};
    const users = await this.users.find({ _id: { $in: all } }).select('fullName email').lean<Array<{ _id: unknown; fullName?: string; email?: string }>>();
    const nameById = new Map(users.map((u) => [String(u._id), u.fullName || u.email || '']));
    const out: Partial<Record<CareerCourseKey, string>> = {};
    for (const c of classes) {
      const names = idsOf(c).map((id) => nameById.get(id)).filter((n): n is string => !!n);
      if (names.length) out[c.courseKey] = names.join(', ');
    }
    return out;
  }

  async myCourses(userId: string): Promise<CareerCourse[]> {
    const [me, daLabs, aiLabs, testers] = await Promise.all([
      this.users.findById(userId).select('fullName').lean(),
      this.exercises
        .find({ topic: DA_LAB_TOPIC, resource_id: { $exists: true } })
        .select('title slug type points orderInTopic')
        .sort({ orderInTopic: 1 })
        .lean(),
      this.exercises
        .find({ topic: AI_LAB_TOPIC, type: 'AI_LAB' })
        .select('title slug points orderInTopic')
        .sort({ orderInTopic: 1 })
        .lean(),
      this.testerLabs.find().sort({ labCode: 1 }).lean(),
    ]);

    const daIds = daLabs.map((l: any) => String(l._id));
    const aiIds = aiLabs.map((l: any) => String(l._id));
    const [daSubs, aiSubs, testerSubs] = await Promise.all([
      daIds.length ? this.daSubs.find({ userId, exerciseId: { $in: daIds } }).sort({ updatedAt: -1 }).lean() : [],
      aiIds.length ? this.aiSubs.find({ userId, exerciseId: { $in: aiIds } }).sort({ updatedAt: -1 }).lean() : [],
      this.testerSubs.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const items: CareerLabItemInput[] = [];
    const reviewerIds = new Set<string>();
    const teacherByCourse: Partial<Record<CareerCourseKey, string>> = {};

    // ---- Tester QA ----
    const latestTester = new Map<string, any>();
    for (const s of testerSubs as any[]) if (!latestTester.has(String(s.labId))) latestTester.set(String(s.labId), s);
    const testerCount = new Map<string, number>();
    for (const s of testerSubs as any[]) testerCount.set(String(s.labId), (testerCount.get(String(s.labId)) ?? 0) + 1);
    testers.forEach((lab: any, idx) => {
      const sub = latestTester.get(String(lab._id));
      const maxScore = (lab.rubricCriteria ?? []).reduce((s: number, c: { maxScore: number }) => s + (c.maxScore ?? 0), 0) || 100;
      let latest: CareerLabItemInput['latest'] = null;
      if (sub) {
        const reviewed = sub.status === 'REVIEWED';
        const score = (sub.rubricGrades ?? []).reduce((s: number, g: { score: number }) => s + (g.score ?? 0), 0);
        if (reviewed && sub.reviewerId) {
          reviewerIds.add(String(sub.reviewerId));
          teacherByCourse['tester-qa'] ??= String(sub.reviewerId);
        }
        latest = {
          state: reviewed ? 'DONE' : 'PENDING',
          score,
          maxScore,
          submittedAt: asDate(sub.createdAt),
          feedback: reviewed ? (sub.reviewerNotes || null) : null,
          feedbackBy: reviewed && sub.reviewerNotes ? 'TEACHER' : null,
          attempts: testerCount.get(String(lab._id)) ?? 1,
        };
      }
      items.push({ courseKey: 'tester-qa', ref: lab.labCode, title: `${lab.labCode} · ${lab.title}`, maxScore, order: idx, latest });
    });

    // ---- Data Lab (SQL + Insight) ----
    const latestDa = new Map<string, any>();
    for (const s of daSubs as any[]) if (!latestDa.has(String(s.exerciseId))) latestDa.set(String(s.exerciseId), s);
    daLabs.forEach((lab: any, idx) => {
      const sub = latestDa.get(String(lab._id));
      let latest: CareerLabItemInput['latest'] = null;
      if (sub) {
        const isSql = sub.type === 'SQL';
        const maxScore = sub.maxScore ?? lab.points;
        const pending = sub.status === 'PENDING_REVIEW';
        // Bài SQL xong khi đạt điểm tối đa ở lần nộp nào đó; chưa đạt thì cho làm lại.
        const done = isSql ? (sub.bestScore ?? sub.score ?? 0) >= maxScore : sub.status === 'GRADED';
        const teacher = !!sub.reviewedBy && !!sub.teacherComment;
        if (sub.reviewedBy) {
          reviewerIds.add(String(sub.reviewedBy));
          teacherByCourse['data-sql'] ??= String(sub.reviewedBy);
        }
        latest = {
          state: pending ? 'PENDING' : done ? 'DONE' : 'IN_PROGRESS',
          score: isSql ? (sub.bestScore ?? sub.score ?? 0) : (sub.score ?? 0),
          maxScore,
          submittedAt: asDate(sub.updatedAt ?? sub.createdAt),
          feedback: teacher ? sub.teacherComment : sub.aiExplanation || null,
          feedbackBy: teacher ? 'TEACHER' : sub.aiExplanation ? 'SYSTEM' : null,
          attempts: sub.attemptCount ?? 1,
        };
      }
      items.push({ courseKey: 'data-sql', ref: lab.slug, title: lab.title, maxScore: lab.points, order: idx, latest });
    });

    // ---- AI Lab (Prompting) ----
    const latestAi = new Map<string, any>();
    for (const s of aiSubs as any[]) if (!latestAi.has(String(s.exerciseId))) latestAi.set(String(s.exerciseId), s);
    aiLabs.forEach((lab: any, idx) => {
      const sub = latestAi.get(String(lab._id));
      let latest: CareerLabItemInput['latest'] = null;
      if (sub) {
        const bestScore = Math.max(sub.best?.score ?? 0, sub.score ?? 0);
        const passedEver = sub.status === 'PASSED' || sub.best?.status === 'PASSED';
        latest = {
          state: passedEver ? 'DONE' : 'IN_PROGRESS',
          score: bestScore,
          maxScore: sub.maxScore ?? lab.points,
          submittedAt: asDate(sub.updatedAt ?? sub.createdAt),
          feedback: `${passedEver ? 'Đạt' : 'Chưa đạt'}: chất lượng ${sub.bestQualityScore ?? sub.qualityScore}/100, ${sub.score}/${sub.maxScore} điểm ở lần nộp gần nhất.`,
          feedbackBy: 'SYSTEM',
          attempts: sub.totalAttempts ?? 1,
        };
      }
      items.push({ courseKey: 'ai-prompt', ref: lab.slug, title: lab.title, maxScore: lab.points, order: idx, latest });
    });

    // Tên giảng viên: người đã chấm bài của học viên (nếu có); chưa ai chấm thì để trống.
    const validIds = [...reviewerIds].filter(isValidObjectId);
    const reviewers = validIds.length ? await this.users.find({ _id: { $in: validIds } }).select('fullName').lean() : [];
    const nameById = new Map(reviewers.map((r: any) => [String(r._id), r.fullName as string]));
    const teacherNames: Partial<Record<CareerCourseKey, string | null>> = {};
    for (const [course, id] of Object.entries(teacherByCourse)) {
      teacherNames[course as CareerCourseKey] = nameById.get(id) ?? SYSTEM_TEACHER_FALLBACK;
    }

    // Giảng viên Admin phân công là nguồn chính (khớp Admin Portal và tài khoản giảng viên); chưa phân công thì dùng người đã chấm bài.
    const assigned = await this.assignedTeacherNames();
    for (const [course, name] of Object.entries(assigned)) teacherNames[course as CareerCourseKey] = name;

    const courses = buildCareerCourses({ items, userId, studentName: (me as any)?.fullName || 'Học viên', teacherNames });
    return this.certificates ? this.issueAndApply(userId, courses) : courses;
  }

  /**
   * Khóa nào đạt điều kiện hoàn thành lần đầu thì CẤP chứng chỉ ngay (ghi một lần, bất biến). Từ đó về sau luôn trả đúng bản đã cấp,
   * kể cả khi giảng viên thêm bài lab mới làm khóa tụt % hoàn thành.
   */
  private async issueAndApply(userId: string, courses: CareerCourse[]): Promise<CareerCourse[]> {
    const model = this.certificates!;
    for (const c of courses) {
      if (!c.certificate) continue;
      try {
        await model.updateOne(
          { userId, courseKey: c.key },
          {
            $setOnInsert: {
              userId,
              courseKey: c.key,
              studentName: c.certificate.studentName,
              courseTitle: c.certificate.className,
              teacherName: c.certificate.teacherName ?? undefined,
              finalScore: c.certificate.finalScore,
              earned: c.certificate.earned,
              max: c.certificate.max,
              grade: c.certificate.grade,
              completedAt: c.certificate.completedAt,
              code: c.certificate.code,
            },
          },
          { upsert: true },
        );
      } catch (err) {
        // Hai yêu cầu cấp cùng lúc: bản ghi thứ hai đụng chỉ mục unique, bản đã có là bản đúng.
        if ((err as { code?: number })?.code !== 11000) throw err;
      }
    }
    const issued = (await model.find({ userId }).lean()) as unknown as IssuedCertificate[];
    return applyIssuedCertificates(courses, issued);
  }

  /** Dạng MyEnrollment cho trang Hồ sơ ("Lớp học / Khóa học đã tham gia"). */
  async myEnrollments(userId: string) {
    return careerCoursesToEnrollments(await this.myCourses(userId));
  }
}
