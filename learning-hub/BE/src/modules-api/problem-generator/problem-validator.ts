import {
  checkPythonSyntax,
  outputsMatch,
  runPythonCode,
} from '../../common/helper/code-runner.helper';
import { DuplicateMatch, findDuplicateCandidates } from './problem-duplicate-check';
import { ProblemDraft } from './problem-generator.types';

export interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
}

export interface ValidationResult {
  specId: string;
  slug: string;
  title: string;
  syntaxOk: boolean;
  syntaxError?: string;
  testResults: TestCaseResult[];
  allTestsPassed: boolean;
  duplicateCandidates: DuplicateMatch[];
  // true chỉ khi cú pháp hợp lệ, solution pass mọi test, và không có nghi vấn
  // trùng lặp vượt ngưỡng — điều kiện nghiệm thu "reference solution pass mọi
  // test" của đề bài ngày 19. KHÔNG bao gồm việc publish, đây chỉ là điều
  // kiện để đưa bài vào diện chờ người review duyệt thủ công.
  readyForReview: boolean;
}

/**
 * Chạy solutionCode của một draft qua toàn bộ testCases bằng đúng hàm chấm
 * production (`runPythonCode`, cùng hàm judge-queue.service.ts dùng để chấm
 * bài học viên thật), rồi gắn thêm cảnh báo trùng lặp. KHÔNG ghi gì vào DB —
 * chỉ trả về báo cáo để người review đọc, đúng điều kiện "không publish tự
 * động".
 */
export async function validateProblemDraft(
  draft: ProblemDraft,
): Promise<ValidationResult> {
  const syntaxCheck = await checkPythonSyntax(draft.solutionCode);

  const testResults: TestCaseResult[] = [];

  if (syntaxCheck.ok) {
    for (let i = 0; i < draft.testCases.length; i++) {
      const tc = draft.testCases[i];
      const run = await runPythonCode(draft.solutionCode, tc.input);
      const actualOutput = run.stdout.replace(/\r\n/g, '\n').trim();
      const expectedNormalized = tc.expectedOutput.replace(/\r\n/g, '\n').trim();
      const passed =
        !run.blocked &&
        !run.timedOut &&
        run.exitCode === 0 &&
        outputsMatch(actualOutput, expectedNormalized);

      testResults.push({
        index: i,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput,
        passed,
        isHidden: tc.isHidden,
      });
    }
  }

  const allTestsPassed =
    syntaxCheck.ok &&
    testResults.length > 0 &&
    testResults.every((r) => r.passed);

  const duplicateCandidates = findDuplicateCandidates(draft);

  return {
    specId: draft.specId,
    slug: draft.slug,
    title: draft.title,
    syntaxOk: syntaxCheck.ok,
    syntaxError: syntaxCheck.errorMessage,
    testResults,
    allTestsPassed,
    duplicateCandidates,
    readyForReview: allTestsPassed && duplicateCandidates.length === 0,
  };
}
