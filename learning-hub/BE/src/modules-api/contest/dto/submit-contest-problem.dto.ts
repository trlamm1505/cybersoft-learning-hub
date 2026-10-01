// studentId/studentName không còn nhận từ client — lấy từ Bearer token
// (@CurrentUser()) ở controller để không ai nộp bài thi mạo danh học viên khác.
export class SubmitContestProblemDto {
  problemSlug: string;
  code?: string; // coding submissions
  quizAnswers?: Record<string, string>; // quiz submissions: questionIndex -> selectedKey
}
