import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async findAll() {
    // Bài DA lab (có resource_id) chấm trên sandbox SQL ở module da-labs,
    // không dùng được trong ngân hàng đề Python nên không liệt kê ở đây.
    const exercises = await this.exerciseModel
      .find({ resource_id: { $exists: false } })
      .select(
        'title slug description type difficulty points starterCode timeLimitMs tags prerequisiteSlug gradeBand topic orderInTopic testCases solutionCode sourceLessonSlug',
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
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);
    return exercise;
  }

  async findBySlug(slug: string) {
    const exercise = await this.exerciseModel
      .findOne({ slug })
      .select(
        'title slug description type difficulty points starterCode timeLimitMs testCases tags prerequisiteSlug gradeBand topic orderInTopic hints',
      )
      .lean();
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);

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
  async runCode(slug: string, dto: RunCodeDto) {
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
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
  async submitCode(slug: string, dto: SubmitCodeDto, userId: string) {
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
    if (!exercise)
      throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);
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
      totalCount: (exercise.testCases ?? []).length,
      results: [],
    });

    this.judgeQueueService.enqueue(String(submission._id));

    return { submissionId: String(submission._id), status: JudgeStatus.QUEUED };
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
