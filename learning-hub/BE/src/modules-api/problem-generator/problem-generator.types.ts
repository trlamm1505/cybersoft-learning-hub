// Shape của yêu cầu sinh đề: learning outcome, mức độ, và các ràng buộc đề
// bài ngày 19 yêu cầu ("Tạo prompt từ learning outcome, level, constraints").
export interface ProblemSpec {
  id: string;
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
}
