import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import {
  Submission,
  SubmissionDocument,
  SubmissionTestResult,
} from '../../modules-system/database/schemas/submission.schema';
import { runPythonCode } from '../../common/helper/code-runner.helper';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<ExerciseDocument>,
    @InjectModel(Submission.name) private readonly submissionModel: Model<SubmissionDocument>,
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
   */
  async runCode(slug: string, dto: RunCodeDto) {
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
    if (!exercise) throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);

    const result = await runPythonCode(dto.code, dto.stdin ?? '', exercise.timeLimitMs);
    return this.toRunResponse(result);
  }

  /**
   * "Submit" — runs code against every sample test case and records a Submission.
   */
  async submitCode(slug: string, dto: SubmitCodeDto) {
    const exercise = await this.exerciseModel.findOne({ slug }).lean();
    if (!exercise) throw new NotFoundException(`Không tìm thấy bài tập "${slug}"`);

    const testCases = exercise.testCases ?? [];
    const results: SubmissionTestResult[] = [];
    let status: string = 'PASSED';
    let errorMessage: string | undefined;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const run = await runPythonCode(dto.code, tc.input, exercise.timeLimitMs);

      if (run.blocked) {
        status = 'RUNTIME_ERROR';
        errorMessage = run.blockedReason;
        results.push({ index: i, passed: false, isHidden: tc.isHidden, stderr: run.blockedReason });
        break;
      }

      const actualOutput = run.stdout.trim();
      const expectedOutput = tc.expectedOutput.trim();
      const passed = !run.timedOut && run.exitCode === 0 && actualOutput === expectedOutput;

      results.push({
        index: i,
        passed,
        isHidden: tc.isHidden,
        input: tc.isHidden ? undefined : tc.input,
        expectedOutput: tc.isHidden ? undefined : expectedOutput,
        actualOutput: tc.isHidden ? undefined : actualOutput,
        stderr: run.stderr || undefined,
        executionTimeMs: run.executionTimeMs,
      });

      if (!passed) {
        if (run.timedOut) status = 'TIME_LIMIT_EXCEEDED';
        else if (run.exitCode !== 0) status = 'RUNTIME_ERROR';
        else status = 'WRONG_ANSWER';
        if (run.stderr) errorMessage = run.stderr;
      }
    }

    const passedCount = results.filter((r) => r.passed).length;
    if (testCases.length === 0) status = 'PASSED';

    const submission = await this.submissionModel.create({
      exerciseId: String((exercise as any)._id),
      userId: dto.userId,
      code: dto.code,
      status,
      passedCount,
      totalCount: testCases.length,
      results,
      errorMessage,
    });

    return submission.toObject();
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
