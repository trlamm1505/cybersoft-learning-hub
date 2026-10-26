// Shape của yêu cầu sinh đề: learning outcome, mức độ, và các ràng buộc đề
// bài ngày 19 yêu cầu ("Tạo prompt từ learning outcome, level, constraints").
export interface ProblemSpec {
  id: string;
  /** Khối đối tượng: quyết định chỉ thị sư phạm gửi cho mô hình và nhãn lưu trên bài. */
  band?: '6-9' | '10-12';
  learningOutcome: string;
  level: 'EASY' | 'MEDIUM' | 'HARD';
  constraints: string[];
  tags: string[];
}

// Test case ở dạng draft, cùng shape với ExerciseTestCase trong
// exercise.schema.ts để bản nháp có thể insert thẳng vào collection
// `exercises` sau khi người review chấp nhận, không cần chuyển đổi field.
export interface ProblemDraftTestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

// Bản nháp bài + test theo đúng schema Exercise (title, description,
// difficulty, testCases, starterCode, solutionCode, tags) — KHÔNG có _id/slug
// đã tồn tại trong DB, vì đây là draft chưa publish.
export interface ProblemDraft {
  specId: string;
  title: string;
  slug: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  starterCode: string;
  solutionCode: string;
  testCases: ProblemDraftTestCase[];
  /** Bản sinh bởi AI luôn là DRAFT; chỉ xuất bản khi giảng viên bấm Duyệt & Lưu. */
  status?: 'DRAFT';
  /** Khối đối tượng của đề ('6-9' | '10-12'); lưu vào ngân hàng đề dưới dạng targetGroup K6_9 / K10_12. */
  band?: '6-9' | '10-12';
  /** Kết quả đối chiếu test case với lời giải mẫu (expectedOutput lấy từ kết quả chạy thật). */
  grounding?: { checked: number; corrected: number; dropped: number };
}
