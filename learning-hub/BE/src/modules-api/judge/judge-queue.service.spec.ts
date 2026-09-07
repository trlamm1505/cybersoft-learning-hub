import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { JudgeQueueService } from './judge-queue.service';
import { JudgeStatus } from './judge-status.enum';
import { Submission } from '../../modules-system/database/schemas/submission.schema';
import { Exercise } from '../../modules-system/database/schemas/exercise.schema';
import * as codeRunner from '../../common/helper/code-runner.helper';

/**
 * A tiny in-memory Mongo-doc stand-in whose findOneAndUpdate genuinely enforces the status
 * filter (mutating shared state), so concurrent gradeOne() calls racing on the same id behave
 * the same way real MongoDB's atomic single-document update would: only one caller observes a
 * match, the other gets null.
 */
function makeFakeSubmissionModel(initialDocs: Record<string, any>) {
  const store = new Map<string, any>(Object.entries(initialDocs).map(([id, doc]) => [id, { ...doc }]));

  return {
    findOneAndUpdate: jest.fn(async (filter: any, update: any) => {
      const id = String(filter._id);
      const doc = store.get(id);
      if (!doc) return null;
      if (filter.status !== undefined && doc.status !== filter.status) return null;

      const $set = update.$set ?? {};
      const $inc = update.$inc ?? {};
      Object.assign(doc, $set);
      for (const key of Object.keys($inc)) {
        doc[key] = (doc[key] ?? 0) + $inc[key];
      }
      doc.updatedAt = new Date();
      store.set(id, doc);
      return { ...doc };
    }),
    findById: jest.fn((id: string) => ({
      lean: jest.fn().mockResolvedValue(store.get(String(id)) ?? null),
    })),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    find: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue([]) }),
    }),
    __store: store,
  };
}

function makeFakeExerciseModel(exercise: any) {
  return {
    findById: jest.fn(() => ({
      lean: jest.fn().mockResolvedValue(exercise),
    })),
  };
}

describe('JudgeQueueService', () => {
  const exerciseId = new Types.ObjectId().toString();

  const sumExercise = {
    _id: exerciseId,
    slug: 'sum-two',
    timeLimitMs: 2000,
    testCases: [
      { input: '3\n5', expectedOutput: '8', isHidden: false },
      { input: '1\n1', expectedOutput: '2', isHidden: true },
    ],
  };

  let syntaxSpy: jest.SpyInstance;
  let runSpy: jest.SpyInstance;

  afterEach(() => {
    syntaxSpy?.mockRestore();
    runSpy?.mockRestore();
  });

  async function buildService(submissionModel: any, exerciseModel: any) {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JudgeQueueService,
        { provide: getModelToken(Submission.name), useValue: submissionModel },
        { provide: getModelToken(Exercise.name), useValue: exerciseModel },
      ],
    }).compile();

    return module.get<JudgeQueueService>(JudgeQueueService);
  }

  it('classifies AC when all test cases pass', async () => {
    const submissionId = new Types.ObjectId().toString();
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: { _id: submissionId, exerciseId, status: JudgeStatus.QUEUED, code: 'ok', attempts: 0 },
    });
    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));

    syntaxSpy = jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
    runSpy = jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue({
      stdout: '', stderr: '', exitCode: 0, timedOut: false, executionTimeMs: 5, blocked: false,
    } as any);
    runSpy.mockResolvedValueOnce({ stdout: '8', stderr: '', exitCode: 0, timedOut: false, executionTimeMs: 5, blocked: false } as any);
    runSpy.mockResolvedValueOnce({ stdout: '2', stderr: '', exitCode: 0, timedOut: false, executionTimeMs: 5, blocked: false } as any);

    await (service as any).gradeOne(submissionId);

    const finalDoc = submissionModel.__store.get(submissionId);
    expect(finalDoc.status).toBe(JudgeStatus.AC);
    expect(finalDoc.passedCount).toBe(2);
    expect(finalDoc.totalCount).toBe(2);
  });

  it('classifies WA on output mismatch', async () => {
    const submissionId = new Types.ObjectId().toString();
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: { _id: submissionId, exerciseId, status: JudgeStatus.QUEUED, code: 'wrong', attempts: 0 },
    });
    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));

    syntaxSpy = jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
    runSpy = jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue({
      stdout: '999', stderr: '', exitCode: 0, timedOut: false, executionTimeMs: 5, blocked: false,
    } as any);

    await (service as any).gradeOne(submissionId);

    expect(submissionModel.__store.get(submissionId).status).toBe(JudgeStatus.WA);
  });

  it('classifies TLE when a run times out', async () => {
    const submissionId = new Types.ObjectId().toString();
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: { _id: submissionId, exerciseId, status: JudgeStatus.QUEUED, code: 'loop', attempts: 0 },
    });
    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));

    syntaxSpy = jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
    runSpy = jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue({
      stdout: '', stderr: '', exitCode: null, timedOut: true, executionTimeMs: 2000, blocked: false,
    } as any);

    await (service as any).gradeOne(submissionId);

    expect(submissionModel.__store.get(submissionId).status).toBe(JudgeStatus.TLE);
  });

  it('classifies RE on a runtime error (nonzero exit code)', async () => {
    const submissionId = new Types.ObjectId().toString();
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: { _id: submissionId, exerciseId, status: JudgeStatus.QUEUED, code: 'boom', attempts: 0 },
    });
    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));

    syntaxSpy = jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
    runSpy = jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue({
      stdout: '', stderr: 'ZeroDivisionError', exitCode: 1, timedOut: false, executionTimeMs: 5, blocked: false,
    } as any);

    await (service as any).gradeOne(submissionId);

    expect(submissionModel.__store.get(submissionId).status).toBe(JudgeStatus.RE);
  });

  it('classifies CE on a syntax error and never calls runPythonCode', async () => {
    const submissionId = new Types.ObjectId().toString();
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: { _id: submissionId, exerciseId, status: JudgeStatus.QUEUED, code: 'def f(:', attempts: 0 },
    });
    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));

    syntaxSpy = jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: false, errorMessage: 'SyntaxError: invalid syntax' });
    runSpy = jest.spyOn(codeRunner, 'runPythonCode');

    await (service as any).gradeOne(submissionId);

    const finalDoc = submissionModel.__store.get(submissionId);
    expect(finalDoc.status).toBe(JudgeStatus.CE);
    expect(finalDoc.results).toEqual([]);
    expect(runSpy).not.toHaveBeenCalled();
  });

  it('does not double-grade when gradeOne is invoked twice concurrently for the same id', async () => {
    const submissionId = new Types.ObjectId().toString();
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: { _id: submissionId, exerciseId, status: JudgeStatus.QUEUED, code: 'ok', attempts: 0 },
    });
    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));

    syntaxSpy = jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
    runSpy = jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue({
      stdout: '8', stderr: '', exitCode: 0, timedOut: false, executionTimeMs: 5, blocked: false,
    } as any);

    await Promise.all([
      (service as any).gradeOne(submissionId),
      (service as any).gradeOne(submissionId),
    ]);

    // Only the winner of the atomic QUEUED->RUNNING transition should have graded at all —
    // one runPythonCode call per test case, not double (would be 4 if both callers graded).
    expect(runSpy).toHaveBeenCalledTimes(sumExercise.testCases.length);
    const finalDoc = submissionModel.__store.get(submissionId);
    expect(finalDoc.results).toHaveLength(sumExercise.testCases.length);
  });

  it('retryStale requeues a stale RUNNING submission back to QUEUED', async () => {
    const submissionId = new Types.ObjectId().toString();
    const staleDate = new Date(Date.now() - 60_000);
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: {
        _id: submissionId,
        exerciseId,
        status: JudgeStatus.RUNNING,
        code: 'ok',
        attempts: 1,
        updatedAt: staleDate,
      },
    });
    submissionModel.find = jest.fn((filter: any) => ({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(
          [...submissionModel.__store.values()].filter((d: any) => {
            if (filter.status && d.status !== filter.status) return false;
            if (filter.updatedAt?.$lt && !(d.updatedAt < filter.updatedAt.$lt)) return false;
            if (filter.attempts?.$lt !== undefined && !(d.attempts < filter.attempts.$lt)) return false;
            return true;
          }),
        ),
      }),
    }));

    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));
    syntaxSpy = jest.spyOn(codeRunner, 'checkPythonSyntax').mockResolvedValue({ ok: true });
    runSpy = jest.spyOn(codeRunner, 'runPythonCode').mockResolvedValue({
      stdout: '8', stderr: '', exitCode: 0, timedOut: false, executionTimeMs: 5, blocked: false,
    } as any);

    await service.retryStale();

    // requeued -> drained -> graded to a terminal state (not left RUNNING).
    const finalDoc = submissionModel.__store.get(submissionId);
    expect(finalDoc.status).not.toBe(JudgeStatus.RUNNING);
  });

  it('retryStale marks a submission FAILED once it exceeds the retry cap', async () => {
    const submissionId = new Types.ObjectId().toString();
    const staleDate = new Date(Date.now() - 60_000);
    const submissionModel = makeFakeSubmissionModel({
      [submissionId]: {
        _id: submissionId,
        exerciseId,
        status: JudgeStatus.RUNNING,
        code: 'ok',
        attempts: 3,
        updatedAt: staleDate,
      },
    });
    submissionModel.updateMany = jest.fn(async (filter: any, update: any) => {
      let modifiedCount = 0;
      for (const doc of submissionModel.__store.values()) {
        if (doc.status === filter.status && doc.updatedAt < filter.updatedAt.$lt && doc.attempts >= filter.attempts.$gte) {
          Object.assign(doc, update.$set);
          modifiedCount++;
        }
      }
      return { modifiedCount };
    });

    const service = await buildService(submissionModel, makeFakeExerciseModel(sumExercise));

    await service.retryStale();

    expect(submissionModel.__store.get(submissionId).status).toBe(JudgeStatus.FAILED);
  });
});
