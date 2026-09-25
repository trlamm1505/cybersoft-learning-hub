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

export interface BlockCommand {
  key: string;
  label: string;
  icon?: string;
}

export interface BlockPosition {
  x: number;
  y: number;
}

export interface BlockStartPosition extends BlockPosition {
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
}

export interface BlockPuzzleConfig {
  // Nhóm nhiều bài "ải" vào cùng một game trên màn hình chọn game của Block
  // Puzzle — nhiều bài chia sẻ cùng gameId sẽ xuất hiện chung một thẻ game.
  gameId: string;
  gameTitle: string;
  storyText: string;
  gridWidth: number;
  gridHeight: number;
  startPosition: BlockStartPosition;
  goalPosition: BlockPosition;
  obstacles: BlockPosition[];
  availableBlocks: BlockCommand[];
  maxBlocks: number;
  concept: 'sequence' | 'loop' | 'condition';
  successMessage: string;
  order: number;
}

export interface LessonAuthoring {
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  type: 'coding' | 'quiz' | 'block';
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
  blockPuzzle?: BlockPuzzleConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportLessonPayload {
  version?: string;
  lessonData: Partial<LessonAuthoring>;
}
