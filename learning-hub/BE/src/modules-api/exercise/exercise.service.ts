import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { slugify } from '../../common/utils/slug.util';
import { allowedGradeBands, bankBandOfTargetGroup, bankLabels, matrixError, studentCanSeeExercise, studentExerciseFilter, TEACHER_AUTHORABLE_GROUPS, targetGroupOfStudent } from './exercise-matrix';
import { assertCanModifyExercise, assertExerciseNotInUse } from './exercise-usage';
import { notDemoExercise, isOnPlaygroundTrack, isPlaygroundBand, playgroundBandOf, playgroundFilter, playgroundStatuses, PLAYGROUND_TRACK_TOPIC, PRACTICE_AC_FILTER, type PlaygroundBand } from './playground-catalog';
import { ClassAssignment, ClassAssignmentDocument } from '../../modules-system/database/schemas/class-assignment.schema';
import { Classroom, ClassroomDocument } from '../../modules-system/database/schemas/classroom.schema';
import { Contest, ContestDocument } from '../../modules-system/database/schemas/contest.schema';
import { ExerciseWriteDto, WRITABLE_FIELDS } from './dto/exercise-write.dto';
import {
  Exercise,
  ExerciseDocument,
} from '../../modules-system/database/schemas/exercise.schema';
import {
  Submission,
  SubmissionDocument,
} from '../../modules-system/database/schemas/submission.schema';
import {
  checkPythonSyntax,
  runPythonCode,
} from '../../common/helper/code-runner.helper';
import { IntegrityService } from '../integrity/integrity.service';
import { ClassAssignmentsService } from '../class-assignments/class-assignments.service';
import { JudgeQueueService } from '../judge/judge-queue.service';
import { JudgeStatus } from '../judge/judge-status.enum';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';

/** Teacher Studio chỉ soạn bài cho khối 6-9 / 10-12 (403 với Lớp 3-5 và khối Người lớn — Day 30). */
function assertAuthorableGroup(targetGroup: unknown): void {
  if (!(TEACHER_AUTHORABLE_GROUPS as readonly unknown[]).includes(targetGroup)) {
    throw new ForbiddenException({
      code: 'E403_BAND_NOT_AUTHORABLE',
      message: 'Teacher Studio chỉ soạn bài cho Khối 6–9 và Khối 10–12 (Lớp 3–5 học bằng game Blockly dựng sẵn).',
    });
  }
}

@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    private readonly judgeQueueService: JudgeQueueService,
    private readonly integrityService: IntegrityService,
    private readonly classAssignments: ClassAssignmentsService,
    // Đếm mức sử dụng trước khi xóa (bài đang ở lớp/cuộc thi thì 409). Thiếu (test cũ) thì bỏ qua bước đếm.
    @Optional() @InjectModel(ClassAssignment.name)
    private readonly assignmentModel?: Model<ClassAssignmentDocument>,
    @Optional() @InjectModel(Classroom.name)
    private readonly classroomModel?: Model<ClassroomDocument>,
    @Optional() @InjectModel(Contest.name)
    private readonly contestModel?: Model<ContestDocument>,
  ) {}

  async findAll(user?: JwtPayload) {
    // Bài DA lab (có resource_id) chấm trên sandbox SQL ở module da-labs,
    // không dùng được trong ngân hàng đề Python nên không liệt kê ở đây.
    // testCases/solutionCode có thể nặng hàng MB mỗi bài: tính hasSolution/testCaseCount NGAY TRÊN MÁY CHỦ CSDL và loại hai trường
    // này khỏi kết quả, nên danh sách chỉ truyền về vài chục KB thay vì cả bộ test.
    const exercises = await this.exerciseModel.aggregate([
      // Bài của Ngân hàng đề (bankOnly: chỉ gán vào lớp/cuộc thi) không hiện trong danh mục Code Playground của học viên và khách.
      { $match: { resource_id: { $exists: false }, slug: notDemoExercise, ...(user?.role === 'TEACHER' || user?.role === 'ADMIN' ? {} : { bankOnly: { $ne: true } }), ...this.visibleToFilter(user) } },
      {
        $project: {
          title: 1, slug: 1, description: 1, type: 1, difficulty: 1, points: 1, starterCode: 1, timeLimitMs: 1, tags: 1,
          prerequisiteSlug: 1, gradeBand: 1, topic: 1, orderInTopic: 1, targetGroup: 1, labType: 1, storyContext: 1,
          illustrationUrl: 1, datasetId: 1, sourceLessonSlug: 1,
          hasSolution: { $gt: [{ $strLenCP: { $trim: { input: { $ifNull: ['$solutionCode', ''] } } } }, 0] },
          testCaseCount: { $size: { $cond: [{ $isArray: '$testCases' }, '$testCases', []] } },
        },
      },
    ]);

    // Không trả testCases/solutionCode thô qua route dùng chung này (có thể
    // lộ đáp án ẩn cho học viên) — chỉ tính sẵn 2 cờ trạng thái để FE (bank
    // picker của Teacher Authoring) hiển thị badge "Draft/Ready/Validated"
    // mà không cần fetch riêng :slug/full cho từng item trong danh sách.
    return exercises as Array<Record<string, unknown> & { hasSolution: boolean; testCaseCount: number }>;
  }

  /** Lộ trình chuẩn của một khối theo thứ tự #1..#N (chỉ các trường hiển thị danh sách, không test/đáp án). */
  private async loadPlaygroundTrack(band: PlaygroundBand) {
    const docs = await this.exerciseModel.aggregate([
      { $match: playgroundFilter(band) },
      { $sort: { orderInTopic: 1, slug: 1 } },
      {
        $project: {
          title: 1, slug: 1, description: 1, type: 1, difficulty: 1, points: 1, starterCode: 1, timeLimitMs: 1, tags: 1,
          gradeBand: 1, topic: 1, orderInTopic: 1, targetGroup: 1, labType: 1,
        },
      },
    ]);
    return docs as Array<Record<string, unknown> & { _id: unknown; slug: string }>;
  }

  /** Slug các bài của lộ trình mà học viên đã hoàn thành (xem PRACTICE_AC_FILTER; nguồn duy nhất: bài nộp đã chấm trong CSDL, không phải localStorage). */
  private async solvedOnTrack(userId: string, track: Array<{ _id: unknown; slug: string }>): Promise<Set<string>> {
    if (!userId || track.length === 0) return new Set();
    const byId = new Map(track.map((t) => [String(t._id), t.slug]));
    const ids = await this.submissionModel.distinct('exerciseId', { userId, ...PRACTICE_AC_FILTER, exerciseId: { $in: [...byId.keys()] } });
    return new Set(ids.map((id) => byId.get(String(id))).filter((s): s is string => !!s));
  }

  /**
   * GET /exercises/playground (Day 31): lộ trình Code Playground chuẩn của khối kèm trạng thái do MÁY CHỦ tính.
   *  - Học viên: khối lấy từ tài khoản (không nhận từ client). Bài #1 luôn mở; bài #k chỉ mở khi #1..#(k-1) đã hoàn thành (AC).
   *  - Giảng viên/Admin: chọn khối qua `band`, xem toàn bộ lộ trình và không bị khóa (không có tiến độ cá nhân).
   * `completed`/`total` là CON SỐ DUY NHẤT cho "X / N bài" ở Playground, Tiến độ học tập và Hồ sơ.
   */
  async playground(user: JwtPayload, bandParam?: string) {
    const isStudent = user.role === 'STUDENT';
    const band = isStudent ? playgroundBandOf(user.ageGroup) : bandParam === undefined || bandParam === '' ? '6-9' : bandParam;
    if (!isStudent && !isPlaygroundBand(band)) {
      throw new BadRequestException({ code: 'E400_INVALID_BAND', message: 'Khối Playground chỉ nhận 6-9 hoặc 10-12.' });
    }
    if (!band || !isPlaygroundBand(band)) {
      return { band: null, topic: null, total: 0, completed: 0, nextSlug: null, exercises: [] };
    }
    const track = await this.loadPlaygroundTrack(band);
    const solved = isStudent ? await this.solvedOnTrack(user.sub, track) : new Set<string>();
    const statuses = isStudent ? playgroundStatuses(track.map((t) => t.slug), solved) : track.map(() => 'available' as const);
    const exercises = track.map((t, i) => ({ ...t, order: i + 1, status: statuses[i] }));
    return {
      band,
      topic: PLAYGROUND_TRACK_TOPIC[band],
      total: exercises.length,
      completed: isStudent ? exercises.filter((e) => e.status === 'completed').length : 0,
      nextSlug: exercises.find((e) => e.status === 'available')?.slug ?? null,
      exercises,
    };
  }

  /**
   * Chặn nộp nhảy cóc ở Playground: bài thuộc lộ trình chuẩn mà học viên chưa mở khóa → 403 E403_EXERCISE_LOCKED.
   * Không áp dụng khi nộp cho bài giao của lớp (assignmentId), bài ngoài lộ trình, giảng viên/Admin.
   */
  private async assertPlaygroundUnlocked(
    exercise: { slug: string; bankOnly?: boolean; resource_id?: string | null; type?: string; topic?: string | null; orderInTopic?: number | null; labType?: string | null; tags?: string[] | null },
    user: JwtPayload,
  ): Promise<void> {
    const band = playgroundBandOf(user.ageGroup);
    if (user.role !== 'STUDENT' || !band || !isOnPlaygroundTrack(exercise, band)) return;
    const track = await this.loadPlaygroundTrack(band);
    const idx = track.findIndex((t) => t.slug === exercise.slug);
    if (idx < 0) return;
    const solved = await this.solvedOnTrack(user.sub, track);
    const statuses = playgroundStatuses(track.map((t) => t.slug), solved);
    if (statuses[idx] !== 'locked') return;
    const blockedBy = statuses.findIndex((s) => s === 'available');
    throw new ForbiddenException({
      code: 'E403_EXERCISE_LOCKED',
      message: `Bài #${idx + 1} chưa mở khóa. Hãy hoàn thành bài #${blockedBy + 1} trước rồi làm tiếp theo thứ tự.`,
    });
  }

  /**
   * Bản đầy đủ cho GIÁO VIÊN (không lọc hidden test case, có solutionCode) —
   * dùng để import một exercise đã có sẵn (kể cả bài do AI Tạo Đề sinh và
   * lưu) vào form soạn thảo bài thi, KHÔNG dùng cho học viên (findBySlug ở
   * trên mới là route học viên, cố ý ẩn đáp án/test ẩn).
   */
  async findBySlugFull(slug: string) {
    // Màn quản trị của staff: chủ động lấy thêm các trường select:false.
    const exercise = await this.exerciseModel
      .findOne({ slug })
      .select('+hiddenTestCases +officialSolution')
      .lean();
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);
    return exercise;
  }

  /**
   * Số test và test HIỂN THỊ của một bài, tính TRÊN MÁY CHỦ CSDL ($filter/$size). Bộ test ẩn của bài thuật toán rất nặng (0,6–2 MB mỗi bài Ngày 15,
   * trong khi phần hiển thị chỉ ~130 byte): kéo cả tài liệu về Node chỉ để bỏ phần ẩn làm mỗi lần mở bài / Run / Submit mất 6–20 giây (Day 31 E2E).
   */
  private async testSummary(slug: string): Promise<{ total: number; hiddenInline: number; visible: Array<Record<string, unknown>> }> {
    const inline = { $ifNull: ['$testCases', []] };
    const [row] = await this.exerciseModel.aggregate([
      { $match: { slug } },
      {
        $project: {
          _id: 0,
          total: { $add: [{ $size: inline }, { $size: { $ifNull: ['$hiddenTestCases', []] } }] },
          hiddenInline: { $size: { $filter: { input: inline, as: 't', cond: { $eq: ['$$t.isHidden', true] } } } },
          visible: { $filter: { input: inline, as: 't', cond: { $ne: ['$$t.isHidden', true] } } },
        },
      },
    ]);
    return { total: row?.total ?? 0, hiddenInline: row?.hiddenInline ?? 0, visible: row?.visible ?? [] };
  }

  async findBySlug(slug: string, user?: JwtPayload) {
    // Không select hiddenTestCases/officialSolution: học viên không bao giờ nhận chúng. testCases cũng không tải về Node:
    // chỉ phần hiển thị được lọc ngay trên CSDL (xem testSummary).
    const [exercise, tests] = await Promise.all([
      this.exerciseModel
        .findOne({ slug })
        .select(
          'title slug description type difficulty points starterCode timeLimitMs tags prerequisiteSlug gradeBand bankBand topic orderInTopic targetGroup labType storyContext illustrationUrl datasetId hints',
        )
        .lean(),
      this.testSummary(slug),
    ]);
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);
    this.assertCanAccess(exercise, user);
    this.assertStudentBand(exercise, user);

    // Hide the actual expected output of hidden tests, only expose count/labels.
    return {
      ...exercise,
      testCases: tests.visible,
      hiddenTestCount: tests.hiddenInline,
    };
  }

  /**
   * Ad-hoc "Run" with arbitrary stdin — for trying code freely, no grading/persistence.
   * Falls back to a default time limit for exercises not persisted in the Exercise
   * collection (e.g. Teacher Authoring lessons), since Run has no grading side-effects.
   */
  async runCode(slug: string, dto: RunCodeDto, user?: JwtPayload) {
    // Chỉ cần quyền truy cập và giới hạn thời gian: không tải bộ test (có bài nặng hàng MB).
    const exercise = await this.exerciseModel
      .findOne({ slug })
      .select('slug timeLimitMs targetGroup gradeBand bankBand')
      .lean();
    if (exercise) {
      this.assertCanAccess(exercise, user);
      this.assertStudentBand(exercise, user);
    }
    const timeLimitMs = exercise?.timeLimitMs ?? 2000;

    // Chạy thử là request tương tác: hàng đợi đầy thì từ chối ngay, không xếp hàng vô hạn.
    const result = await runPythonCode(
      dto.code,
      dto.stdin ?? '',
      timeLimitMs,
      undefined,
      { rejectWhenBusy: true },
    );
    return this.toRunResponse(result);
  }

  /**
   * "Submit" — creates a QUEUED Submission and hands it to the judge worker, returning
   * immediately. Grading itself (compile-check, per-test-case run, WA/TLE/RE/CE/AC
   * classification) happens asynchronously in JudgeQueueService; the caller polls
   * GET /exercises/submissions/:id for the result.
   */
  async submitCode(
    slug: string,
    dto: SubmitCodeDto,
    userId: string,
    user?: JwtPayload,
  ) {
    // Không tải bộ test về Node chỉ để đếm: tổng số test (hiển thị + ẩn) tính trên CSDL (testSummary). Máy chấm tự nạp bộ test khi chấm.
    const [exercise, tests] = await Promise.all([this.exerciseModel.findOne({ slug }).select('-testCases').lean(), this.testSummary(slug)]);
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);
    this.assertCanAccess(exercise, user);
    this.assertStudentBand(exercise, user);
    // Nộp cho bài của lớp: kiểm tra thành viên, đúng bài, chưa mở/hết hạn (khóa)/đã xong. Nộp tự do thì bỏ qua.
    if (dto.assignmentId) {
      if (!user) throw new UnauthorizedException('Vui lòng đăng nhập để nộp bài của lớp.');
      await this.classAssignments.assertCanSubmitCoding(dto.assignmentId, slug, user);
    } else if (user) {
      // Luyện tập tự do ở Playground: phải mở khóa tuần tự (không nộp nhảy cóc bằng cách gọi API trực tiếp).
      await this.assertPlaygroundUnlocked(exercise, user);
    }
    // Bài DA Lab nộp qua /da-labs/:slug/submit (SQL), không qua judge Python.
    if (exercise.resource_id || exercise.type === 'SQL_LAB' || exercise.type === 'DA_INSIGHT') {
      throw new BadRequestException('Invalid submission type');
    }

    // Tín hiệu liêm chính chỉ để giảng viên xem: không ảnh hưởng chấm điểm hay hàng đợi.
    const integrity = await this.integrityService.evaluate(
      exercise as any,
      userId,
      dto.code,
      dto.integrity,
    );

    const submission = await this.submissionModel.create({
      exerciseId: String((exercise as any)._id),
      userId,
      ...(dto.assignmentId ? { assignmentId: dto.assignmentId } : {}),
      code: dto.code,
      integrity,
      status: JudgeStatus.QUEUED,
      passedCount: 0,
      totalCount: tests.total,
      results: [],
    });

    this.judgeQueueService.enqueue(String(submission._id));

    return { submissionId: String(submission._id), status: JudgeStatus.QUEUED };
  }

  /**
   * Học viên chỉ truy cập bài thuộc đúng nhóm của mình (chống IDOR theo nhóm tuổi).
   * Bài cũ chưa gắn targetGroup vẫn mở như trước; staff không bị giới hạn.
   */
  private assertCanAccess(
    exercise: { targetGroup?: string; gradeBand?: string },
    user?: JwtPayload,
  ): void {
    // Bài chỉ gắn gradeBand (không có targetGroup) cũng không được lọt sang khối khác.
    const bands = user?.role === 'STUDENT' ? allowedGradeBands(user.ageGroup) : null;
    if (bands && exercise.gradeBand && !bands.includes(exercise.gradeBand)) {
      throw new ForbiddenException('Bài tập này không thuộc khối của bạn.');
    }
    if (!exercise.targetGroup) return;
    if (!user) {
      throw new UnauthorizedException('Vui lòng đăng nhập để xem bài tập này.');
    }
    if (
      user.role === 'STUDENT' &&
      targetGroupOfStudent(user.ageGroup) !== exercise.targetGroup
    ) {
      throw new ForbiddenException('Bài tập này không thuộc nhóm của bạn.');
    }
  }

  /** Luật đầy đủ cho học viên (targetGroup + gradeBand + bankBand; lớp 3-5 chỉ bài 3-5; chưa có khối → không bài nào). */
  private assertStudentBand(
    exercise: { targetGroup?: string; gradeBand?: string; bankBand?: string },
    user?: JwtPayload,
  ): void {
    if (user?.role === 'STUDENT' && !studentCanSeeExercise(exercise, user.ageGroup)) {
      throw new ForbiddenException('Bài tập này không thuộc khối của bạn.');
    }
  }

  /** Bộ lọc danh sách: học viên chỉ thấy bài đúng nhóm (và bài cũ chưa gắn nhóm). */
  private visibleToFilter(user?: JwtPayload): Record<string, unknown> {
    if (user?.role !== 'STUDENT') return {};
    // Học viên Khối 6-9 / 10-12: danh sách CHỈ là lộ trình Playground chuẩn của khối (Day 31), không lẫn bài SQL, demo, bài cũ hay bài Ngân hàng đề.
    const band = playgroundBandOf(user.ageGroup);
    if (band) return playgroundFilter(band);
    // Cùng một luật cho danh sách và cho mở bài theo slug (studentCanSeeExercise): xét targetGroup + gradeBand + bankBand.
    return studentExerciseFilter(user.ageGroup);
  }

  /**
   * Gán nhóm mặc định cho bài Python cũ chưa phân lớp để học viên lớp 6-9 thấy lại:
   * gradeBand='6-9', targetGroup='K6_9', labType='PYTHON_CODE'. Chỉ đụng bài CODE_TEXT chưa có
   * gradeBand/targetGroup/labType (không ghi đè bài đã phân nhóm) và bỏ qua bài demo (demo-dash-ex-*).
   * Idempotent: chạy lại lần hai không còn bài nào khớp. dryRun chỉ liệt kê.
   */
  async assignLegacyGrade(dryRun = false) {
    const filter = {
      resource_id: { $exists: false },
      type: 'CODE_TEXT',
      gradeBand: { $exists: false },
      targetGroup: { $exists: false },
      labType: { $exists: false },
      slug: { $not: /^demo-dash-ex-/ },
    };
    const found = await this.exerciseModel.find(filter).select('slug').lean();
    if (!dryRun && found.length > 0) {
      await this.exerciseModel.updateMany(filter, {
        $set: { gradeBand: '6-9', targetGroup: 'K6_9', labType: 'PYTHON_CODE' },
      });
    }
    return { dryRun, matched: found.length, slugs: found.map((e) => e.slug) };
  }

  /** POST /exercises — chỉ TEACHER/ADMIN (đã chặn ở controller). */
  async create(dto: ExerciseWriteDto, user: JwtPayload) {
    const data = this.pickWritable(dto);
    if (!data.title?.trim() || !data.description?.trim()) {
      throw new BadRequestException('Thiếu title hoặc description.');
    }
    data.slug = (data.slug?.trim() || slugify(data.title)).toLowerCase();
    if (!data.slug) throw new BadRequestException('Không tạo được slug hợp lệ.');
    const err = matrixError(data.targetGroup, data.labType);
    if (err) throw new BadRequestException(err);
    assertAuthorableGroup(data.targetGroup);

    if (await this.exerciseModel.exists({ slug: data.slug })) {
      throw new ConflictException(`Slug "${data.slug}" đã tồn tại.`);
    }
    // Mọi bài soạn ở Teacher Studio (giảng viên lẫn Admin) thuộc Ngân hàng đề: chỉ để giao cho lớp/cuộc thi, KHÔNG vào
    // Code Playground công khai; nhãn khối gắn đồng bộ bankBand/targetGroup/gradeBand (Day 30).
    const bankBand = bankBandOfTargetGroup(data.targetGroup)!;
    const created = await this.exerciseModel.create({
      ...data,
      bankOnly: true,
      bankBand,
      gradeBand: bankLabels(bankBand).gradeBand,
      authorId: user.sub,
    });
    return this.findBySlugFull(created.slug);
  }

  /**
   * PATCH /exercises/:id — cập nhật MỘT PHẦN. Nạp document hiện tại, merge với payload rồi
   * kiểm tra lại cả ma trận trước khi ghi, nên sửa riêng targetGroup hoặc labType không thể
   * làm bài bị lệch cặp.
   */
  async update(id: string, dto: ExerciseWriteDto, user: JwtPayload) {
    const current = await this.loadOwned(id, user);
    const data = this.pickWritable(dto);

    const touchesMatrix = 'targetGroup' in data || 'labType' in data;
    if (touchesMatrix || current.targetGroup || current.labType) {
      const err = matrixError(
        data.targetGroup ?? current.targetGroup,
        data.labType ?? current.labType,
      );
      if (err) throw new BadRequestException(err);
    }
    if ('targetGroup' in data) {
      assertAuthorableGroup(data.targetGroup);
      // Đổi khối thì nhãn Ngân hàng đề đổi theo; bài vẫn là bankOnly (không lọt ra Playground).
      const band = bankBandOfTargetGroup(data.targetGroup)!;
      Object.assign(data, { bankOnly: true, bankBand: band, gradeBand: bankLabels(band).gradeBand });
    }
    if (data.slug !== undefined) {
      data.slug = data.slug.trim().toLowerCase();
      if (!data.slug) throw new BadRequestException('slug không được rỗng.');
      if (
        data.slug !== current.slug &&
        (await this.exerciseModel.exists({ slug: data.slug }))
      ) {
        throw new ConflictException(`Slug "${data.slug}" đã tồn tại.`);
      }
    }
    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Không có trường hợp lệ nào để cập nhật.');
    }
    await this.exerciseModel.updateOne(
      { _id: current._id },
      { $set: data },
      { runValidators: true },
    );
    return this.findBySlugFull(data.slug ?? current.slug);
  }

  /** DELETE /exercises/:id — giảng viên chỉ xóa bài của chính mình. */
  async remove(id: string, user: JwtPayload) {
    const current = await this.loadOwned(id, user);
    assertCanModifyExercise(current, user);
    await assertExerciseNotInUse({ assignments: this.assignmentModel, classes: this.classroomModel, contests: this.contestModel }, current.slug);
    await this.exerciseModel.deleteOne({ _id: current._id });
    return { deleted: true, slug: current.slug };
  }

  /** Nạp bài theo id và kiểm quyền sở hữu: TEACHER chỉ đụng bài có authorId là mình, ADMIN không giới hạn. */
  private async loadOwned(id: string, user: JwtPayload) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException(`Không tìm thấy bài tập "${id}"`);
    }
    const current = await this.exerciseModel.findById(id).lean();
    if (!current) throw new NotFoundException(`Không tìm thấy bài tập "${id}"`);
    if (user.role !== 'ADMIN' && current.authorId !== user.sub) {
      throw new ForbiddenException('Bạn chỉ được sửa/xóa bài tập do chính mình tạo.');
    }
    return current;
  }

  /** Chỉ giữ các trường cho phép ghi (chặn client tự đặt authorId, _id...). */
  private pickWritable(dto: ExerciseWriteDto): ExerciseWriteDto {
    const out: Record<string, unknown> = {};
    for (const key of WRITABLE_FIELDS) {
      if (dto && dto[key] === undefined) continue;
      if (
        ['title', 'slug', 'description', 'targetGroup', 'labType'].includes(key) &&
        typeof dto[key] !== 'string'
      ) {
        throw new BadRequestException(`Trường ${key} phải là chuỗi.`);
      }
      if (key === 'illustrationUrl' && dto[key] !== '') {
        const url = String(dto[key]);
        if (
          !/^(https:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/.test(url) ||
          url.length > 700_000
        ) {
          throw new BadRequestException('illustrationUrl phải là URL https hoặc ảnh nhỏ (png/jpeg/webp/gif) dưới ~500KB.');
        }
      }
      out[key] = dto[key];
    }
    return out as ExerciseWriteDto;
  }

  /**
   * Standalone syntax check (Compile Error detection) — no exercise lookup needed since
   * a source file either compiles or doesn't, independent of which exercise it's for.
   */
  async checkSyntax(code: string) {
    return checkPythonSyntax(code);
  }

  private toRunResponse(result: Awaited<ReturnType<typeof runPythonCode>>) {
    return {
      stdout: result.stdout,
      stderr: result.blocked ? result.blockedReason : result.stderr,
      exitCode: result.exitCode,
      timedOut: result.timedOut,
      executionTimeMs: result.executionTimeMs,
      blocked: result.blocked,
    };
  }
}
