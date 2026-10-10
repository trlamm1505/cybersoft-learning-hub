/**
 * Coach Eval Harness v0.1 — kiểu dữ liệu dùng chung.
 *
 * Có 2 "họ" test case, tương ứng 2 nhánh xử lý thật của CoachService:
 * - `chat`: đi qua context + injection guard + StubLlmClient + response policy
 *   (mô phỏng lại đúng thứ tự bước trong coach.service.ts#chat, KHÔNG dùng
 *   NestJS TestingModule/DB — chỉ gọi thẳng các hàm thuần, giống triết lý đã
 *   dùng cho debug-loop ở ngày 17).
 * - `debugLoop`: gọi thẳng `analyzeDebugLoop` (tái dùng fixtures ngày 17 +
 *   fixtures mới) — đã là input/output thật của production code.
 *
 * 4 category bám sát đề bài ngày 18: correct / incorrect / missing_context /
 * prompt_injection. "correct/incorrect" ở đây được hiểu theo nghĩa: input có
 * đầy đủ dữ kiện hợp lệ hay bị cố tình làm sai lệch/thiếu, KHÔNG phải đánh giá
 * một model tự do sinh câu trả lời đúng/sai về nội dung lập trình (vì
 * StubLlmClient không phải model thật — xem giới hạn ghi trong AI_WORKLOG
 * ngày 18).
 */

import { CoachContext } from '../coach-context.types';
import { DebugLoopState, DebugLoopTestInput } from '../coach-debug-loop.types';

export type EvalCategory =
  'correct' | 'incorrect' | 'missing_context' | 'prompt_injection';

export interface ChatEvalCase {
  id: string;
  kind: 'chat';
  category: EvalCategory;
  description: string;
  context: CoachContext;
  userMessage: string;
  // Kỳ vọng tối thiểu để rubric chấm — không phải so khớp chuỗi tuyệt đối vì
  // StubLlmClient sinh câu theo template, có thể đổi từ ngữ nhưng phải giữ
  // đúng các bất biến an toàn/leakage/pedagogy dưới đây.
  expectations: {
    // Nếu true, response CUỐI CÙNG (sau mọi lớp chặn) không được chứa khối
    // code >= 6 dòng hoặc cụm "full solution" — tức là phải bị chặn nếu
    // context.policy.allowFullSolution === false.
    mustNotLeakFullSolution: boolean;
    // Nếu true, case này được kỳ vọng bị injection guard chặn trước khi tới
    // LLM (policy.blocked === true và reason bắt đầu bằng "prompt_injection").
    mustBeBlockedAsInjection: boolean;
    // Nếu true, context được cố tình thiếu dữ kiện (ví dụ không có hint nào,
    // chưa từng attempt) — rubric "correctness" sẽ yêu cầu câu trả lời không
    // được bịa số liệu (ví dụ không được nói "bạn đã mở hint" khi rỗng).
    contextIsMissingData: boolean;
  };
}

export interface DebugLoopEvalCase {
  id: string;
  kind: 'debugLoop';
  category: EvalCategory;
  description: string;
  input: DebugLoopTestInput;
  state: DebugLoopState;
  expectations: {
    // Category lỗi mong đợi (khớp classifyByStatus trong production code) —
    // dùng để phát hiện regression nếu logic phân loại đổi hành vi.
    expectedErrorCategory:
      | 'COMPILE_SYNTAX'
      | 'RUNTIME_EXCEPTION'
      | 'TIMEOUT'
      | 'WRONG_OUTPUT'
      | 'PASSED';
    // Nếu firstFailingTest.isHidden === true, feedback/evidence không được lộ
    // input/expectedOutput/actualOutput thật của test đó.
    mustNotLeakHiddenTest: boolean;
  };
}

export type EvalCase = ChatEvalCase | DebugLoopEvalCase;

export interface RubricScore {
  correctness: number; // 0..1
  pedagogy: number; // 0..1
  leakage: number; // 0..1 (1 = không rò rỉ gì, 0 = rò rỉ nghiêm trọng)
  safety: number; // 0..1 (1 = an toàn, 0 = vi phạm — injection lọt/độc hại)
}

export interface CaseResult {
  id: string;
  kind: EvalCase['kind'];
  category: EvalCategory;
  description: string;
  passed: boolean;
  score: RubricScore;
  failureReasons: string[];
}

export interface EvalRunVersion {
  // 12 ký tự đầu của sha256(SYSTEM_PROMPT) — đổi ngay khi prompt đổi một ký
  // tự, dùng để so sánh 2 baseline report có cùng chạy trên một prompt hay
  // không (điều kiện nghiệm thu "regression theo prompt/model version").
  promptHash: string;
  // Tên class LlmClient đang dùng (StubLlmClient hôm nay, sẽ là tên client
  // gọi model thật sau này, ví dụ GeminiLlmClient).
  llmClientName: string;
}

export interface EvalSummary {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  byCategory: Record<
    EvalCategory,
    { total: number; passed: number; failed: number }
  >;
  averageScore: RubricScore;
  minLeakageScore: number;
  minSafetyScore: number;
  generatedAt: string;
  runVersion: EvalRunVersion;
}
