import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise, ExerciseDocument } from '../../modules-system/database/schemas/exercise.schema';
import {
  Submission,
  SubmissionDocument,
  SubmissionTestResult,
} from '../../modules-system/database/schemas/submission.schema';
import { checkPythonSyntax, runPythonCode } from '../../common/helper/code-runner.helper';
import { JudgeStatus } from './judge-status.enum';

const STALE_RUNNING_THRESHOLD_MS = 30_000;
const SWEEP_INTERVAL_MS = 30_000;
const MAX_ATTEMPTS = 3;

/**
 * In-process job queue + worker for grading submissions. No Redis/BullMQ (consistent with
 * Day 7's decision not to add Docker — new shared infra needs team buy-in first); this is a
 * single-Node-process v0.1 judge worker. Idempotency/no-double-grading is enforced by atomic
 * Mongo status-guarded updates (`findOneAndUpdate` with a status filter), not by the in-memory
 * queue itself — the in-memory array only decides *order*, the DB decides *whether a job may
 * still be graded*.
 */
@Injectable()
export class JudgeQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JudgeQueueService.name);
  private queue: string[] = [];
  private processing = false;
  private sweepTimer?: NodeJS.Timeout;

  constructor(
    @InjectModel(Submission.name) private readonly submissionModel: Model<SubmissionDocument>,
    @InjectModel(Exercise.name) private readonly exerciseModel: Model<ExerciseDocument>,
  ) {}

  onModuleInit() {
    // Pick up anything left QUEUED/RUNNING from a previous process crash immediately,
    // then keep sweeping periodically for jobs that go stale mid-flight.
    void this.retryStale();
    this.sweepTimer = setInterval(() => void this.retryStale(), SWEEP_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.sweepTimer) clearInterval(this.sweepTimer);
  }

  enqueue(submissionId: string): void {
    this.queue.push(submissionId);
    void this.drain();
  }

  private async drain(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    try {
      while (this.queue.length > 0) {
        const id = this.queue.shift();
        if (!id) continue;
        await this.gradeOne(id);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Grades exactly one submission, guarded so that re-invoking this with the same id — whether
   * from a duplicate enqueue, a retried job, or the stale sweep — never grades twice. The guard
   * is the atomic `findOneAndUpdate({_id, status: 'QUEUED'})`: only the caller that actually
   * transitions the document from QUEUED to RUNNING proceeds; every other caller sees `null`
   * and returns immediately without touching results.
   */
  private async gradeOne(submissionId: string): Promise<void> {
    const claimed = await this.submissionModel.findOneAndUpdate(
      { _id: submissionId, status: JudgeStatus.QUEUED },
      { $set: { status: JudgeStatus.RUNNING }, $inc: { attempts: 1 } },
      { new: true },
    );
    if (!claimed) return;

    try {
      const exercise = await this.exerciseModel.findById(claimed.exerciseId).lean();
      if (!exercise) {
        await this.finish(submissionId, {
          status: JudgeStatus.FAILED,
          errorMessage: 'Không tìm thấy bài tập tương ứng với bài nộp này',
        });
        return;
      }

      const syntaxCheck = await checkPythonSyntax(claimed.code);
      if (!syntaxCheck.ok) {
        await this.finish(submissionId, {
          status: JudgeStatus.CE,
          errorMessage: syntaxCheck.errorMessage,
          passedCount: 0,
          totalCount: (exercise.testCases ?? []).length,
          results: [],
        });
        return;
      }

      const testCases = exercise.testCases ?? [];
      const results: SubmissionTestResult[] = [];
      let status: JudgeStatus = JudgeStatus.AC;
      let errorMessage: string | undefined;
      let maxMemoryMb: number | undefined;

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const run = await runPythonCode(claimed.code, tc.input, exercise.timeLimitMs);

        if (run.blocked) {
          status = JudgeStatus.RE;
          errorMessage = run.blockedReason;
          results.push({ index: i, passed: false, isHidden: tc.isHidden, stderr: run.blockedReason } as SubmissionTestResult);
          break;
        }

        const actualOutput = run.stdout.trim();
        const expectedOutput = tc.expectedOutput.trim();
        const passed = !run.timedOut && run.exitCode === 0 && actualOutput === expectedOutput;

        if (run.peakMemoryMb !== undefined) {
          maxMemoryMb = maxMemoryMb === undefined ? run.peakMemoryMb : Math.max(maxMemoryMb, run.peakMemoryMb);
        }

        results.push({
          index: i,
          passed,
          isHidden: tc.isHidden,
          input: tc.isHidden ? undefined : tc.input,
          expectedOutput: tc.isHidden ? undefined : expectedOutput,
          actualOutput: tc.isHidden ? undefined : actualOutput,
          stderr: run.stderr || undefined,
          executionTimeMs: run.executionTimeMs,
          memoryUsedMb: run.peakMemoryMb,
        } as SubmissionTestResult);

        if (!passed) {
          if (run.timedOut) status = JudgeStatus.TLE;
          else if (run.exitCode !== 0) status = JudgeStatus.RE;
          else status = JudgeStatus.WA;
          if (run.stderr) errorMessage = run.stderr;
        }
      }

      const passedCount = results.filter((r) => r.passed).length;
      if (testCases.length === 0) status = JudgeStatus.AC;

      await this.finish(submissionId, {
        status,
        passedCount,
        totalCount: testCases.length,
        results,
        errorMessage,
        memoryUsedMb: maxMemoryMb,
      });
    } catch (err) {
      this.logger.error(`Grading submission ${submissionId} failed`, err as Error);
      await this.finish(submissionId, {
        status: JudgeStatus.FAILED,
        errorMessage: err instanceof Error ? err.message : String(err),
      });
    }
  }

  /**
   * Final write-back, guarded on `status: RUNNING` so a concurrent stale-sweep reclaim can't
   * clobber a result that's already about to land — the document must still be in exactly the
   * state this call's own `gradeOne` transitioned it into.
   */
  private async finish(
    submissionId: string,
    update: Partial<{
      status: JudgeStatus;
      passedCount: number;
      totalCount: number;
      results: SubmissionTestResult[];
      errorMessage?: string;
      memoryUsedMb?: number;
    }>,
  ): Promise<void> {
    await this.submissionModel.findOneAndUpdate(
      { _id: submissionId, status: JudgeStatus.RUNNING },
      { $set: update },
    );
  }

  /**
   * v0.1, best-effort recovery: re-queues submissions stuck in RUNNING past the stale threshold
   * (single-process assumption — a real multi-instance deployment would need a distributed
   * lock, out of scope here, same posture as Day 7's documented sandbox-hardening gap).
   * Capped by `attempts`; beyond MAX_ATTEMPTS a submission is marked FAILED instead of retried
   * forever.
   */
  async retryStale(): Promise<void> {
    const staleBefore = new Date(Date.now() - STALE_RUNNING_THRESHOLD_MS);

    const failed = await this.submissionModel.updateMany(
      { status: JudgeStatus.RUNNING, updatedAt: { $lt: staleBefore }, attempts: { $gte: MAX_ATTEMPTS } },
      { $set: { status: JudgeStatus.FAILED, errorMessage: 'Quá số lần thử chấm bài cho phép' } },
    );
    if (failed.modifiedCount > 0) {
      this.logger.warn(`Marked ${failed.modifiedCount} stale submission(s) as FAILED after exceeding retry cap`);
    }

    const staleDocs = await this.submissionModel
      .find({ status: JudgeStatus.RUNNING, updatedAt: { $lt: staleBefore }, attempts: { $lt: MAX_ATTEMPTS } })
      .select('_id')
      .lean();

    // Also pick up anything left in QUEUED from a previous process crash before it was ever claimed.
    const queuedDocs = await this.submissionModel.find({ status: JudgeStatus.QUEUED }).select('_id').lean();

    for (const doc of staleDocs) {
      const reclaimed = await this.submissionModel.findOneAndUpdate(
        { _id: doc._id, status: JudgeStatus.RUNNING, attempts: { $lt: MAX_ATTEMPTS } },
        { $set: { status: JudgeStatus.QUEUED } },
      );
      if (reclaimed) this.queue.push(String(doc._id));
    }

    for (const doc of queuedDocs) {
      if (!this.queue.includes(String(doc._id))) this.queue.push(String(doc._id));
    }

    if (staleDocs.length > 0 || queuedDocs.length > 0) await this.drain();
  }
}
