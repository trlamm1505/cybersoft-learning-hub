import {
  checkPythonSyntax,
  outputsMatch,
  runPythonCode,
} from '../../common/helper/code-runner.helper';
import {
  DuplicateMatch,
  ExistingExerciseForDuplicateCheck,
  findDuplicateCandidates,
  STATIC_FIXTURE_EXERCISES,
} from './problem-duplicate-check';
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
  // true khi có ít nhất 1 duplicateCandidates[].isHardBlock === true — giáo
  // viên KHÔNG được phép override/forceSave trong trường hợp này (khác với
  // cảnh báo mềm thông thường, vốn cho override sau khi tự xác nhận). FE
  // dùng field này để quyết định có hiện checkbox "Tôi xác nhận bỏ qua cảnh
  // báo" hay không.
  hasHardBlockDuplicate: boolean;
}

/**
 * Chạy solutionCode của một draft qua toàn bộ testCases bằng đúng hàm chấm
 * production (`runPythonCode`, cùng hàm judge-queue.service.ts dùng để chấm
 * bài học viên thật), rồi gắn thêm cảnh báo trùng lặp. KHÔNG ghi gì vào DB —
 * chỉ trả về báo cáo để người review đọc, đúng điều kiện "không publish tự
 * động".
 *
 * existingExercises: tập bài "đã có" dùng để đối chiếu trùng lặp — CALLER có
 * kết nối Mongo (ProblemGeneratorService) PHẢI truyền dữ liệu query trực
 * tiếp từ collection `exercises` đang chạy, để bài vừa được giáo viên khác
 * lưu cũng được đối chiếu. Tham số optional, mặc định fallback về 3 file
 * fixture tĩnh (STATIC_FIXTURE_EXERCISES) CHỈ để run-pipeline.ts (CLI script
 * không có NestJS DI/Mongoose connection) vẫn chạy được standalone.
 */
export async function validateProblemDraft(
  draft: ProblemDraft,
  existingExercises: ExistingExerciseForDuplicateCheck[] = STATIC_FIXTURE_EXERCISES,
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

  const duplicateCandidates = findDuplicateCandidates(draft, existingExercises);
  const hasHardBlockDuplicate = duplicateCandidates.some((d) => d.isHardBlock);

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
    hasHardBlockDuplicate,
  };
}
