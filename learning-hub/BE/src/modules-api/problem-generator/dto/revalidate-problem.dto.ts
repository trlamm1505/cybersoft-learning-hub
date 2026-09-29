import { ProblemDraft } from '../problem-generator.types';

// Dùng cho "Chạy lại test" sau khi giáo viên tự sửa draft trực tiếp trên UI
// (title/description/solutionCode/testCases) — draft ở đây có thể khác hoàn
// toàn với bản Gemini sinh ra ban đầu, service không tin bất kỳ field nào,
// chạy lại validator từ đầu.
export class RevalidateProblemDto {
  draft: ProblemDraft;
}
