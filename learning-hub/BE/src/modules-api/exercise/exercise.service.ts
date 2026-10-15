import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import type { JwtPayload } from '../../common/auth/jwt.strategy';
import { slugify } from '../../common/utils/slug.util';
import { matrixError, targetGroupOfStudent } from './exercise-matrix';
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
import { JudgeQueueService } from '../judge/judge-queue.service';
import { JudgeStatus } from '../judge/judge-status.enum';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Submission.name)
    private readonly submissionModel: Model<SubmissionDocument>,
    private readonly judgeQueueService: JudgeQueueService,
    private readonly integrityService: IntegrityService,
  ) {}

  async findAll(user?: JwtPayload) {
    // Bài DA lab (có resource_id) chấm trên sandbox SQL ở module da-labs,
    // không dùng được trong ngân hàng đề Python nên không liệt kê ở đây.
    const exercises = await this.exerciseModel
      .find({ resource_id: { $exists: false }, ...this.visibleToFilter(user) })
      .select(
        'title slug description type difficulty points starterCode timeLimitMs tags prerequisiteSlug gradeBand topic orderInTopic targetGroup labType storyContext illustrationUrl datasetId testCases solutionCode sourceLessonSlug',
      )
      .lean();

    // Không trả testCases/solutionCode thô qua route dùng chung này (có thể
    // lộ đáp án ẩn cho học viên) — chỉ tính sẵn 2 cờ trạng thái để FE (bank
    // picker của Teacher Authoring) hiển thị badge "Draft/Ready/Validated"
    // mà không cần fetch riêng :slug/full cho từng item trong danh sách.
    return exercises.map((ex) => {
      const { testCases, solutionCode, ...rest } = ex as any;
      return {
        ...rest,
        hasSolution: Boolean(solutionCode?.trim()),
        testCaseCount: Array.isArray(testCases) ? testCases.length : 0,
      };
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

  async findBySlug(slug: string, user?: JwtPayload) {
    // Không select hiddenTestCases/officialSolution: học viên không bao giờ nhận chúng.
    const exercise = await this.exerciseModel
      .findOne({ slug })
      .select(
        'title slug description type difficulty points starterCode timeLimitMs testCases tags prerequisiteSlug gradeBand topic orderInTopic targetGroup labType storyContext illustrationUrl datasetId hints',
      )
      .lean();
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);
    this.assertCanAccess(exercise, user);

    // Hide the actual expected output of hidden tests, only expose count/labels.
    const visibleTestCases = (exercise.testCases ?? []).filter(
      (t) => !t.isHidden,
    );
    return {
      ...exercise,
      testCases: visibleTestCases,
      hiddenTestCount:
        (exercise.testCases ?? []).length - visibleTestCases.length,
    };
  }

  /**
   * Ad-hoc "Run" with arbitrary stdin — for trying code freely, no grading/persistence.
   * Falls back to a default time limit for exercises not persisted in the Exercise
   * collection (e.g. Teacher Authoring lessons), since Run has no grading side-effects.
   */
  async runCode(slug: string, dto: RunCodeDto, user?: JwtPayload) {
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
    if (exercise) this.assertCanAccess(exercise, user);
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
    // Luồng chấm nội bộ: chủ động lấy hiddenTestCases (select:false) để đếm đủ số test.
    const exercise = await this.exerciseModel
      .findOne({ slug })
      .select('+hiddenTestCases')
      .lean();
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);
    this.assertCanAccess(exercise, user);
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
      code: dto.code,
      integrity,
      status: JudgeStatus.QUEUED,
      passedCount: 0,
      totalCount:
        (exercise.testCases ?? []).length +
        (exercise.hiddenTestCases ?? []).length,
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
    exercise: { targetGroup?: string },
    user?: JwtPayload,
  ): void {
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

  /** Bộ lọc danh sách: học viên chỉ thấy bài đúng nhóm (và bài cũ chưa gắn nhóm). */
  private visibleToFilter(user?: JwtPayload): Record<string, unknown> {
    if (user?.role !== 'STUDENT') return {};
    return {
      $or: [
        { targetGroup: { $exists: false } },
        { targetGroup: targetGroupOfStudent(user.ageGroup) },
      ],
    };
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

    if (await this.exerciseModel.exists({ slug: data.slug })) {
      throw new ConflictException(`Slug "${data.slug}" đã tồn tại.`);
    }
    const created = await this.exerciseModel.create({
      ...data,
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
