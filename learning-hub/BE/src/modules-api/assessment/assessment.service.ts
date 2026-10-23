import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import {
  Assessment,
  AssessmentDocument,
  AssessmentSubmission,
  AssessmentSubmissionDocument,
  StateChange,
} from '../../modules-system/database/schemas/assessment.schemas';
import { AuditLogService } from '../admin-portal/audit-log.service';
import { sanitizeFeedback } from '../../common/utils/sanitize-feedback.util';
import {
  AssessmentType,
  assertCanAttempt,
  classifySubmissionTime,
  effectiveScore,
  pickCountedAttempt,
  POLICIES,
  redactForStudent,
  validateAssessmentInput,
  type AssessmentInput,
} from './domain/assessment-policy';
import {
  assertGradeEditable,
  assertTransition,
  requireReasonText,
  SCORED_STATES,
  SUBMITTED_STATES,
  SubmissionState,
  type TransitionActor,
} from './domain/submission-state';
import { INTEGRITY_FLAG, registerLeave } from './domain/contest-integrity';
import { isCareerCourseClass } from './domain/tester-progress';
import { calculateFinalGrade, type GradeItem } from './domain/final-grade';

type ClassLean = Classroom & { _id: unknown };
type AssessmentLean = Assessment & { _id: Types.ObjectId };
type SubmissionLean = AssessmentSubmission & { _id: Types.ObjectId };

const asId = (v: unknown) => String(v);
const MAX_CONTENT_BYTES = 200_000;

/**
 * Nghiệp vụ đánh giá (Assignment / Contest / Exam) và vòng đời bài nộp. Mọi bước chuyển trạng thái đi qua assertTransition()
 * với vai trò thực tế của người gọi trong lớp (OWNER = học viên sở hữu bài, CLASS_TEACHER = giảng viên phụ trách lớp), và được
 * ghi có điều kiện { state: from } để hai thao tác đồng thời không ghi đè nhau.
 */
@Injectable()
export class AssessmentService {
  constructor(
    @InjectModel(Assessment.name) private readonly assessments: Model<AssessmentDocument>,
    @InjectModel(AssessmentSubmission.name) private readonly submissions: Model<AssessmentSubmissionDocument>,
    @InjectModel(Classroom.name) private readonly classes: Model<ClassroomDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @Optional() private readonly audit?: AuditLogService,
  ) {}

  // ------------------------------------------------------------------ quyền theo lớp

  private async loadClass(classId: string): Promise<ClassLean> {
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp.');
    const cls = await this.classes.findById(classId).lean<ClassLean>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    return cls;
  }

  private isClassTeacher(cls: ClassLean, userId: string): boolean {
    return cls.teacherId === userId || (cls.teacherIds ?? []).includes(userId);
  }

  /** Chỉ giảng viên phụ trách lớp (không phải mọi giảng viên, cũng không phải Admin) được chấm/công bố. */
  private assertClassTeacher(cls: ClassLean, user: JwtPayload): void {
    if (user.role !== 'TEACHER' || !this.isClassTeacher(cls, user.sub)) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Chỉ giảng viên phụ trách lớp được thực hiện thao tác này.' });
    }
  }

  private async isMember(cls: ClassLean, studentId: string): Promise<boolean> {
    if ((cls.studentIds ?? []).includes(studentId)) return true;
    if (!cls.courseKey || !isValidObjectId(studentId)) return false;
    return !!(await this.users.exists({ _id: studentId, role: 'STUDENT', ageGroup: 'CAREER_ADULT' }));
  }

  private async assertStudentMember(cls: ClassLean, user: JwtPayload): Promise<void> {
    if (user.role !== 'STUDENT' || !(await this.isMember(cls, user.sub))) {
      throw new ForbiddenException({ code: 'E403_NOT_CLASS_MEMBER', message: 'Bạn không thuộc lớp này.' });
    }
  }

  private async loadAssessment(id: string): Promise<AssessmentLean> {
    if (!isValidObjectId(id)) throw new NotFoundException('Không tìm thấy bài đánh giá.');
    const a = await this.assessments.findById(id).lean<AssessmentLean>();
    if (!a) throw new NotFoundException('Không tìm thấy bài đánh giá.');
    return a;
  }

  private async loadSubmission(id: string): Promise<SubmissionLean> {
    if (!isValidObjectId(id)) throw new NotFoundException('Không tìm thấy bài nộp.');
    const s = await this.submissions.findById(id).lean<SubmissionLean>();
    if (!s) throw new NotFoundException('Không tìm thấy bài nộp.');
    return s;
  }

  /** Bước chuyển có điều kiện: chỉ ghi khi trạng thái trong CSDL vẫn là `from`; nếu ai đó vừa đổi trước thì 409. */
  private async applyTransition(
    sub: SubmissionLean,
    to: SubmissionState,
    actor: TransitionActor,
    by: string,
    set: Record<string, unknown> = {},
    reason?: string,
  ): Promise<SubmissionLean> {
    assertTransition(sub.state, to, actor);
    const change: StateChange = { from: sub.state, to, by, actor, at: new Date(), ...(reason ? { reason } : {}) };
    const history = [...(sub.history ?? []), change];
    const res = await this.submissions.updateOne({ _id: sub._id, state: sub.state }, { $set: { ...set, state: to, history } });
    if (!res.modifiedCount) {
      throw new ConflictException({ code: 'E409_STATE_CHANGED', message: 'Bài nộp vừa được cập nhật bởi thao tác khác, vui lòng tải lại.' });
    }
    return { ...sub, ...set, state: to, history } as SubmissionLean;
  }

  private async teacherContext(user: JwtPayload, submissionId: string) {
    const sub = await this.loadSubmission(submissionId);
    const cls = await this.loadClass(sub.classId);
    this.assertClassTeacher(cls, user);
    const assessment = await this.loadAssessment(asId(sub.assessmentId));
    return { sub, cls, assessment };
  }

  private async ownerContext(user: JwtPayload, submissionId: string) {
    const sub = await this.loadSubmission(submissionId);
    if (user.role !== 'STUDENT' || sub.studentId !== user.sub) {
      throw new ForbiddenException({ code: 'E403_NOT_OWNER', message: 'Chỉ học viên sở hữu bài được thực hiện thao tác này.' });
    }
    const assessment = await this.loadAssessment(asId(sub.assessmentId));
    return { sub, assessment };
  }

  // ------------------------------------------------------------------ bài đánh giá

  async createAssessment(user: JwtPayload, classId: string, input: AssessmentInput, now = new Date()) {
    const cls = await this.loadClass(classId);
    this.assertClassTeacher(cls, user);
    if (isCareerCourseClass(cls)) {
      throw new BadRequestException({ code: 'E400_TESTER_CLASS_NO_ASSIGNMENT', message: 'Lớp khóa Career học theo các Lab cố định, không tạo bài đánh giá/giao bài.' });
    }
    const valid = validateAssessmentInput(input, now);
    const policy = POLICIES[valid.assessmentType];
    const created = await this.assessments.create({
      classId,
      ...valid,
      dueDate: valid.dueDate ?? undefined,
      startTime: valid.startTime ?? undefined,
      durationMinutes: valid.durationMinutes ?? undefined,
      maxAttempts: policy.maxAttempts,
      gracePeriodMs: policy.gracePeriodMs,
      lateWindowMs: policy.lateWindowMs,
      hideDetails: policy.hideDetails,
      createdBy: user.sub,
    });
    return typeof (created as { toObject?: () => unknown }).toObject === 'function' ? (created as { toObject: () => unknown }).toObject() : created;
  }

  async listAssessments(user: JwtPayload, classId: string) {
    const cls = await this.loadClass(classId);
    if (user.role === 'STUDENT') await this.assertStudentMember(cls, user);
    else if (user.role !== 'ADMIN') this.assertClassTeacher(cls, user);
    return this.assessments.find({ classId }).sort({ createdAt: 1 }).lean();
  }

  // ------------------------------------------------------------------ học viên

  private async usedAttempts(assessmentId: Types.ObjectId, studentId: string): Promise<SubmissionLean[]> {
    return this.submissions.find({ assessmentId, studentId }).sort({ attemptNo: 1 }).lean<SubmissionLean[]>();
  }

  /** Lưu (hoặc tạo) bản nháp cho lượt hiện tại. Không vượt số lượt; cuộc thi chỉ trong khung giờ thi. */
  async saveDraft(user: JwtPayload, assessmentId: string, content: unknown, now = new Date()) {
    const assessment = await this.loadAssessment(assessmentId);
    const cls = await this.loadClass(assessment.classId);
    await this.assertStudentMember(cls, user);
    const body = content && typeof content === 'object' ? (content as Record<string, unknown>) : {};
    if (JSON.stringify(body).length > MAX_CONTENT_BYTES) throw new BadRequestException({ code: 'E400_CONTENT_TOO_LARGE', message: 'Bài làm quá lớn.' });
    if (assessment.assessmentType === AssessmentType.CONTEST) classifySubmissionTime(assessment, now);

    const all = await this.usedAttempts(assessment._id, user.sub);
    const draft = all.find((s) => s.state === SubmissionState.DRAFT);
    if (draft) {
      await this.submissions.updateOne({ _id: draft._id, state: SubmissionState.DRAFT }, { $set: { content: body } });
      return { ...draft, content: body };
    }
    const used = all.filter((s) => SUBMITTED_STATES.has(s.state)).length;
    if (all.some((s) => s.state === SubmissionState.FINALIZED)) {
      throw new ForbiddenException({ code: 'E403_SUBMISSION_FINALIZED', message: 'Kết quả bài này đã chốt.' });
    }
    assertCanAttempt(assessment.assessmentType, used);
    const created = await this.submissions.create({
      assessmentId: assessment._id,
      classId: assessment.classId,
      studentId: user.sub,
      attemptNo: all.length + 1,
      state: SubmissionState.DRAFT,
      content: body,
      history: [{ from: null, to: SubmissionState.DRAFT, by: user.sub, actor: 'OWNER', at: now }],
    });
    return (created as { toObject?: () => unknown }).toObject?.() ?? created;
  }

  /** DRAFT -> SUBMITTED (hoặc LATE nếu nộp trong cửa sổ trễ). Chỉ chủ bài. */
  async submit(user: JwtPayload, submissionId: string, now = new Date()) {
    const { sub, assessment } = await this.ownerContext(user, submissionId);
    const timing = classifySubmissionTime(assessment, now);
    const all = await this.usedAttempts(assessment._id, user.sub);
    assertCanAttempt(assessment.assessmentType, all.filter((s) => SUBMITTED_STATES.has(s.state)).length);
    const to = timing === 'LATE' ? SubmissionState.LATE : SubmissionState.SUBMITTED;
    const next = await this.applyTransition(sub, to, 'OWNER', user.sub, { submittedAt: now, isLate: timing === 'LATE' });
    return this.studentView(assessment, next);
  }

  /** Học viên xem bài của mình: EXAM không lộ chi tiết test case/đáp án; điểm chỉ hiện khi đã công bố. */
  async getMine(user: JwtPayload, submissionId: string) {
    const { sub, assessment } = await this.ownerContext(user, submissionId);
    return this.studentView(assessment, sub);
  }

  private studentView(assessment: AssessmentLean, sub: SubmissionLean) {
    return redactForStudent(assessment.assessmentType, { ...sub } as unknown as Record<string, unknown>, SCORED_STATES.has(sub.state));
  }

  /** PUBLISHED -> APPEALING: học viên yêu cầu phúc khảo (bắt buộc lý do). */
  async appeal(user: JwtPayload, submissionId: string, reason: unknown) {
    const { sub, assessment } = await this.ownerContext(user, submissionId);
    const text = requireReasonText(reason);
    const next = await this.applyTransition(sub, SubmissionState.APPEALING, 'OWNER', user.sub, { appeal: { reason: text, at: new Date() } }, text);
    return this.studentView(assessment, next);
  }

  /**
   * Cuộc thi: ghi nhận một lần rời màn hình (awayMs). Lần dưới 5 giây không tính; đủ 3 lần thì hệ thống tự nộp bài (forceSubmit)
   * và gắn cờ cảnh báo liêm chính.
   */
  async recordContestLeave(user: JwtPayload, submissionId: string, awayMs: unknown, now = new Date()) {
    const { sub, assessment } = await this.ownerContext(user, submissionId);
    if (!POLICIES[assessment.assessmentType].integrityMonitoring) {
      throw new BadRequestException({ code: 'E400_NOT_MONITORED', message: 'Chỉ cuộc thi mới giám sát rời màn hình.' });
    }
    if (sub.state !== SubmissionState.DRAFT) return { counted: false, leaveCount: sub.leaveCount ?? 0, forceSubmitted: sub.forceSubmitted === true };
    const outcome = registerLeave(sub.leaveCount ?? 0, Number(awayMs), sub.forceSubmitted === true);
    if (!outcome.counted) return { counted: false, leaveCount: outcome.leaveCount, forceSubmitted: false };
    if (!outcome.forceSubmit) {
      await this.submissions.updateOne({ _id: sub._id, state: SubmissionState.DRAFT }, { $set: { leaveCount: outcome.leaveCount } });
      return { counted: true, leaveCount: outcome.leaveCount, forceSubmitted: false };
    }
    await this.forceSubmit(sub, outcome.leaveCount, now);
    return { counted: true, leaveCount: outcome.leaveCount, forceSubmitted: true };
  }

  /** Hệ thống tự nộp bài cuộc thi đang làm dở và gắn cờ OUT_TAB_FORCE_SUBMIT. */
  private async forceSubmit(sub: SubmissionLean, leaveCount: number, now: Date) {
    const flags = [...new Set([...(sub.flags ?? []), INTEGRITY_FLAG])];
    return this.applyTransition(
      sub,
      SubmissionState.SUBMITTED,
      'SYSTEM',
      'system',
      { submittedAt: now, leaveCount, forceSubmitted: true, flags },
      `Rời màn hình ${leaveCount} lần (mỗi lần >= 5 giây): hệ thống tự nộp bài.`,
    );
  }

  // ------------------------------------------------------------------ giảng viên phụ trách lớp

  async listSubmissions(user: JwtPayload, assessmentId: string) {
    const assessment = await this.loadAssessment(assessmentId);
    const cls = await this.loadClass(assessment.classId);
    this.assertClassTeacher(cls, user);
    return this.submissions.find({ assessmentId: assessment._id }).sort({ studentId: 1, attemptNo: 1 }).lean();
  }

  /** SUBMITTED / LATE / GRADED / (phúc khảo được chấp nhận) -> GRADING. */
  async startGrading(user: JwtPayload, submissionId: string) {
    const { sub } = await this.teacherContext(user, submissionId);
    return this.applyTransition(sub, SubmissionState.GRADING, 'CLASS_TEACHER', user.sub);
  }

  /** Nhập điểm khi đang GRADING rồi chuyển GRADED. Bài LATE tự áp trần 90% điểm tối đa. */
  async grade(user: JwtPayload, submissionId: string, input: { rawScore?: unknown; feedback?: unknown; details?: unknown }) {
    const { sub, assessment } = await this.teacherContext(user, submissionId);
    assertGradeEditable(sub.state);
    const raw = Number(input?.rawScore);
    if (input?.rawScore === undefined || input?.rawScore === null || !Number.isFinite(raw) || raw < 0 || raw > assessment.maxScore) {
      throw new BadRequestException({ code: 'E400_INVALID_SCORE', message: `Điểm phải là số từ 0 đến ${assessment.maxScore}.` });
    }
    const score = effectiveScore(raw, assessment.maxScore, sub.isLate === true, assessment.assessmentType);
    const details = input?.details && typeof input.details === 'object' ? (input.details as Record<string, unknown>) : undefined;
    return this.applyTransition(sub, SubmissionState.GRADED, 'CLASS_TEACHER', user.sub, {
      rawScore: raw,
      score,
      feedback: sanitizeFeedback(input?.feedback ?? '', 2000),
      ...(details ? { details } : {}),
      gradedBy: user.sub,
      gradedAt: new Date(),
    });
  }

  async publish(user: JwtPayload, submissionId: string) {
    const { sub } = await this.teacherContext(user, submissionId);
    return this.applyTransition(sub, SubmissionState.PUBLISHED, 'CLASS_TEACHER', user.sub, { publishedAt: new Date() });
  }

  /** Xử lý phúc khảo: REGRADE -> GRADING (chấm lại), REJECT -> FINALIZED (giữ điểm và chốt). */
  async resolveAppeal(user: JwtPayload, submissionId: string, decision: unknown, note?: unknown) {
    const { sub } = await this.teacherContext(user, submissionId);
    if (decision !== 'REGRADE' && decision !== 'REJECT') {
      throw new BadRequestException({ code: 'E400_INVALID_DECISION', message: 'decision phải là REGRADE hoặc REJECT.' });
    }
    if (sub.state !== SubmissionState.APPEALING) {
      assertTransition(sub.state, decision === 'REGRADE' ? SubmissionState.GRADING : SubmissionState.FINALIZED, 'CLASS_TEACHER');
      throw new BadRequestException({ code: 'E400_NOT_APPEALING', message: 'Bài nộp không ở trạng thái phúc khảo.' });
    }
    const reason = typeof note === 'string' && note.trim() ? note.trim().slice(0, 500) : undefined;
    return this.applyTransition(sub, decision === 'REGRADE' ? SubmissionState.GRADING : SubmissionState.FINALIZED, 'CLASS_TEACHER', user.sub, {}, reason);
  }

  async finalize(user: JwtPayload, submissionId: string) {
    const { sub } = await this.teacherContext(user, submissionId);
    return this.applyTransition(sub, SubmissionState.FINALIZED, 'CLASS_TEACHER', user.sub);
  }

  /** Hủy kết quả: điểm về 0, bắt buộc lý do >= 10 ký tự, ghi audit log. Bài FINALIZED không hủy được. */
  async invalidate(user: JwtPayload & { email?: string }, submissionId: string, reason: unknown) {
    const { sub } = await this.teacherContext(user, submissionId);
    const text = requireReasonText(reason);
    const next = await this.applyTransition(sub, SubmissionState.INVALIDATED, 'CLASS_TEACHER', user.sub, { score: 0, invalidReason: text }, text);
    await this.audit?.record({ sub: user.sub, email: user.email ?? '' }, 'SUBMISSION_INVALIDATE', 'SUBMISSION', asId(sub._id), { state: sub.state, score: sub.score ?? null }, { state: next.state, score: 0 }, text);
    return next;
  }

  // ------------------------------------------------------------------ điểm tổng kết

  /** Điểm tổng kết của học viên trong lớp: giảng viên phụ trách, Admin, hoặc chính học viên đó. */
  async calculateFinalGrade(user: JwtPayload, classId: string, studentId: string) {
    const cls = await this.loadClass(classId);
    const allowed =
      user.role === 'ADMIN' ||
      (user.role === 'TEACHER' && this.isClassTeacher(cls, user.sub)) ||
      (user.role === 'STUDENT' && user.sub === studentId);
    if (!allowed) throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bạn không có quyền xem điểm tổng kết này.' });
    if (!(await this.isMember(cls, studentId))) throw new NotFoundException('Học viên không thuộc lớp này.');

    const [assessmentDocs, subDocs] = await Promise.all([
      this.assessments.find({ classId }).lean<AssessmentLean[]>(),
      this.submissions.find({ classId, studentId }).lean<SubmissionLean[]>(),
    ]);
    return { classId, studentId, ...this.gradeFor(assessmentDocs, subDocs) };
  }

  /**
   * Bảng điểm tổng kết của cả lớp (chỉ giảng viên phụ trách hoặc Admin). Cùng công thức với calculateFinalGrade nhưng chỉ
   * 2 truy vấn cho cả lớp. `assessmentCount` = 0 nghĩa là lớp chưa có bài đánh giá nào (giao diện ẩn cột điểm).
   */
  async calculateClassFinalGrades(user: JwtPayload, classId: string) {
    const cls = await this.loadClass(classId);
    if (user.role !== 'ADMIN' && !(user.role === 'TEACHER' && this.isClassTeacher(cls, user.sub))) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bạn không có quyền xem bảng điểm lớp này.' });
    }
    const studentIds = cls.studentIds ?? [];
    const [assessmentDocs, subDocs] = await Promise.all([
      this.assessments.find({ classId }).lean<AssessmentLean[]>(),
      studentIds.length ? this.submissions.find({ classId, studentId: { $in: studentIds } }).lean<SubmissionLean[]>() : [],
    ]);
    const byStudent = new Map<string, SubmissionLean[]>();
    for (const s of subDocs) byStudent.set(s.studentId, [...(byStudent.get(s.studentId) ?? []), s]);
    return {
      classId,
      assessmentCount: assessmentDocs.length,
      students: studentIds.map((studentId) => ({ studentId, ...this.gradeFor(assessmentDocs, byStudent.get(studentId) ?? []) })),
    };
  }

  private gradeFor(assessmentDocs: AssessmentLean[], subDocs: SubmissionLean[]) {
    const byAssessment = new Map<string, SubmissionLean[]>();
    for (const s of subDocs) {
      const k = asId(s.assessmentId);
      byAssessment.set(k, [...(byAssessment.get(k) ?? []), s]);
    }
    const toItem = (a: AssessmentLean): GradeItem => {
      const subs = byAssessment.get(asId(a._id)) ?? [];
      const submitted = subs.some((s) => SUBMITTED_STATES.has(s.state));
      const scored = subs.filter((s) => SCORED_STATES.has(s.state));
      const counted = pickCountedAttempt(scored.map((s) => ({ attemptNo: s.attemptNo, score: s.state === SubmissionState.INVALIDATED ? 0 : s.score })));
      const score = counted && typeof counted.score === 'number' ? Math.round((counted.score / a.maxScore) * 10000) / 100 : null;
      return { assessmentId: asId(a._id), score, submitted, pending: submitted && score === null };
    };
    const ofType = (t: AssessmentType) => assessmentDocs.filter((a) => a.assessmentType === t).map(toItem);
    return calculateFinalGrade({
      assignments: ofType(AssessmentType.ASSIGNMENT),
      contests: ofType(AssessmentType.CONTEST),
      exams: ofType(AssessmentType.EXAM),
    });
  }
}
