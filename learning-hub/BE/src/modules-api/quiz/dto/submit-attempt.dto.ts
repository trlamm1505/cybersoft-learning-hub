export class StudentAnswerItem {
  questionId: string;
  selectedOptionKey: string; // e.g. 'A', 'B', 'C', 'D'
}

export class SubmitAttemptDto {
  answers: StudentAnswerItem[];
}
