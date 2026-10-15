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
    const days: Array<{
      date: string;
      dayNumber: number;
      totalCount: number;
      doneCount: number;
      pendingCount: number;
      assignments: ReturnType<ClassAssignmentsService['toRow']>[];
    }> = [];
    for (const row of rows) {
      const key = vnDayKey(new Date(row.startAt));
      let day = days.find((d) => d.date === key);
      if (!day) {
        day = { date: key, dayNumber: days.length + 1, totalCount: 0, doneCount: 0, pendingCount: 0, assignments: [] };
        days.push(day);
      }
      day.assignments.push(row);
      day.totalCount++;
      if (row.done) day.doneCount++;
      else day.pendingCount++;
    }

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
    if (user.role !== 'ADMIN' && cls.teacherId !== user.sub) {
      throw new ForbiddenException('Bạn chỉ quản lý được bài tập của lớp do mình phụ trách.');
    }
    return cls;
  }

  async listForTeacher(classId: string, user: JwtPayload) {
    const cls = await this.ownedClass(classId, user);
    const list = await this.assignments.find({ classId: asId(cls._id) }).sort({ startAt: 1, order: 1 }).lean();
    return list.map((a) => ({ ...a, id: asId(a._id) }));
  }

  async create(classId: string, dto: CreateAssignmentDto, user: JwtPayload) {
    const cls = await this.ownedClass(classId, user);
    const input = validateAssignmentInput(dto);
    if ((await this.assignments.countDocuments({ classId: asId(cls._id) })) >= MAX_ASSIGNMENTS_PER_CLASS) {
      throw new BadRequestException(`Mỗi lớp tối đa ${MAX_ASSIGNMENTS_PER_CLASS} bài tập.`);
    }
    if (input.type === 'CODING') {
      const ex = await this.exercises.findOne({ slug: input.exerciseSlug }).select('type resource_id title').lean();
      if (!ex || ex.type !== 'CODE_TEXT' || ex.resource_id) {
        throw new BadRequestException(`Không tìm thấy bài code Python "${input.exerciseSlug}".`);
      }
    } else {
      const ids = input.questionIds ?? [];
      const found = await this.questions.countDocuments({ _id: { $in: ids.filter(isValidObjectId) } });
      if (found !== ids.length) throw new BadRequestException('Có câu hỏi không còn trong ngân hàng câu hỏi.');
    }
    const order = (await this.assignments.countDocuments({ classId: asId(cls._id) })) + 1;
    const created = await this.assignments.create({ ...input, classId: asId(cls._id), order, createdBy: user.sub });
    return { ...created.toObject(), id: asId(created._id) };
  }

  async remove(classId: string, assignmentId: string, user: JwtPayload) {
    const cls = await this.ownedClass(classId, user);
    if (!isValidObjectId(assignmentId)) throw new NotFoundException('Không tìm thấy bài tập.');
    const del = await this.assignments.deleteOne({ _id: assignmentId, classId: asId(cls._id) });
    if (del.deletedCount === 0) throw new NotFoundException('Không tìm thấy bài tập.');
    return { deleted: true };
  }
}
