import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import {
  Contest,
  ContestDocument,
  ContestProblem,
} from '../../modules-system/database/schemas/contest.schema';
import { User, UserDocument } from '../../modules-system/database/schemas/user.schema';
import {
  Lesson,
  LessonDocument,
} from '../../modules-system/database/schemas/lesson.schema';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  Question,
  QuestionDocument,
} from '../../modules-system/database/schemas/question.schema';
import {
  ContestSubmission,
  ContestSubmissionDocument,
} from '../../modules-system/database/schemas/contest-submission.schema';
import {
  ContestAttempt,
  ContestAttemptDocument,
} from '../../modules-system/database/schemas/contest-attempt.schema';
import { isStaff } from '../../common/auth/roles';
import { ContestProblemDto, CreateContestDto } from './dto/create-contest.dto';
import { UpdateContestDto } from './dto/update-contest.dto';

import {
  getInitialContests,
  resolveSeedProblems,
} from '../../data/initial-contests';

export interface ContestViewer {
  sub: string;
  role: string;
}

export const CONTEST_LIMITS = {
  titleMax: 200,
  descriptionMax: 5000,
  pointsMin: 1,
  pointsMax: 1000,
  maxProblems: 30,
  maxDurationMinutes: 14_400,
} as const;

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

@Injectable()
export class ContestService implements OnModuleInit {
  constructor(
    @InjectModel(Contest.name)
    private readonly contestModel: Model<ContestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Lesson.name)
    private readonly lessonModel: Model<LessonDocument>,
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Question.name)
    private readonly questionModel: Model<QuestionDocument>,
    @InjectModel(ContestSubmission.name)
    private readonly contestSubmissionModel: Model<ContestSubmissionDocument>,
    @InjectModel(ContestAttempt.name)
    private readonly contestAttemptModel: Model<ContestAttemptDocument>,
  ) {}

  async onModuleInit() {
    await this.seedSampleContests();
  }

  private async seedSampleContests() {
    try {
      const count = await this.contestModel.countDocuments();
      if (count === 0) {
        const sampleContests = await resolveSeedProblems(
          getInitialContests(),
          async (category, limit) =>
            (
              await this.questionModel
                .find({ category })
                .select('_id')
                .limit(limit)
                .lean()
            ).map((q: any) => String(q._id)),
        );
        await this.contestModel.insertMany(sampleContests);
        console.log(
          `✅ Seeded ${sampleContests.length} sample contests into MongoDB for Contest Module`,
        );
      }
    } catch (error) {
      console.warn('Could not seed sample contests:', error.message);
    }
  }

  // Giống AuthoringService.SHARED_AUTHOR_ID — contest seed sẵn
  // (initial-contests.ts) đều mang authorId 'teacher-1', coi đây là tài
  // nguyên dùng chung, không phải sở hữu riêng của một giáo viên cụ thể.
  private static readonly SHARED_AUTHOR_ID = 'teacher-1';

  /**
   * Chặn TEACHER sửa/xoá contest KHÔNG do chính họ tạo và KHÔNG phải tài
   * nguyên dùng chung — vá lỗ hổng IDOR "giáo viên A đoán/biết ID cuộc thi
   * của giáo viên B là sửa/xoá được ngay" (updateContest/deleteContest
   * trước đây không so sánh authorId). ADMIN bỏ qua kiểm tra này.
   */
  assertCanModify(
    contest: { authorId?: string },
    requester: { sub: string; role: string },
  ): void {
    if (requester.role === 'ADMIN') return;
    const owner = contest.authorId || ContestService.SHARED_AUTHOR_ID;
    if (owner === ContestService.SHARED_AUTHOR_ID) return;
    if (owner !== requester.sub) {
      throw new ForbiddenException(
        'Bạn không có quyền thao tác trên cuộc thi này — cuộc thi thuộc sở hữu của giáo viên khác.',
      );
    }
  }

  /** Tìm cuộc thi theo id/slug cho giảng viên, đã kiểm tra quyền sở hữu. */
  async getContestForStaff(
    id: string,
    requester: ContestViewer,
  ): Promise<ContestDocument> {
    const contest = await this.findByIdOrSlug(id);
    this.assertCanModify(contest, requester);
    return contest;
  }

  private async findByIdOrSlug(id: string): Promise<ContestDocument> {
    const contest = await this.contestModel
      .findOne({
        $or: [{ _id: OBJECT_ID_RE.test(id) ? id : null }, { slug: id }],
      })
      .exec();
    if (!contest) {
      throw new NotFoundException(
        `Không tìm thấy cuộc thi với ID hoặc slug: ${id}`,
      );
    }
    return contest;
  }

  /** Bản nháp chỉ giảng viên/quản trị viên thấy; người khác nhận 404 như thể không tồn tại. */
  async findVisible(
    id: string,
    viewer?: ContestViewer,
  ): Promise<ContestDocument> {
    const contest = await this.findByIdOrSlug(id);
    if (contest.status === 'draft' && !isStaff(viewer?.role)) {
      throw new NotFoundException(
        `Không tìm thấy cuộc thi với ID hoặc slug: ${id}`,
      );
    }
    return contest;
  }

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `contest-${Date.now()}`
    );
  }

  private computeStatus(
    startTime: Date,
    endTime: Date,
  ): {
    status: 'UPCOMING' | 'ONGOING' | 'ENDED';
    statusText: string;
  } {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) {
      return { status: 'UPCOMING', statusText: 'Sắp diễn ra' };
    }
    if (now > end) {
      return { status: 'ENDED', statusText: 'Đã kết thúc' };
    }
    return { status: 'ONGOING', statusText: 'Đang diễn ra' };
  }

  private parseWindow(start: unknown, end: unknown) {
    const startTime = new Date(start as string);
    const endTime = new Date(end as string);
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new BadRequestException(
        'Thời gian bắt đầu hoặc kết thúc không hợp lệ!',
      );
    }
    if (startTime >= endTime) {
      throw new BadRequestException(
        'Thời gian bắt đầu phải trước thời gian kết thúc!',
      );
    }
    return { startTime, endTime };
  }

  /** Thời lượng cá nhân: mặc định bằng cả khung giờ, không bao giờ dài hơn khung giờ. */
  private resolveDuration(
    requested: number | undefined,
    startTime: Date,
    endTime: Date,
  ): number {
    const windowMinutes = Math.max(
      1,
      Math.round((endTime.getTime() - startTime.getTime()) / 60000),
    );
    const wanted =
      typeof requested === 'number' && requested > 0
        ? Math.min(Math.floor(requested), CONTEST_LIMITS.maxDurationMinutes)
        : windowMinutes;
    return Math.min(wanted, windowMinutes);
  }

  private cleanText(value: unknown, max: number): string {
    return typeof value === 'string' ? value.trim().slice(0, max) : '';
  }

  /**
   * Chuẩn hóa danh sách đề: kiểm tra từng đề có thật, đúng loại, không trùng,
   * điểm hợp lệ. Khi `requireReady` (xuất bản) còn yêu cầu đề có test case /
   * câu hỏi có đáp án đúng để chấm được, tránh cuộc thi "chấm trống" cho điểm
   * tối đa.
   */
  async normalizeProblems(
    raw: ContestProblemDto[] | undefined,
    requireReady: boolean,
  ): Promise<ContestProblem[]> {
    const list = Array.isArray(raw) ? raw : [];
    if (list.length > CONTEST_LIMITS.maxProblems) {
      throw new BadRequestException(
        `Một cuộc thi tối đa ${CONTEST_LIMITS.maxProblems} đề.`,
      );
    }
    const out: ContestProblem[] = [];
    const seen = new Set<string>();

    for (let idx = 0; idx < list.length; idx++) {
      const p = list[idx] ?? ({} as ContestProblemDto);
      const source: 'lesson' | 'exercise' | 'bank' =
        p.source ??
        (p.exerciseSlug ? 'exercise' : p.questionIds?.length ? 'bank' : 'lesson');

      const rawPoints = Number(p.points);
      let points = Number.isFinite(rawPoints) ? Math.floor(rawPoints) : 0;
      let normalized: ContestProblem;

      if (source === 'exercise') {
        const slug = this.cleanText(p.exerciseSlug ?? p.slug, 200);
        const ex: any = slug
          ? await this.exerciseModel.findOne({ slug }).lean()
          : null;
        if (!ex) {
          throw new BadRequestException(
            `Không tìm thấy bài Code Playground "${slug}".`,
          );
        }
        if (ex.type !== 'CODE_TEXT' || ex.resource_id) {
          throw new BadRequestException(
            `Bài "${ex.title}" không phải bài code Python nên không đưa vào cuộc thi được.`,
          );
        }
        if (requireReady && !(ex.testCases ?? []).length) {
          throw new BadRequestException(
            `Bài "${ex.title}" chưa có test case nên không chấm được.`,
          );
        }
        if (points <= 0) points = ex.points ?? 10;
        normalized = {
          source: 'exercise',
          exerciseSlug: ex.slug,
          title: this.cleanText(p.title, 200) || ex.title,
          slug: ex.slug,
          type: 'coding',
          points,
          order: idx + 1,
        };
      } else if (source === 'bank') {
        const ids = [
          ...new Set((p.questionIds ?? []).map((i) => String(i))),
        ].filter((i) => OBJECT_ID_RE.test(i));
        if (ids.length === 0) {
          throw new BadRequestException(
            'Phần trắc nghiệm cần chọn ít nhất một câu hỏi từ ngân hàng.',
          );
        }
        const questions: any[] = await this.questionModel
          .find({ _id: { $in: ids } })
          .select('_id options points')
          .lean();
        if (questions.length !== ids.length) {
          throw new BadRequestException(
            'Có câu hỏi không còn trong ngân hàng, vui lòng chọn lại.',
          );
        }
        if (
          requireReady &&
          questions.some((q) => !(q.options ?? []).some((o: any) => o.isCorrect))
        ) {
          throw new BadRequestException(
            'Có câu hỏi chưa có đáp án đúng nên không chấm được.',
          );
        }
        const title = this.cleanText(p.title, 200) || `Phần trắc nghiệm ${idx + 1}`;
        let slug = this.cleanText(p.slug, 200) || this.generateSlug(title);
        if (seen.has(slug)) slug = `${slug}-${idx + 1}`;
        if (points <= 0) {
          points = questions.reduce((sum, q) => sum + (q.points ?? 10), 0);
        }
        normalized = {
          source: 'bank',
          questionIds: ids,
          title,
          slug,
          type: 'quiz',
          points,
          order: idx + 1,
        };
      } else {
        const lessonId = this.cleanText(p.lessonId, 100);
        const lesson: any =
          lessonId && isValidObjectId(lessonId)
            ? await this.lessonModel.findById(lessonId).lean()
            : null;
        if (!lesson) {
          throw new BadRequestException(
            `Không tìm thấy bài đã soạn "${p.title ?? lessonId}".`,
          );
        }
        if (lesson.type !== 'coding' && lesson.type !== 'quiz') {
          throw new BadRequestException(
            `Bài "${lesson.title}" thuộc dạng khối lệnh nên không đưa vào cuộc thi được.`,
          );
        }
        if (requireReady) {
          const ready =
            lesson.type === 'coding'
              ? (lesson.testCases ?? []).length > 0
              : (lesson.quizQuestions ?? []).length > 0;
          if (!ready) {
            throw new BadRequestException(
              `Bài "${lesson.title}" chưa có ${lesson.type === 'coding' ? 'test case' : 'câu hỏi'} nên không chấm được.`,
            );
          }
        }
        if (points <= 0) points = lesson.points ?? 10;
        normalized = {
          source: 'lesson',
          lessonId: String(lesson._id),
          title: this.cleanText(p.title, 200) || lesson.title,
          slug: lesson.slug,
          type: lesson.type,
          points,
          order: idx + 1,
        };
      }

      normalized.points = Math.min(
        Math.max(normalized.points, CONTEST_LIMITS.pointsMin),
        CONTEST_LIMITS.pointsMax,
      );
      if (seen.has(normalized.slug)) {
        throw new BadRequestException(
          `Đề "${normalized.title}" bị chọn trùng trong cuộc thi.`,
        );
      }
      seen.add(normalized.slug);
      out.push(normalized);
    }
    return out;
  }

  async createContest(dto: CreateContestDto, authorId: string): Promise<Contest> {
    const title = this.cleanText(dto.title, CONTEST_LIMITS.titleMax);
    if (!title) {
      throw new BadRequestException('Tiêu đề cuộc thi không được để trống!');
    }
    const { startTime, endTime } = this.parseWindow(dto.startTime, dto.endTime);

    const slug =
      dto.slug && dto.slug.trim() ? dto.slug.trim() : this.generateSlug(title);
    const existing = await this.contestModel.findOne({ slug }).exec();
    if (existing) {
      throw new BadRequestException(
        `Slug '${slug}' đã tồn tại. Vui lòng chọn tiêu đề hoặc slug khác.`,
      );
    }

    const status = dto.status === 'draft' ? 'draft' : 'published';
    const problems = await this.normalizeProblems(
      dto.problems,
      status === 'published',
    );
    if (status === 'published' && problems.length === 0) {
      throw new BadRequestException(
        'Cuộc thi công khai cần có ít nhất một đề. Hãy thêm đề hoặc lưu dạng bản nháp.',
      );
    }

    // Chỉ nhận các trường được phép: không để client ghi đè registrations/authorId.
    const newContest = new this.contestModel({
      title,
      slug,
      description: this.cleanText(dto.description, CONTEST_LIMITS.descriptionMax),
      startTime,
      endTime,
      durationMinutes: this.resolveDuration(
        dto.durationMinutes,
        startTime,
        endTime,
      ),
      problems,
      registrations: [],
      status,
      integrityEnabled: dto.integrityEnabled !== false,
      authorId,
    });

    return newContest.save();
  }

  async updateContest(
    id: string,
    dto: UpdateContestDto,
    requester: { sub: string; role: string },
  ): Promise<Contest> {
    const contest = await this.contestModel.findById(id);
    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với ID: ${id}`);
    }
    this.assertCanModify(contest, requester);

    const hasStarted = new Date() >= contest.startTime;
    const { startTime, endTime } = this.parseWindow(
      dto.startTime ?? contest.startTime,
      dto.endTime ?? contest.endTime,
    );

    if (hasStarted && dto.startTime && +startTime !== +contest.startTime) {
      throw new BadRequestException(
        'Cuộc thi đã bắt đầu nên không thể đổi giờ bắt đầu.',
      );
    }

    const status = dto.status ?? contest.status;
    let problems = contest.problems;
    if (dto.problems !== undefined) {
      const next = await this.normalizeProblems(dto.problems, status === 'published');
      const key = (list: ContestProblem[]) =>
        JSON.stringify(
          list.map((p) => [p.slug, p.type, p.points, p.source ?? 'lesson']),
        );
      if (hasStarted && key(next) !== key(contest.problems ?? [])) {
        throw new BadRequestException(
          'Cuộc thi đã bắt đầu nên không thể thay đổi danh sách đề hoặc điểm.',
        );
      }
      problems = next;
    } else if (status === 'published' && contest.status === 'draft') {
      // Xuất bản bản nháp: kiểm tra lại đề hiện có (đề cũ thiếu nguồn sẽ báo rõ để chọn lại).
      problems = await this.normalizeProblems(
        (contest.problems ?? []).map((p: any) =>
          typeof p.toObject === 'function' ? p.toObject() : { ...p },
        ),
        true,
      );
    }
    if (status === 'published' && problems.length === 0) {
      throw new BadRequestException(
        'Cuộc thi công khai cần có ít nhất một đề. Hãy thêm đề hoặc chuyển về bản nháp.',
      );
    }

    // Slug cố định sau khi tạo (link/bảng xếp hạng đang dùng); mọi trường khác
    // đi qua danh sách trắng, không còn Object.assign(dto) ghi đè tuỳ ý.
    if (dto.title !== undefined) {
      const title = this.cleanText(dto.title, CONTEST_LIMITS.titleMax);
      if (!title) {
        throw new BadRequestException('Tiêu đề cuộc thi không được để trống!');
      }
      contest.title = title;
    }
    if (dto.description !== undefined) {
      contest.description = this.cleanText(
        dto.description,
        CONTEST_LIMITS.descriptionMax,
      );
    }
    contest.startTime = startTime;
    contest.endTime = endTime;
    contest.durationMinutes = this.resolveDuration(
      dto.durationMinutes ?? contest.durationMinutes,
      startTime,
      endTime,
    );
    contest.problems = problems;
    contest.status = status;
    if (dto.integrityEnabled !== undefined) {
      contest.integrityEnabled = dto.integrityEnabled !== false;
    }

    return contest.save();
  }

  /** Dữ liệu trả cho client: không lộ danh sách đăng ký (tên/ID học viên) và cấu hình đề nội bộ. */
  private toView(
    c: ContestDocument,
    viewer: ContestViewer | undefined,
    serverTime: Date,
    myAttemptStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED' = 'NOT_STARTED',
  ) {
    const { status: computedStatus, statusText } = this.computeStatus(
      c.startTime,
      c.endTime,
    );
    const { registrations, problems, ...rest } = c.toObject();
    const staff = isStaff(viewer?.role);
    return {
      ...rest,
      problems: (problems ?? []).map((p: ContestProblem) =>
        staff
          ? p
          : {
              slug: p.slug,
              title: p.title,
              type: p.type,
              points: p.points,
              order: p.order,
              source: p.source,
              lessonId: p.lessonId,
            },
      ),
      serverTime: serverTime.toISOString(),
      computedStatus,
      statusText,
      isRegistered: viewer
        ? (registrations ?? []).some(
            (r: { studentId: string }) => r.studentId === viewer.sub,
          )
        : false,
      registrationsCount: (registrations ?? []).length,
      // Trạng thái lượt thi của chính người xem (do máy chủ giữ), không còn dựa vào localStorage.
      myAttemptStatus,
    };
  }

  /** Trạng thái lượt thi của học viên cho một loạt cuộc thi, 1 truy vấn. */
  private async attemptStatuses(
    contestIds: string[],
    viewer?: ContestViewer,
  ): Promise<Map<string, 'IN_PROGRESS' | 'FINISHED'>> {
    const out = new Map<string, 'IN_PROGRESS' | 'FINISHED'>();
    if (!viewer || isStaff(viewer.role) || contestIds.length === 0) return out;
    const attempts: any[] = await this.contestAttemptModel
      .find({ studentId: viewer.sub, contestId: { $in: contestIds } })
      .select('contestId finishedAt')
      .lean();
    for (const a of attempts) {
      out.set(a.contestId, a.finishedAt ? 'FINISHED' : 'IN_PROGRESS');
    }
    return out;
  }

  async findAll(viewer?: ContestViewer) {
    // Bản nháp chỉ giảng viên/quản trị viên thấy. (Trước đây điều kiện bị đảo:
    // khách thấy cả bản nháp, còn giảng viên đăng nhập lại không thấy bản nháp của mình.)
    const filter: Record<string, unknown> = isStaff(viewer?.role)
      ? {}
      : { status: { $ne: 'draft' } };
    const contests = await this.contestModel
      .find(filter)
      .sort({ startTime: -1 })
      .exec();
    const serverTime = new Date();
    const statuses = await this.attemptStatuses(
      contests.map((c) => String(c._id)),
      viewer,
    );
    return contests.map((c) =>
      this.toView(c, viewer, serverTime, statuses.get(String(c._id))),
    );
  }

  async findOne(id: string, viewer?: ContestViewer) {
    const contest = await this.findVisible(id, viewer);
    const statuses = await this.attemptStatuses([String(contest._id)], viewer);
    return this.toView(contest, viewer, new Date(), statuses.get(String(contest._id)));
  }

  async registerContest(id: string, studentId: string) {
    const user = await this.userModel.findById(studentId).select('fullName').lean();
    const studentName = user?.fullName || 'Học viên';

    const contest = await this.findVisible(id, { sub: studentId, role: 'STUDENT' });

    const now = new Date();
    if (now > contest.endTime) {
      throw new BadRequestException(
        'Cuộc thi này đã kết thúc! Bạn không thể đăng ký tham gia nữa.',
      );
    }

    const isAlreadyRegistered = contest.registrations.some(
      (r) => r.studentId === studentId,
    );
    if (isAlreadyRegistered) {
      return {
        success: true,
        message: 'Học viên đã đăng ký tham gia cuộc thi từ trước!',
        isRegistered: true,
        contestId: contest._id,
        contestTitle: contest.title,
      };
    }

    contest.registrations.push({
      studentId,
      studentName: studentName || 'Học viên',
      registeredAt: now,
    });

    await contest.save();

    return {
      success: true,
      message: 'Đăng ký tham gia cuộc thi thành công!',
      isRegistered: true,
      contestId: contest._id,
      contestTitle: contest.title,
      registeredAt: now.toISOString(),
    };
  }

  async checkContestStatus(id: string, viewer?: ContestViewer | string) {
    const v: ContestViewer | undefined =
      typeof viewer === 'string' ? { sub: viewer, role: 'STUDENT' } : viewer;
    const contest = await this.findVisible(id, v);

    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    const { status: computedStatus, statusText } = this.computeStatus(
      start,
      end,
    );
    const isRegistered = v
      ? contest.registrations.some((r) => r.studentId === v.sub)
      : false;

    const isAllowedToJoin = computedStatus === 'ONGOING' && isRegistered;
    const isAllowedToSubmit = computedStatus === 'ONGOING' && isRegistered;

    let message = '';
    if (computedStatus === 'UPCOMING') {
      message = 'Cuộc thi chưa bắt đầu. Thời gian máy chủ chưa đạt giờ mở đề.';
    } else if (computedStatus === 'ENDED') {
      message =
        'Cuộc thi đã kết thúc. Máy chủ đã khóa quyền nộp bài và làm đề thi.';
    } else if (!isRegistered) {
      message =
        'Bạn chưa đăng ký tham gia cuộc thi này! Vui lòng bấm nút "Đăng ký tham gia" trước khi làm bài thi.';
    } else {
      message =
        'Cuộc thi đang diễn ra hợp lệ theo thời gian máy chủ và bạn đã đăng ký tham gia thành công.';
    }

    const timeRemainingSeconds =
      computedStatus === 'ONGOING'
        ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
        : 0;
    const countdownSeconds =
      computedStatus === 'UPCOMING'
        ? Math.max(0, Math.floor((start.getTime() - now.getTime()) / 1000))
        : 0;

    return {
      contestId: contest._id,
      slug: contest.slug,
      title: contest.title,
      serverTime: now.toISOString(),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: contest.durationMinutes,
      integrityEnabled: contest.integrityEnabled !== false,
      computedStatus,
      statusText,
      isRegistered,
      isAllowedToJoin,
      isAllowedToSubmit,
      timeRemainingSeconds,
      countdownSeconds,
      message,
    };
  }

  async deleteContest(id: string, requester: { sub: string; role: string }) {
    const contest = await this.contestModel.findById(id);
    if (!contest) {
      throw new NotFoundException(`Không tìm thấy cuộc thi với ID: ${id}`);
    }
    this.assertCanModify(contest, requester);
    await this.contestModel.findByIdAndDelete(id);
    // Dọn dữ liệu con để không để lại bài nộp/lượt thi mồ côi trỏ tới cuộc thi đã xóa.
    const contestId = String(contest._id);
    await Promise.all([
      this.contestSubmissionModel.deleteMany({ contestId }),
      this.contestAttemptModel.deleteMany({ contestId }),
    ]);
    return {
      success: true,
      message: `Đã xóa thành công cuộc thi: ${contest.title}`,
    };
  }
}
