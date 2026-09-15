export class SubmitContestProblemDto {
  studentId: string;
  studentName?: string;
  problemSlug: string;
  code?: string; // coding submissions
  quizAnswers?: Record<string, string>; // quiz submissions: questionIndex -> selectedKey
}
