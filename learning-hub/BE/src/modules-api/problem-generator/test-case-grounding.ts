import { outputsMatch, runPythonCode, checkPythonSyntax } from '../../common/helper/code-runner.helper';
import type { ProblemDraft, ProblemDraftTestCase } from './problem-generator.types';

export const MIN_GROUNDED_CASES = 2;

export interface GroundingReport {
  /** Số test case được chạy lại bằng lời giải mẫu. */
  checked: number;
  /** Số test case mà expectedOutput do mô hình viết KHÁC kết quả chạy thật (đã được sửa theo kết quả thật). */
  corrected: number;
  /** Số test case bị bỏ vì lời giải mẫu chạy lỗi / quá giờ trên input đó. */
  dropped: number;
}

export class GroundingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GroundingError';
  }
}

export interface Runner {
  syntax: typeof checkPythonSyntax;
  run: typeof runPythonCode;
}

const defaultRunner: Runner = { syntax: checkPythonSyntax, run: runPythonCode };

const normalize = (s: string) => s.replace(/\r\n/g, '\n').trimEnd();

/**
 * Chống "ảo giác" ở test case: LLM viết đúng lời giải nhưng hay NHẨM SAI expectedOutput (vd bịa ra số 48 không có trong dãy input).
 * Vì vậy expectedOutput do mô hình viết KHÔNG được tin: chạy lời giải mẫu (solutionCode) với từng input trên runner nội bộ và lấy
 * stdout THẬT làm expectedOutput. Test case luôn khớp tuyệt đối với lời giải trước khi vào ngân hàng đề.
 *
 * - Lời giải sai cú pháp, hoặc không còn đủ test case chạy được -> GroundingError (bài bị loại, không lưu gì).
 * - Input mà lời giải chạy lỗi/quá giờ -> bỏ test case đó (ghi vào báo cáo).
 */
export async function groundTestCases(draft: ProblemDraft, runner: Runner = defaultRunner): Promise<{ draft: ProblemDraft; report: GroundingReport }> {
  const syntax = await runner.syntax(draft.solutionCode);
  if (!syntax.ok) throw new GroundingError(`Lời giải mẫu sai cú pháp nên không thể tạo test case: ${syntax.errorMessage ?? 'lỗi cú pháp'}`);

  const kept: ProblemDraftTestCase[] = [];
  let corrected = 0;
  let dropped = 0;
  for (const tc of draft.testCases) {
    const input = typeof tc.input === 'string' ? tc.input : String(tc.input ?? '');
    const run = await runner.run(draft.solutionCode, input);
    if (run.blocked || run.timedOut || run.exitCode !== 0) {
      dropped++;
      continue;
    }
    const actual = normalize(run.stdout);
    if (!outputsMatch(actual, normalize(String(tc.expectedOutput ?? '')))) corrected++;
    kept.push({ input, expectedOutput: actual, isHidden: tc.isHidden === true });
  }

  if (kept.length < MIN_GROUNDED_CASES) {
    throw new GroundingError(`Lời giải mẫu chỉ chạy được ${kept.length}/${draft.testCases.length} test case (cần tối thiểu ${MIN_GROUNDED_CASES}); đã loại bài để không lưu test sai.`);
  }
  // Phải còn ít nhất một test hiện cho học viên và một test ẩn để chấm.
  if (!kept.some((t) => !t.isHidden)) kept[0] = { ...kept[0], isHidden: false };
  if (!kept.some((t) => t.isHidden)) kept[kept.length - 1] = { ...kept[kept.length - 1], isHidden: true };

  return { draft: { ...draft, testCases: kept }, report: { checked: draft.testCases.length, corrected, dropped } };
}
