import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import { TesterLab, TesterLabDocument } from '../../modules-system/database/schemas/tester-lab.schema';
import { TesterLabSubmission, TesterLabSubmissionDocument } from '../../modules-system/database/schemas/tester-lab-submission.schema';
import { isTesterClass, submissionTotal, summarizeTesterStudent, TESTER_RATING_LABEL } from '../assessment/domain/tester-progress';
import { TESTER_RUBRIC } from '../assessment/domain/tester-rubric';

type ClassLean = Classroom & { _id: unknown };
const asId = (v: unknown) => String(v);

/**
 * Nghiệp vụ riêng của lớp Tester QA (Career Adult): xếp hạng/tiến độ học viên và hàng chờ chấm NGAY TRONG LỚP.
 * Mọi con số đọc thẳng từ `tester_lab_submissions` (chính collection học viên nộp bài và chấm bài đang dùng); không có bảng tổng hợp riêng.
 * Học viên của khóa là mọi tài khoản CAREER_ADULT đang hoạt động (cùng quy ước withCareerRoster của Admin Portal).
 */
@Injectable()
export class TesterClassService {
  constructor(
    @InjectModel(Classroom.name) private readonly classes: Model<ClassroomDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(TesterLab.name) private readonly labs: Model<TesterLabDocument>,
    @InjectModel(TesterLabSubmission.name) private readonly submissions: Model<TesterLabSubmissionDocument>,
  ) {}

  /** Chỉ giảng viên phụ trách lớp Tester QA (hoặc Admin) được xem; lớp khác loại -> 400. */
  private async loadClass(user: JwtPayload, classId: string): Promise<ClassLean> {
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp.');
    const cls = await this.classes.findById(classId).lean<ClassLean>();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp.');
    const owns = cls.teacherId === user.sub || (cls.teacherIds ?? []).includes(user.sub);
    if (user.role !== 'ADMIN' && !(user.role === 'TEACHER' && owns)) {
      throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bạn không có quyền với lớp này.' });
    }
    if (!isTesterClass(cls)) {
      throw new BadRequestException({ code: 'E400_NOT_TESTER_CLASS', message: 'Chức năng này chỉ dành cho lớp Tester QA.' });
    }
    return cls;
  }

  private async roster() {
    return this.users
      .find({ role: 'STUDENT', ageGroup: 'CAREER_ADULT', status: { $ne: 'LOCKED' } })
      .select('fullName email')
      .lean<Array<{ _id: unknown; fullName?: string; email?: string }>>();
  }

  /** Bảng xếp hạng & tiến độ: xếp theo điểm trung bình giảm dần (chưa có điểm đứng cuối), kèm số bài chờ chấm. */
  async rosterWithProgress(user: JwtPayload, classId: string) {
    await this.loadClass(user, classId);
    const [people, labsTotal] = await Promise.all([this.roster(), this.labs.countDocuments({})]);
    const ids = people.map((p) => asId(p._id));
    const subs = ids.length
      ? await this.submissions.find({ userId: { $in: ids } }).select('userId labId status invalidated rubricGrades').lean<
          Array<{ userId: string; labId: unknown; status: 'SUBMITTED' | 'REVIEWED'; invalidated?: boolean; rubricGrades?: Array<{ key: string; score: number }> }>
        >()
      : [];
    const byUser = new Map<string, typeof subs>();
    for (const s of subs) byUser.set(s.userId, [...(byUser.get(s.userId) ?? []), s]);

    const rows = people.map((p) => {
      const id = asId(p._id);
      const summary = summarizeTesterStudent((byUser.get(id) ?? []).map((s) => ({ ...s, labId: asId(s.labId) })), labsTotal);
      return { studentId: id, fullName: p.fullName ?? '', email: p.email ?? '', ...summary, ratingLabel: TESTER_RATING_LABEL[summary.rating] };
    });
    rows.sort((a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1) || b.labsCompleted - a.labsCompleted || a.fullName.localeCompare(b.fullName, 'vi'));
    return { classId, labsTotal, students: rows.map((r, i) => ({ rank: r.avgScore === null ? null : i + 1, ...r })) };
  }

  /** Hồ sơ bài làm của một học viên: từng Lab, điểm từng tiêu chí rubric và nhận xét của giảng viên. */
  async studentDetail(user: JwtPayload, classId: string, studentId: string) {
    await this.loadClass(user, classId);
    if (!isValidObjectId(studentId)) throw new NotFoundException('Không tìm thấy học viên.');
    const student = await this.users.findOne({ _id: studentId, role: 'STUDENT', ageGroup: 'CAREER_ADULT' }).select('fullName email').lean<{ _id: unknown; fullName?: string; email?: string }>();
    if (!student) throw new NotFoundException('Học viên không thuộc lớp này.');
    const [subs, labs] = await Promise.all([
      this.submissions.find({ userId: studentId }).sort({ createdAt: -1 }).lean<Array<Record<string, any>>>(),
      this.labs.find({}).select('labCode title').lean<Array<{ _id: unknown; labCode: string; title: string }>>(),
    ]);
    const labById = new Map(labs.map((l) => [asId(l._id), l]));
    const labsTotal = labs.length;
    const items = subs.map((s) => {
      const lab = labById.get(asId(s.labId));
      const byKey = new Map<string, number>(((s.rubricGrades ?? []) as Array<{ key: string; score: number }>).map((g) => [g.key, g.score]));
      return {
        id: asId(s._id),
        lab: { labCode: lab?.labCode ?? '', title: lab?.title ?? '' },
        status: s.invalidated ? 'INVALIDATED' : s.status,
        submittedAt: s.createdAt,
        total: s.status === 'REVIEWED' ? submissionTotal(s.rubricGrades) : null,
        // Bài chấm theo rubric 10 điểm đời đầu không có điểm theo 3 tiêu chí chuẩn: chỉ hiện tổng đã quy đổi.
        criteria: s.status === 'REVIEWED' && byKey.size > 0 && TESTER_RUBRIC.some((c) => byKey.has(c.key)) ? TESTER_RUBRIC.map((c) => ({ key: c.key, label: c.label, max: c.maxScore, score: byKey.get(c.key) ?? null })) : [],
        feedback: s.status === 'REVIEWED' ? (s.reviewerNotes ?? '') : '',
        isFinalized: s.isFinalized === true,
        testCaseCount: s.formData?.testCases?.length ?? 0,
        bugReportCount: s.formData?.bugReports?.length ?? 0,
      };
    });
    items.sort((a, b) => (a.lab.labCode || '').localeCompare(b.lab.labCode || '') || String(b.submittedAt).localeCompare(String(a.submittedAt)));
    const summary = summarizeTesterStudent(subs.map((s) => ({ labId: asId(s.labId), status: s.status, invalidated: s.invalidated, rubricGrades: s.rubricGrades })), labsTotal);
    return { student: { id: asId(student._id), fullName: student.fullName ?? '', email: student.email ?? '' }, summary: { ...summary, ratingLabel: TESTER_RATING_LABEL[summary.rating] }, submissions: items };
  }

  /**
   * Giảng viên ĐỌC một bài nộp của học viên khóa (test case, bug report, điểm rubric, nhận xét). Đây là đường đọc dành riêng cho TEACHER/ADMIN:
   * giảng viên phải đang phụ trách một lớp Tester QA, bài phải của học viên Career Adult. Không dùng endpoint nộp bài của học viên.
   */
  async submissionDetail(user: JwtPayload, submissionId: string) {
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') throw new ForbiddenException({ code: 'E403_FORBIDDEN', message: 'Chỉ giảng viên được xem bài nộp của học viên.' });
    if (user.role === 'TEACHER') {
      const owned = await this.classes.exists({ courseKey: 'tester-qa', $or: [{ teacherId: user.sub }, { teacherIds: user.sub }] });
      if (!owned) throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bạn không phụ trách lớp Tester QA nào.' });
    }
    if (!isValidObjectId(submissionId)) throw new NotFoundException('Không tìm thấy bài nộp.');
    const s = await this.submissions.findById(submissionId).lean<Record<string, any>>();
    if (!s) throw new NotFoundException('Không tìm thấy bài nộp.');
    const [student, lab] = await Promise.all([
      this.users.findOne({ _id: s.userId, role: 'STUDENT', ageGroup: 'CAREER_ADULT' }).select('fullName email').lean<{ _id: unknown; fullName?: string; email?: string }>(),
      this.labs.findById(s.labId).select('labCode title').lean<{ labCode: string; title: string }>(),
    ]);
    if (!student) throw new ForbiddenException({ code: 'E403_CLASS_NOT_OWNED', message: 'Bài nộp này không thuộc học viên khóa Tester QA.' });
    const byKey = new Map<string, number>(((s.rubricGrades ?? []) as Array<{ key: string; score: number }>).map((g) => [g.key, g.score]));
    const reviewed = s.status === 'REVIEWED';
    return {
      id: asId(s._id),
      status: s.invalidated ? 'INVALIDATED' : s.status,
      submittedAt: s.createdAt,
      lab: { labCode: lab?.labCode ?? '', title: lab?.title ?? '' },
      student: { id: asId(student._id), fullName: student.fullName ?? '', email: student.email ?? '' },
      formData: s.formData ?? null,
      autoCheckResults: s.autoCheckResults ?? [],
      total: reviewed ? submissionTotal(s.rubricGrades) : null,
      criteria: reviewed ? TESTER_RUBRIC.map((c) => ({ key: c.key, label: c.label, max: c.maxScore, score: byKey.get(c.key) ?? null })) : [],
      feedback: reviewed ? (s.reviewerNotes ?? '') : '',
      isFinalized: s.isFinalized === true,
    };
  }

  /** Hàng chờ chấm của riêng lớp: bài Chờ chấm của học viên khóa, kèm test case, bug report và rubric chuẩn. */
  async queue(user: JwtPayload, classId: string) {
    await this.loadClass(user, classId);
    const people = await this.roster();
    const ids = people.map((p) => asId(p._id));
    if (!ids.length) return [];
    const subs = await this.submissions.find({ userId: { $in: ids }, status: 'SUBMITTED', invalidated: { $ne: true } }).sort({ createdAt: 1 }).limit(200).lean<Array<Record<string, any>>>();
    const labs = await this.labs.find({ _id: { $in: [...new Set(subs.map((s) => asId(s.labId)))] } }).select('labCode title').lean<Array<{ _id: unknown; labCode: string; title: string }>>();
    const labById = new Map(labs.map((l) => [asId(l._id), l]));
    const nameById = new Map(people.map((p) => [asId(p._id), p]));
    return subs.map((s) => {
      const lab = labById.get(asId(s.labId));
      const u = nameById.get(s.userId);
      return {
        id: asId(s._id),
        status: s.status,
        submittedAt: s.createdAt,
        kind: s.kind,
        lab: { labCode: lab?.labCode ?? '', title: lab?.title ?? '', rubricCriteria: TESTER_RUBRIC },
        student: { id: s.userId, fullName: u?.fullName ?? '', email: u?.email ?? '' },
        formData: s.formData ?? null,
        autoCheckResults: s.autoCheckResults ?? [],
      };
    });
  }
}
