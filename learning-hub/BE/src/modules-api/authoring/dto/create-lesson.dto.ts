export class TestCaseDto {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export class QuizOptionDto {
  key: string;
  text: string;
  isCorrect: boolean;
}

export class QuizQuestionDto {
  content: string;
  codeSnippet?: string;
  options: QuizOptionDto[];
  explanation?: string;
  points?: number;
}

export class LessonHintsDto {
  hint1?: string;
  hint2?: string;
  hint3?: string;
}

// authorId KHÔNG có trong DTO — luôn lấy từ JWT (@CurrentUser) ở controller,
// không bao giờ tin client tự khai (IDOR: client có thể mạo danh chủ sở hữu
// khác nếu field này nhận thẳng từ request body).
export class CreateLessonDto {
  title: string;
  slug: string;
  description?: string;
  type: 'coding' | 'quiz';
  status?: 'draft' | 'published';
  learningOutcome?: string;
  content?: string;
  starterCode?: string;
  solutionCode?: string;
  difficulty?: string;
  points?: number;
  testCases?: TestCaseDto[];
  quizQuestions?: QuizQuestionDto[];
  hints?: LessonHintsDto;
  resource_id?: string;
  resource_version?: string;
}

