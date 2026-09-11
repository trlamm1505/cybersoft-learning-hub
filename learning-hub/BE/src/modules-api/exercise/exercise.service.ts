import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import { Submission, SubmissionDocument } from '../../modules-system/database/schemas/submission.schema';
import { checkPythonSyntax, runPythonCode } from '../../common/helper/code-runner.helper';
import { JudgeQueueService } from '../judge/judge-queue.service';
import { JudgeStatus } from '../judge/judge-status.enum';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<SubmissionDocument>,
    private readonly judgeQueueService: JudgeQueueService,
  ) {}

  async findAll() {
    return this.exerciseModel
      .find()
      .select('title slug description type difficulty points starterCode timeLimitMs')
      .lean();
  }

  async findBySlug(slug: string) {
    const exercise = await this.exerciseModel
      .findOne({ slug })
      .select('title slug description type difficulty points starterCode timeLimitMs testCases')
      .lean();
    if (!exercise) throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);

    // Hide the actual expected output of hidden tests, only expose count/labels.
    const visibleTestCases = (exercise.testCases ?? []).filter((t) => !t.isHidden);
    return { ...exercise, testCases: visibleTestCases, hiddenTestCount: (exercise.testCases ?? []).length - visibleTestCases.length };
  }

  /**
   * Ad-hoc "Run" with arbitrary stdin — for trying code freely, no grading/persistence.
   * Falls back to a default time limit for exercises not persisted in the Exercise
   * collection (e.g. Teacher Authoring lessons), since Run has no grading side-effects.
   */
  async runCode(slug: string, dto: RunCodeDto) {
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
    const timeLimitMs = exercise?.timeLimitMs ?? 2000;

    const result = await runPythonCode(dto.code, dto.stdin ?? '', timeLimitMs);
    return this.toRunResponse(result);
  }

  /**
   * "Submit" — creates a QUEUED Submission and hands it to the judge worker, returning
   * immediately. Grading itself (compile-check, per-test-case run, WA/TLE/RE/CE/AC
   * classification) happens asynchronously in JudgeQueueService; the caller polls
   * GET /exercises/submissions/:id for the result.
   */
  async submitCode(slug: string, dto: SubmitCodeDto) {
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
    if (!exercise) throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);

    const submission = await this.submissionModel.create({
      exerciseId: String((exercise as any)._id),
      userId: dto.userId,
      code: dto.code,
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
