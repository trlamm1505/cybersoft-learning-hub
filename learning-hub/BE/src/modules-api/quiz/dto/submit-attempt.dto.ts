export class StudentAnswerItem {
  questionId: string;
  selectedOptionKey: string; // e.g. 'A', 'B', 'C', 'D'
}

export class SubmitAttemptDto {
  userId: string;
  answers: StudentAnswerItem[];
}
