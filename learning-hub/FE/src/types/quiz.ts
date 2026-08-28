export interface QuestionOption {
  key: string;
  text: string;
  isCorrect?: boolean; // Included only during review phase
}

export interface QuestionItem {
  questionId: string;
  content: string;
  codeSnippet?: string;
  category?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  points?: number;
  options: QuestionOption[];
  selectedOptionKey?: string;
  correctOptionKey?: string; // Included only during review phase
  isCorrect?: boolean; // Included only during review phase
  scoreEarned?: number; // Included only during review phase
  explanation?: string; // Detailed pedagogical explanation
}

export interface QuizStartResponse {
  attemptId: string;
  testId: string;
  startedAt: string;
  timeLimitSeconds: number;
  status: 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'GRADED';
  questions: QuestionItem[];
}

export interface StudentAnswerItem {
  questionId: string;
  selectedOptionKey: string;
}

export interface QuizSubmitPayload {
  userId: string;
  answers: StudentAnswerItem[];
}

export interface QuizSubmitResponse {
  message: string;
  attemptId: string;
  status: string;
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt: string;
}

export interface QuizReviewResponse {
  attemptId: string;
  userId: string;
  testId: string;
  status: string;
  score: number;
  maxScore: number;
  startedAt: string;
  submittedAt?: string;
  reviewPolicyApplied: string;
  questions: QuestionItem[];
}
