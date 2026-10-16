export type ProblemLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface ProblemSpecInput {
  learningOutcome: string;
  level: ProblemLevel;
  constraints: string[];
  tags: string[];
}

export interface GenerateProblemPayload {
  specs: ProblemSpecInput[];
}

export interface ProblemDraftTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ProblemDraft {
  specId: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemLevel;
  tags: string[];
  starterCode: string;
  solutionCode: string;
  testCases: ProblemDraftTestCase[];
}

export interface TestCaseResult {
  index: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  isHidden: boolean;
}

export interface DuplicateMatch {
  existingSlug: string;
  existingTitle: string;
  similarity: number;
  // true = trùng gần như tuyệt đối (slug/title khớp, hoặc similarity >=95%) —
  // KHÔNG thể override bằng forceSave. false = cảnh báo mềm, giáo viên có
  // thể tự xác nhận bỏ qua sau khi đối chiếu.
  isHardBlock: boolean;
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
  readyForReview: boolean;
  // true khi có >=1 duplicateCandidates[].isHardBlock — ẩn hoàn toàn tuỳ
  // chọn "xác nhận bỏ qua" trên UI trong trường hợp này.
  hasHardBlockDuplicate: boolean;
}

export interface GenerateProblemResultItem {
  generatorUsed: string;
  prompt: string;
  draft: ProblemDraft;
  validation: ValidationResult;
}

// Lỗi của một spec cụ thể trong lô sinh hàng loạt (partial success) —
// specIndex khớp lại đúng vị trí trong mảng specs đã gửi lên, để FE biết
// chính xác spec nào cần hiển thị nút "Thử lại".
export interface GenerateProblemErrorItem {
  specIndex: number;
  topic: string;
  reason: string;
}

export interface GenerateProblemResponse {
  results: GenerateProblemResultItem[];
  errors: GenerateProblemErrorItem[];
}

export interface SaveProblemResponse {
  slug: string;
}

// "Chạy lại test" cho draft đã tự sửa trực tiếp trên UI — response CHÍNH
// LÀ ValidationResult (không bọc thêm), cùng shape với validation trong
// GenerateProblemResultItem, để component render lại y hệt cách cũ.
export interface RevalidateProblemPayload {
  draft: ProblemDraft;
}

// forceSave/overrideReason: cơ chế human-in-the-loop — chỉ gửi khi giáo viên
// đã tick xác nhận bỏ qua cảnh báo trùng lặp MỀM (không áp dụng được cho
// hasHardBlockDuplicate, nút xác nhận không xuất hiện trong trường hợp đó).
export interface SaveProblemPayload {
  draft: ProblemDraft;
  forceSave?: boolean;
  overrideReason?: string;
}
