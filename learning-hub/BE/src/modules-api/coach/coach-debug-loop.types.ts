/**
 * Debug Loop v0.1 — kiểu dữ liệu thuần, không phụ thuộc Mongoose/HTTP.
 *
 * Mục tiêu (điều kiện nghiệm thu ngày 17):
 * - Input là kết quả test THẬT (SubmissionTestResult), không phải mô tả do
 *   model tự tưởng tượng ra — mọi feedback phải trích dẫn được input/expected/
 *   actual/stderr thật từ đây.
 * - Có giới hạn tối đa số vòng lặp thử-sai cho một bài, để tránh học viên (hoặc
 *   AI) lặp vô hạn mà không tiến triển.
 *
 * Vì là module thuần (không DI, không DB), ngày 18 có thể gọi thẳng hàm
 * `analyzeDebugLoop` với hàng trăm fixture để làm eval harness mà không cần
 * dựng lại NestJS TestingModule hay mock Mongoose.
 */

export type DebugErrorCategory =
  | 'COMPILE_SYNTAX'
  | 'RUNTIME_EXCEPTION'
  | 'TIMEOUT'
  | 'WRONG_OUTPUT'
  | 'PASSED';

/**
 * Bản rút gọn của SubmissionTestResult — chỉ giữ field cần cho việc phân loại
 * lỗi và trích dẫn bằng chứng, tránh coupling trực tiếp vào schema Mongoose.
 */
export interface DebugLoopTestInput {
  status: string; // 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'FAILED' | ...
  passedCount: number;
  totalCount: number;
  errorMessage?: string;
  firstFailingTest?: {
    index: number;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    stderr?: string;
    isHidden?: boolean;
  };
}

/**
 * Trạng thái vòng lặp cho một cặp (userId, exerciseSlug), do caller (service)
 * duy trì/truyền vào — module này không tự lưu trữ gì.
 */
export interface DebugLoopState {
  attemptsSoFar: number; // số lần đã thử TRƯỚC lần submit hiện tại
}

export interface DebugLoopResult {
  errorCategory: DebugErrorCategory;
  // Bằng chứng trích dẫn nguyên văn từ test thật — dùng để hiển thị kèm
  // feedback, không cho phép feedback đứng một mình mà không có evidence khi
  // có lỗi (điều kiện "feedback trích test công khai hoặc lỗi thật").
  evidence: {
    testIndex?: number;
    isHiddenTest?: boolean;
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    stderrExcerpt?: string;
  } | null;
  feedback: string;
  nextStep: string;
  loopCount: number; // = attemptsSoFar + 1 (lần hiện tại)
  loopLimitReached: boolean;
  maxLoops: number;
}
