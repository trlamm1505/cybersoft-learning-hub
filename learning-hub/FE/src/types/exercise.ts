export interface ExerciseListItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  starterCode: string;
  timeLimitMs: number;
}

export interface ExerciseTestCase {
  input: string;
  expectedOutput?: string;
  isHidden: boolean;
}

export interface ExerciseDetail extends ExerciseListItem {
  testCases: ExerciseTestCase[];
  hiddenTestCount: number;
}

export interface RunCodeResponse {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  executionTimeMs: number;
  blocked: boolean;
}

export interface SubmissionTestResult {
  index: number;
  passed: boolean;
  isHidden: boolean;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  stderr?: string;
  executionTimeMs?: number;
}

export type SubmissionStatus =
  | 'PASSED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'PENDING';

export interface SubmitCodeResponse {
  _id: string;
  exerciseId: string;
  code: string;
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  results: SubmissionTestResult[];
  errorMessage?: string;
}
