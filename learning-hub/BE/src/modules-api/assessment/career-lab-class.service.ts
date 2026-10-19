import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { DaLabSubmission, DaLabSubmissionDocument } from '../../modules-system/database/schemas/da-lab-submission.schema';
import { AiLabSubmission } from '../../modules-system/database/schemas/ai-lab-submission.schema';
import { aiLabPassed, daLabPassed } from '../teacher-analytics/teacher-analytics.service';
import { isSandboxCareerClass, TESTER_RATING_LABEL, testerRating } from './domain/tester-progress';

type ClassLean = Classroom & { _id: unknown };
const asId = (v: unknown) => String(v);
const CONTENT_LIMIT = 4000;

export interface LabAttemptView {
  content: string;
  score: number | null;
  maxScore: number | null;
  status: string;
  at: Date | null;
}

export interface LabEntry {
  slug: string;
  title: string;
  type: 'SQL' | 'INSIGHT' | 'AI_LAB';
  status: string;
  attempts: number;
  score: number;
  maxScore: number;
  percent: number | null;
  passed: boolean;
  pendingReview: boolean;
  lastAt: Date | null;
  content: string;
  feedback: string;
  history: LabAttemptView[];
}

const pct = (score: number, max: number): number | null => (max > 0 ? Math.round((Math.min(score, max) / max) * 1000) / 10 : null);

/**
 * Lớp Career tự chấm trên sandbox (Data SQL Lab, AI Prompt Lab): giảng viên CHỈ theo dõi — danh sách học viên, số Lab đạt, điểm trung bình,
 * và xem câu SQL / prompt học viên đã nộp. Không có form chấm thủ công, không giao bài, không đo out-tab. Mọi số liệu đọc thẳng từ
 * `da_lab_submissions` / `ai_lab_submissions` (chính collection học viên ghi khi làm Lab), không có bảng tổng hợp riêng.
 */
@Injectable()
export class CareerLabClassService {
  constructor(
    @InjectModel(Classroom.name) private readonly classes: Model<ClassroomDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Exercise.name) private readonly exercises: Model<ExerciseDocument>,
    @InjectModel(DaLabSubmission.name) private readonly daLabs: Model<DaLabSubmissionDocument>,
    @InjectModel(AiLabSubmission.name) private readonly aiLabs: Model<AiLabSubmission>,
  ) {}

  private async loadClass(user: JwtPayload, classId: string): Promise<ClassLean> {
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp.');
    const cls = await this.classes.findById(classId).lean<ClassLean>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    const owns = cls.teacherId === user.sub || (cls.teacherIds ?? []).includes(user.sub);
    if (user.role !== 'ADMIN' && !(user.role === 'TEACHER' && owns)) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bạn không có quyền với lớp này.' });
    }
    if (!isSandboxCareerClass(cls)) {
      throw new BadRequestException({ code: 'E400_NOT_SANDBOX_CLASS', message: 'Chức năng này chỉ dành cho lớp Data SQL Lab và AI Prompt Lab.' });
    }
    return cls;
  }

  /** Các Lab cố định của khóa (cùng quy ước đếm Lab với Admin Portal). */
  private async labsOf(cls: ClassLean) {
    const filter = cls.courseKey === 'data-sql' ? { topic: 'da-lab-pack', resource_id: { $exists: true } } : { topic: 'ai-lab-pack', type: 'AI_LAB' };
    const docs = await this.exercises.find(filter).select('slug title type').sort({ slug: 1 }).lean<Array<{ slug: string; title: string; type?: string }>>();
    return docs;
  }

  private roster() {
    return this.users
      .find({ role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: { $ne: 'LOCKED' } })
      .select('fullName email')
      .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>();
  }

  /** Mọi lượt làm Lab của các học viên, quy về một dạng chung theo (học viên, Lab). */
  private async entries(cls: ClassLean, userIds: string[], labs: Map<string, { title: string }>): Promise<Map<string, LabEntry[]>> {
    const byUser = new Map<string, LabEntry[]>();
    const push = (uid: string, e: LabEntry) => byUser.set(uid, [...(byUser.get(uid) ?? []), e]);
    const slugs = [...labs.keys()];
    if (!userIds.length || !slugs.length) return byUser;

    if (cls.courseKey === 'data-sql') {
      const rows = await this.daLabs.find({ userId: { $in: userIds }, exerciseSlug: { $in: slugs } }).lean<Array<Record<string, any>>>();
      for (const r of rows) {
        const best = Math.max(r.bestScore ?? 0, r.score ?? 0);
        const pending = r.status === 'PENDING_REVIEW';
        push(r.userId, {
          slug: r.exerciseSlug,
          title: labs.get(r.exerciseSlug)?.title ?? r.exerciseSlug,
          type: r.type === 'SQL' ? 'SQL' : 'INSIGHT',
          status: r.status,
          attempts: r.attemptCount ?? 1,
          score: best,
          maxScore: r.maxScore ?? 0,
          percent: pending ? null : pct(best, r.maxScore ?? 0),
          passed: daLabPassed(r as never),
          pendingReview: pending,
          lastAt: r.updatedAt ?? r.createdAt ?? null,
          content: String(r.content ?? '').slice(0, CONTENT_LIMIT),
          feedback: String(r.teacherComment || r.aiExplanation || ''),
          history: (r.history ?? []).slice(-5).reverse().map((h: Record<string, any>) => ({
            content: String(h.content ?? '').slice(0, CONTENT_LIMIT),
            score: typeof h.score === 'number' ? h.score : null,
            maxScore: typeof h.maxScore === 'number' ? h.maxScore : null,
            status: String(h.status ?? ''),
            at: h.submittedAt ?? null,
          })),
        });
      }
    } else {
      const rows = await this.aiLabs.find({ userId: { $in: userIds }, exerciseSlug: { $in: slugs } }).lean<Array<Record<string, any>>>();
      for (const r of rows) {
        const best = Math.max(r.best?.score ?? 0, r.score ?? 0);
        push(r.userId, {
          slug: r.exerciseSlug,
          title: labs.get(r.exerciseSlug)?.title ?? r.exerciseSlug,
          type: 'AI_LAB',
          status: r.status,
          attempts: r.totalAttempts ?? 1,
          score: best,
          maxScore: r.maxScore ?? 0,
          percent: pct(best, r.maxScore ?? 0),
          passed: aiLabPassed(r as never),
          pendingReview: false,
          lastAt: r.updatedAt ?? r.createdAt ?? null,
          content: String(r.best?.prompt ?? r.prompt ?? '').slice(0, CONTENT_LIMIT),
          feedback: '',
          history: (r.history ?? []).slice(-5).reverse().map((h: Record<string, any>) => ({
            content: String(h.prompt ?? '').slice(0, CONTENT_LIMIT),
            score: typeof h.score === 'number' ? h.score : null,
            maxScore: typeof r.maxScore === 'number' ? r.maxScore : null,
            status: String(h.status ?? ''),
            at: h.createdAt ?? null,
          })),
        });
      }
    }
    return byUser;
  }

  private summarize(list: LabEntry[], labsTotal: number) {
    const scored = list.filter((e) => e.percent !== null);
    const avgScore = scored.length ? Math.round((scored.reduce((s, e) => s + (e.percent as number), 0) / scored.length) * 10) / 10 : null;
    const rating = testerRating(avgScore);
    return {
      labsCompleted: list.filter((e) => e.passed).length,
      labsAttempted: list.length,
      labsTotal,
      avgScore,
      rating,
      ratingLabel: TESTER_RATING_LABEL[rating],
      attempts: list.reduce((s, e) => s + e.attempts, 0),
      pending: list.filter((e) => e.pendingReview).length,
    };
  }

  /** Danh sách học viên + tiến độ + điểm trung bình, xếp theo điểm giảm dần (chưa có điểm đứng cuối). */
  async rosterWithProgress(user: JwtPayload, classId: string) {
    const cls = await this.loadClass(user, classId);
    const [labs, people] = await Promise.all([this.labsOf(cls), this.roster()]);
    const labMap = new Map(labs.map((l) => [l.slug, { title: l.title }]));
    const ids = people.map((p) => asId(p._id));
    const byUser = await this.entries(cls, ids, labMap);
    const rows = people.map((p) => ({ studentId: asId(p._id), fullName: p.fullName ?? '', email: p.email ?? '', ...this.summarize(byUser.get(asId(p._id)) ?? [], labs.length) }));
    rows.sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1) || b.labsCompleted - a.labsCompleted || a.fullName.localeCompare(b.fullName, 'vi'));
    return { classId, courseKey: cls.courseKey as 'data-sql' | 'ai-prompt', labsTotal: labs.length, students: rows.map((r, i) => ({ rank: r.avgScore === null ? null : i + 1, ...r })) };
  }

  /** Chi tiết bài làm một học viên: từng Lab, điểm, câu SQL / prompt đã nộp và các lần nộp gần nhất. */
  async studentDetail(user: JwtPayload, classId: string, studentId: string) {
    const cls = await this.loadClass(user, classId);
    if (!isValidObjectId(studentId)) throw new NotFoundException('Không tìm thấy học viên.');
    const student = await this.users.findOne({ _id: studentId, role: 'STUDENT', ageGroup: 'CAREER_ADULT' }).select('fullName email').lean<{ _id: unknown; fullName?: string; email?: string }>();
    if (!student) throw new NotFoundException('Học viên không thuộc lớp này.');
    const labs = await this.labsOf(cls);
    const labMap = new Map(labs.map((l) => [l.slug, { title: l.title }]));
    const list = (await this.entries(cls, [studentId], labMap)).get(studentId) ?? [];
    list.sort((a, b) => a.slug.localeCompare(b.slug));
    return {
      courseKey: cls.courseKey as 'data-sql' | 'ai-prompt',
      student: { id: asId(student._id), fullName: student.fullName ?? '', email: student.email ?? '' },
      summary: this.summarize(list, labs.length),
      labs: list,
    };
  }
}
