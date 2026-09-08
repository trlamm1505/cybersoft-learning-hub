export interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

export interface QuizOption {
  key: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  content: string;
  codeSnippet?: string;
  options: QuizOption[];
  explanation?: string;
  points?: number;
}

export interface LessonHints {
  hint1?: string;
  hint2?: string;
  hint3?: string;
}

export interface LessonAuthoring {
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  type: 'coding' | 'quiz';
  status: 'draft' | 'published';
  learningOutcome: string;
  content?: string;
  starterCode?: string;
  solutionCode?: string;
  difficulty: string;
  points: number;
  authorId?: string;
  testCases: TestCase[];
  quizQuestions: QuizQuestion[];
  hints?: LessonHints;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportLessonPayload {
  version?: string;
  lessonData: Partial<LessonAuthoring>;
}
