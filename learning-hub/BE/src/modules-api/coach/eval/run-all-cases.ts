import { allEvalCases } from './coach-eval-cases';
import { runChatCase, runDebugLoopCase } from './coach-eval-runner';
import { scoreChatCase, scoreDebugLoopCase } from './coach-rubric';
import { CaseResult } from './eval-types';

export async function runAllCases(): Promise<CaseResult[]> {
  const results: CaseResult[] = [];

  for (const testCase of allEvalCases) {
    if (testCase.kind === 'chat') {
      const outcome = await runChatCase(testCase);
      const { score, passed, failureReasons } = scoreChatCase(
        testCase,
        outcome,
      );
      results.push({
        id: testCase.id,
        kind: testCase.kind,
        category: testCase.category,
        description: testCase.description,
        passed,
        score,
        failureReasons,
      });
    } else {
      const result = runDebugLoopCase(testCase);
      const { score, passed, failureReasons } = scoreDebugLoopCase(
        testCase,
        result,
      );
      results.push({
        id: testCase.id,
        kind: testCase.kind,
        category: testCase.category,
        description: testCase.description,
        passed,
        score,
        failureReasons,
      });
    }
  }

  return results;
}
