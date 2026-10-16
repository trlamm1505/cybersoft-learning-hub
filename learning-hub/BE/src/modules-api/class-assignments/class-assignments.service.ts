import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model, Types } from 'mongoose';
import { ClassAssignment, ClassAssignmentDocument } from '../../modules-system/database/schemas/class-assignment.schema';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import { Question, QuestionDocument } from '../../modules-system/database/schemas/question.schema';
import { QuizAttempt, QuizAttemptDocument } from '../../modules-system/database/schemas/quiz-attempt.schema';
import { Submission, SubmissionDocument } from '../../modules-system/database/schemas/submission.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import {
  assignmentState,
  isOpenForWork,
  rankMembers,
  scoreCoding,
  scoreQuiz,
  vnDayKey,
  type AssignmentState,
  type MemberTotals,
} from './class-scoring';
import { CreateAssignmentDto, validateAssignmentInput } from './dto/create-assignment.dto';
import { certificateCode, summarizeEnrollment } from './class-completion';
import { bandOfClass, bandOfExercise, exerciseBandFilter, exerciseFitsBand, normalizeBankBand, questionBandFilter } from '../exercise/exercise-matrix';
import { assignmentWindow, escapeRegex, groupByDay, normalizeDifficulty, normalizePage, toPaged, type PageInput } from './assignment-days';
import { isCareerCourseClass } from '../assessment/domain/tester-progress';

export interface AssignmentResult {
  done: boolean;
  attempts: number;
  wrongCount: number;
  score: number;
  potentialScore: number;
  completedAt?: Date;
}

const EMPTY: AssignmentResult = { done: false, attempts: 0, wrongCount: 0, score: 0, potentialScore: 0 };
const MAX_ASSIGNMENTS_PER_CLASS = 200;

const asId = (v: unknown): string => String(v);

@Injectable()
export class ClassAssignmentsService {
  constructor(
    @InjectModel(Classroom.name) private readonly classes: Model<ClassroomDocument>,
    @InjectModel(ClassAssignment.name) private readonly assignments: Model<ClassAssignmentDocument>,
    @InjectModel(Submission.name) private readonly submissions: Model<SubmissionDocument>,
    @InjectModel(QuizAttempt.name) private readonly attempts: Model<QuizAttemptDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Exercise.name) private readonly exercises: Model<ExerciseDocument>,
    @InjectModel(Question.name) private readonly questions: Model<QuestionDocument>,
  ) {}

  /** Lớp mà học viên là thành viên (chưa lưu trữ); không thì 404 (không lộ lớp có tồn tại hay không). */
  private async memberClass(classId: string, user: JwtPayload) {
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp học.');
    const cls = await this.classes
      .findOne({ _id: classId, studentIds: user.sub, archived: { $ne: true } })
      .lean();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học của bạn.');
    return cls;
  }

  /** Kết quả từng học viên ở từng bài: Map<assignmentId, Map<userId, AssignmentResult>>. */
  private async results(list: Array<ClassAssignment & { _id: unknown }>, memberIds: string[]) {
    const out = new Map<string, Map<string, AssignmentResult>>();
    if (list.length === 0 || memberIds.length === 0) return out;
    const ids = list.map((a) => asId(a._id));
    const byId = new Map(list.map((a) => [asId(a._id), a]));

    const [subs, quizAttempts] = await Promise.all([
      this.submissions
        .find({ assignmentId: { $in: ids }, userId: { $in: memberIds } })
        .select('assignmentId userId status createdAt')
        .lean(),
      this.attempts
        .find({
          assignmentId: { $in: ids },
          userId: { $in: memberIds.filter(isValidObjectId).map((m) => new Types.ObjectId(m)) },
          status: { $in: ['SUBMITTED', 'GRADED'] },
        })
        .select('assignmentId userId score maxScore submittedAt')
        .lean(),
    ]);

    const group = new Map<string, Array<{ status: string; createdAt: Date }>>();
    for (const s of subs) {
      const key = `${s.assignmentId}|${s.userId}`;
      const arr = group.get(key) ?? [];
      arr.push({ status: s.status, createdAt: new Date((s as unknown as { createdAt: Date }).createdAt) });
      group.set(key, arr);
    }
    const quizByKey = new Map<string, { score: number; maxScore: number; submittedAt?: Date }>();
    for (const q of quizAttempts) quizByKey.set(`${q.assignmentId}|${asId(q.userId)}`, q as never);

    for (const a of list) {
      const id = asId(a._id);
      const perUser = new Map<string, AssignmentResult>();
      for (const uid of memberIds) {
        if (a.type === 'CODING') {
          const r = scoreCoding(group.get(`${id}|${uid}`) ?? [], a.maxPoints);
          perUser.set(uid, r);
        } else {
          const r = scoreQuiz(quizByKey.get(`${id}|${uid}`), a.maxPoints);
          perUser.set(uid, {
            done: r.done,
            attempts: r.done ? 1 : 0,
            wrongCount: 0,
            score: r.score,
            potentialScore: a.maxPoints,
            completedAt: r.completedAt,
          });
        }
      }
      out.set(id, perUser);
    }
    void byId;
    return out;
  }

  private totals(
    list: Array<ClassAssignment & { _id: unknown }>,
    res: Map<string, Map<string, AssignmentResult>>,
    members: Array<{ id: string; name: string }>,
  ): MemberTotals[] {
    return members.map((m) => {
      let points = 0;
      let doneCount = 0;
      let last: Date | null = null;
      for (const a of list) {
        const r = res.get(asId(a._id))?.get(m.id) ?? EMPTY;
        if (r.done) {
          doneCount++;
          points += r.score;
          if (r.completedAt && (!last || r.completedAt > last)) last = r.completedAt;
        }
      }
      return { userId: m.id, name: m.name, points: Math.round(points * 10) / 10, doneCount, lastScoredAt: last };
    });
  }

  private async memberNames(ids: string[]): Promise<Array<{ id: string; name: string; avatar?: string }>> {
    const valid = ids.filter(isValidObjectId);
    const docs = valid.length
      ? await this.users.find({ _id: { $in: valid } }).select('fullName avatar').lean()
      : [];
    const byId = new Map(docs.map((d) => [asId(d._id), d]));
    return ids.map((id) => {
      const d = byId.get(id);
      return { id, name: d?.fullName || 'Học viên', avatar: d?.avatar };
    });
  }

  private toRow(
    a: ClassAssignment & { _id: unknown },
    r: AssignmentResult,
    now: Date,
  ) {
    const state: AssignmentState = assignmentState(a, r, now);
    return {
      id: asId(a._id),
      type: a.type,
      title: a.title,
      exerciseSlug: a.exerciseSlug ?? null,
      questionCount: a.questionIds?.length ?? null,
      maxPoints: a.maxPoints,
      startAt: a.startAt,
      dueAt: a.dueAt,
      state,
      /** Khóa = chưa mở hoặc đã hết hạn mà chưa hoàn thành: không làm/nộp được. */
      locked: !isOpenForWork(state) && state !== 'DONE',
      done: r.done,
      score: r.done ? r.score : null,
      wrongCount: r.wrongCount,
      attempts: r.attempts,
      /** Điểm sẽ nhận nếu AC ngay (mỗi lần nộp sai trừ 1 điểm). */
      potentialScore: r.done ? r.score : r.potentialScore,
      completedAt: r.completedAt ?? null,
    };
  }

  /** Trang "Lớp học của tôi": thông tin lớp, giảng viên, tiến độ chung, bài giao nhóm theo ngày, hạng của mình. */
  async overview(classId: string, user: JwtPayload, now: Date = new Date()) {
    const cls = await this.memberClass(classId, user);
    const list = (await this.assignments.find({ classId: asId(cls._id) }).sort({ startAt: 1, order: 1 }).lean()) as Array<
      ClassAssignment & { _id: unknown }
    >;
    const memberIds = cls.studentIds ?? [];
    const res = await this.results(list, memberIds);

    const teacher =
      cls.teacherId && isValidObjectId(cls.teacherId)
        ? await this.users.findById(cls.teacherId).select('fullName email avatar').lean()
        : null;

    const rows = list.map((a) => this.toRow(a, res.get(asId(a._id))?.get(user.sub) ?? EMPTY, now));
    // Cùng cách gom ngày với trang Giảng viên (groupByDay) nên Ngày n của hai bên luôn trùng nhau.
    const days = groupByDay(rows).map((d) => ({
      ...d,
      totalCount: d.assignments.length,
      doneCount: d.assignments.filter((a) => a.done).length,
      pendingCount: d.assignments.filter((a) => !a.done).length,
    }));

    const names = memberIds.map((id) => ({ id, name: '' }));
    const ranked = rankMembers(this.totals(list, res, names));
    const me = ranked.find((m) => m.userId === user.sub);
    const doneTotal = rows.filter((r) => r.done).length;

    return {
      class: {
        id: asId(cls._id),
        name: cls.name,
        code: cls.code ?? null,
        description: cls.description ?? '',
        memberCount: memberIds.length,
        teacher: teacher
          ? { name: teacher.fullName ?? '', email: teacher.email ?? '', avatar: teacher.avatar ?? null }
          : null,
      },
      progress: {
        done: doneTotal,
        total: rows.length,
        percent: rows.length ? Math.round((doneTotal / rows.length) * 100) : 0,
        points: me?.points ?? 0,
        maxPoints: list.reduce((s, a) => s + a.maxPoints, 0),
      },
      myRank: me ? { rank: me.rank, of: ranked.length } : null,
      days,
    };
  }

  /** Bảng xếp hạng thành viên: tổng điểm giảm dần, bằng điểm thì nộp sớm hơn xếp trước. Chỉ thành viên lớp xem được. */
  async leaderboard(classId: string, user: JwtPayload) {
    const cls = await this.memberClass(classId, user);
    const list = (await this.assignments.find({ classId: asId(cls._id) }).lean()) as Array<ClassAssignment & { _id: unknown }>;
    const memberIds = cls.studentIds ?? [];
    const [res, members] = await Promise.all([this.results(list, memberIds), this.memberNames(memberIds)]);
    const ranked = rankMembers(this.totals(list, res, members));
    return {
      classId: asId(cls._id),
      rows: ranked.map((m) => ({
        rank: m.rank,
        userId: m.userId,
        name: m.name,
        avatar: members.find((x) => x.id === m.userId)?.avatar ?? null,
        points: m.points,
        doneCount: m.doneCount,
        lastScoredAt: m.lastScoredAt ?? null,
        isMe: m.userId === user.sub,
      })),
    };
  }

  /** Nạp bài + kiểm tra học viên thuộc lớp của bài; trả bài, kết quả của học viên và trạng thái. */
  private async loadForStudent(assignmentId: string, user: JwtPayload, now: Date) {
    if (!isValidObjectId(assignmentId)) throw new NotFoundException('Không tìm thấy bài tập của lớp.');
    const a = (await this.assignments.findById(assignmentId).lean()) as (ClassAssignment & { _id: unknown }) | null;
    if (!a) throw new NotFoundException('Không tìm thấy bài tập của lớp.');
    const cls = await this.memberClass(a.classId, user);
    const res = await this.results([a], [user.sub]);
    const r = res.get(asId(a._id))?.get(user.sub) ?? EMPTY;
    return { a, cls, r, state: assignmentState(a, r, now) };
  }

  /**
   * Lớp/khóa học đã tham gia của học viên (trang Hồ sơ): tên lớp, giảng viên, trạng thái Đang học / Đã hoàn thành
   * và, khi hoàn thành, dữ liệu chứng chỉ (điểm tổng kết, xếp loại, ngày hoàn thành, mã chứng chỉ).
   * Chỉ tính các lớp mà chính học viên là thành viên.
   */
  async myEnrollments(user: JwtPayload, now: Date = new Date()) {
    const classes = await this.classes.find({ studentIds: user.sub }).sort({ createdAt: -1 }).lean();
    if (classes.length === 0) return [];
    const me = await this.users.findById(user.sub).select('fullName').lean();
    const studentName = me?.fullName || 'Học viên';
    const teacherIds = [...new Set(classes.map((c) => c.teacherId).filter((t) => t && isValidObjectId(t)))];
    const teachers = teacherIds.length ? await this.users.find({ _id: { $in: teacherIds } }).select('fullName').lean() : [];
    const teacherName = new Map(teachers.map((t) => [asId(t._id), t.fullName]));

    const out = [];
    for (const cls of classes) {
      const classId = asId(cls._id);
      const list = (await this.assignments.find({ classId }).lean()) as Array<ClassAssignment & { _id: unknown }>;
      const res = await this.results(list, [user.sub]);
      const summary = summarizeEnrollment(
        list.map((a) => {
          const r = res.get(asId(a._id))?.get(user.sub) ?? EMPTY;
          return { maxPoints: a.maxPoints, dueAt: a.dueAt, done: r.done, score: r.score, completedAt: r.completedAt ?? null };
        }),
        now,
      );
      const completed = summary.status === 'COMPLETED' && summary.completedAt && summary.grade;
      out.push({
        classId,
        className: cls.name,
        classCode: cls.code ?? null,
        teacherName: teacherName.get(cls.teacherId) ?? null,
        status: summary.status,
        totalAssignments: summary.totalAssignments,
        doneCount: summary.doneCount,
        earned: summary.earned,
        max: summary.max,
        percent: summary.percent,
        certificate: completed
          ? {
              studentName,
              className: cls.name,
              teacherName: teacherName.get(cls.teacherId) ?? null,
              finalScore: summary.percent,
              earned: summary.earned,
              max: summary.max,
              grade: summary.grade,
              completedAt: summary.completedAt,
              code: certificateCode(cls.code ?? '', classId, user.sub, summary.completedAt as Date),
            }
          : null,
      });
    }
    return out;
  }

  /** Thông tin một bài (cho banner khi làm bài từ trang lớp): hạn chót, điểm, trạng thái khóa. */
  async myAssignment(assignmentId: string, user: JwtPayload, now: Date = new Date()) {
    const { a, cls, r } = await this.loadForStudent(assignmentId, user, now);
    return { ...this.toRow(a, r, now), classId: asId(cls._id), className: cls.name };
  }

  /** Chặn nộp bài code vào bài lớp khi: sai bài, chưa mở, đã hết hạn (khóa) hoặc đã hoàn thành. */
  async assertCanSubmitCoding(assignmentId: string, exerciseSlug: string, user: JwtPayload, now: Date = new Date()) {
    const { a, state } = await this.loadForStudent(assignmentId, user, now);
    if (a.type !== 'CODING' || a.exerciseSlug !== exerciseSlug) {
      throw new BadRequestException('Bài nộp không khớp với bài tập được giao.');
    }
    if (state === 'DONE') throw new ConflictException('Bạn đã hoàn thành bài tập này rồi.');
    if (state === 'EXPIRED') throw new ForbiddenException('Bài tập đã hết hạn - đã khóa, không thể nộp bài nữa.');
    if (state === 'NOT_OPEN') throw new ForbiddenException('Bài tập chưa đến giờ mở.');
    return a;
  }

  /** Chặn vào làm trắc nghiệm của lớp khi: sai loại, chưa mở, hết hạn hoặc đã làm xong (chỉ một lượt thi). */
  async assertCanStartQuiz(assignmentId: string, user: JwtPayload, now: Date = new Date()) {
    const { a, state } = await this.loadForStudent(assignmentId, user, now);
    if (a.type !== 'QUIZ') throw new BadRequestException('Đây không phải bài trắc nghiệm.');
    if (state === 'DONE') throw new ConflictException('Bạn đã làm bài trắc nghiệm này rồi (chỉ được làm một lượt).');
    if (state === 'EXPIRED') throw new ForbiddenException('Bài tập đã hết hạn - đã khóa, không thể làm bài nữa.');
    if (state === 'NOT_OPEN') throw new ForbiddenException('Bài tập chưa đến giờ mở.');
    return a;
  }

  // ----------------------------- Giảng viên -----------------------------

  private async ownedClass(classId: string, user: JwtPayload) {
    if (!isValidObjectId(classId)) throw new NotFoundException('Không tìm thấy lớp học.');
    const cls = await this.classes.findById(classId).lean();
    if (!cls) throw new NotFoundException('Không tìm thấy lớp học.');
    if (user.role !== 'ADMIN' && cls.teacherId !== user.sub && !(cls as { teacherIds?: string[] }).teacherIds?.includes(user.sub)) {
      throw new ForbiddenException('Bạn chỉ quản lý được bài tập của lớp do mình phụ trách.');
    }
    return cls;
  }

  async listForTeacher(classId: string, user: JwtPayload) {
    const cls = await this.ownedClass(classId, user);
    const list = await this.assignments.find({ classId: asId(cls._id) }).sort({ startAt: 1, order: 1 }).lean();
    return list.map((a) => ({ ...a, id: asId(a._id) }));
  }

  /**
   * Bài của lớp theo NGÀY (Ngày 1, 2, 3...), cùng cấu trúc học viên thấy ở "Lớp học của tôi": mỗi bài kèm loại (Trắc nghiệm / Code), hạn nộp,
   * trạng thái mở/hết hạn và tiến độ (số học viên đã hoàn thành trên sĩ số). Nguồn duy nhất: collection class_assignments.
   */
  async daysForTeacher(classId: string, user: JwtPayload, now: Date = new Date()) {
    const cls = await this.ownedClass(classId, user);
    const list = (await this.assignments.find({ classId: asId(cls._id) }).sort({ startAt: 1, order: 1 }).lean()) as Array<ClassAssignment & { _id: unknown }>;
    const memberIds = cls.studentIds ?? [];
    const res = await this.results(list, memberIds);
    const rows = list.map((a) => ({
      id: asId(a._id),
      type: a.type,
      title: a.title,
      exerciseSlug: a.exerciseSlug ?? null,
      questionCount: a.questionIds?.length ?? null,
      maxPoints: a.maxPoints,
      startAt: a.startAt,
      dueAt: a.dueAt,
      window: assignmentWindow(new Date(a.startAt), new Date(a.dueAt), now),
      doneCount: memberIds.filter((m) => res.get(asId(a._id))?.get(m)?.done).length,
      memberCount: memberIds.length,
    }));
    return { classId: asId(cls._id), archived: cls.archived === true, band: bandOfClass((cls as { ageGroup?: string }).ageGroup), days: groupByDay(rows) };
  }

  /** Ngân hàng bài code (Python) để gán vào ngày học: tìm theo tên/slug, lọc độ khó, phân trang (mặc định 10 bài/trang). */
  async catalogExercises(user: JwtPayload, q: { q?: string; difficulty?: string; band?: string } & PageInput) {
    this.assertStaff(user);
    const { page, pageSize } = normalizePage(q);
    const term = (q.q ?? '').trim().slice(0, 60);
    const difficulty = normalizeDifficulty(q.difficulty);
    const band = normalizeBankBand(q.band);
    const rx = { $regex: escapeRegex(term), $options: 'i' };
    const filter: Record<string, unknown> = { type: 'CODE_TEXT', resource_id: { $exists: false } };
    const and: Record<string, unknown>[] = [];
    if (term) and.push({ $or: [{ title: rx }, { slug: rx }, { tags: rx }] });
    if (band) and.push(exerciseBandFilter(band));
    if (and.length) filter.$and = and;
    if (difficulty) filter.difficulty = difficulty;
    const [total, docs] = await Promise.all([
      this.exercises.countDocuments(filter),
      this.exercises.find(filter).select('slug title difficulty tags points targetGroup gradeBand bankBand').sort({ title: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean<Array<{ slug: string; title: string; difficulty?: string; tags?: string[]; points?: number; targetGroup?: string; gradeBand?: string; bankBand?: string }>>(),
    ]);
    return toPaged(docs.map((e) => ({ slug: e.slug, title: e.title, band: bandOfExercise(e), difficulty: e.difficulty ?? null, tags: e.tags ?? [], points: e.points ?? null })), total, page, pageSize);
  }

  /** Ngân hàng câu trắc nghiệm: tìm theo nội dung/chủ đề, lọc độ khó, phân trang. */
  async catalogQuestions(user: JwtPayload, q: { q?: string; difficulty?: string; band?: string } & PageInput) {
    this.assertStaff(user);
    const { page, pageSize } = normalizePage(q);
    const term = (q.q ?? '').trim().slice(0, 60);
    const difficulty = normalizeDifficulty(q.difficulty);
    const rx = { $regex: escapeRegex(term), $options: 'i' };
    const filter: Record<string, unknown> = {};
    const band = normalizeBankBand(q.band);
    const and: Record<string, unknown>[] = [];
    if (term) and.push({ $or: [{ content: rx }, { category: rx }, { tags: rx }] });
    if (band) and.push(questionBandFilter(band));
    if (and.length) filter.$and = and;
    if (difficulty) filter.difficulty = difficulty;
    const [total, docs] = await Promise.all([
      this.questions.countDocuments(filter),
      this.questions.find(filter).select('content difficulty category tags').sort({ _id: 1 }).skip((page - 1) * pageSize).limit(pageSize).lean<Array<{ _id: unknown; content: string; difficulty?: string; category?: string; tags?: string[] }>>(),
    ]);
    return toPaged(docs.map((d) => ({ id: asId(d._id), content: d.content, difficulty: d.difficulty ?? null, category: d.category ?? null, tags: d.tags ?? [] })), total, page, pageSize);
  }

  private assertStaff(user: JwtPayload) {
    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') throw new ForbiddenException('Chỉ giảng viên được xem ngân hàng đề.');
  }

  async create(classId: string, dto: CreateAssignmentDto, user: JwtPayload) {
    const cls = await this.ownedClass(classId, user);
    // Lớp Career (Tester QA, Data SQL, AI Prompt) học theo Lab cố định: không giao bài tập lẻ.
    if (isCareerCourseClass(cls)) {
      throw new BadRequestException({ code: 'E400_CAREER_CLASS_NO_ASSIGNMENT', message: 'Lớp khóa Career học theo các Lab cố định, không giao bài tập riêng.' });
    }
    if (cls.archived === true) {
      throw new BadRequestException({ code: 'E400_CLASS_ARCHIVED', message: 'Lớp đã lưu trữ, không thể giao thêm bài.' });
    }
    const input = validateAssignmentInput(dto);
    if ((await this.assignments.countDocuments({ classId: asId(cls._id) })) >= MAX_ASSIGNMENTS_PER_CLASS) {
      throw new BadRequestException(`Mỗi lớp tối đa ${MAX_ASSIGNMENTS_PER_CLASS} bài tập.`);
    }
    if (input.type === 'CODING') {
      const ex = await this.exercises.findOne({ slug: input.exerciseSlug }).select('type resource_id title targetGroup gradeBand bankBand').lean<{ type?: string; resource_id?: unknown; targetGroup?: string; gradeBand?: string }>();
      if (!ex || ex.type !== 'CODE_TEXT' || ex.resource_id) {
        throw new BadRequestException(`Không tìm thấy bài code Python "${input.exerciseSlug}".`);
      }
      const classBand = bandOfClass((cls as { ageGroup?: string }).ageGroup);
      if (classBand && !exerciseFitsBand(ex, classBand)) {
        throw new BadRequestException({ code: 'E400_BAND_MISMATCH', message: `Bài này thuộc khối khác, không gán được cho lớp khối ${classBand}.` });
      }
    } else {
      const ids = input.questionIds ?? [];
      const found = await this.questions.countDocuments({ _id: { $in: ids.filter(isValidObjectId) } });
      if (found !== ids.length) throw new BadRequestException('Có câu hỏi không còn trong ngân hàng câu hỏi.');
    }
    const order = (await this.assignments.countDocuments({ classId: asId(cls._id) })) + 1;
    const created = await this.assignments.create({ ...input, classId: asId(cls._id), order, createdBy: user.sub });
    // Bài code được giao thì cũng nằm trong danh sách bài theo dõi của lớp (thống kê tiến độ đọc exerciseSlugs).
    if (input.type === 'CODING' && input.exerciseSlug) await this.classes.updateOne({ _id: cls._id }, { $addToSet: { exerciseSlugs: input.exerciseSlug } });
    return { ...created.toObject(), id: asId(created._id) };
  }

  async remove(classId: string, assignmentId: string, user: JwtPayload) {
    const cls = await this.ownedClass(classId, user);
    if (!isValidObjectId(assignmentId)) throw new NotFoundException('Không tìm thấy bài tập.');
    if (cls.archived === true) {
      throw new BadRequestException({ code: 'E400_CLASS_ARCHIVED', message: 'Lớp đã lưu trữ, không thể xóa bài.' });
    }
    const target = await this.assignments.findOne({ _id: assignmentId, classId: asId(cls._id) }).select('type exerciseSlug').lean<{ type: string; exerciseSlug?: string }>();
    const del = await this.assignments.deleteOne({ _id: assignmentId, classId: asId(cls._id) });
    if (del.deletedCount === 0) throw new NotFoundException('Không tìm thấy bài tập.');
    // Gỡ bài code khỏi danh sách theo dõi nếu không còn bài giao nào dùng nó.
    if (target?.type === 'CODING' && target.exerciseSlug && (await this.assignments.countDocuments({ classId: asId(cls._id), exerciseSlug: target.exerciseSlug })) === 0) {
      await this.classes.updateOne({ _id: cls._id }, { $pull: { exerciseSlugs: target.exerciseSlug } });
    }
    return { deleted: true };
  }
}
