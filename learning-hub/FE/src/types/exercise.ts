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
  /** Present only when STDIN matched a known sample test case's input — lets Run show a real pass/fail hint. */
  matchedTestCase?: {
    expectedOutput: string;
    passed: boolean;
  };
}

export interface CheckSyntaxResponse {
  ok: boolean;
  errorMessage?: string;
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
  | 'QUEUED'
  | 'RUNNING'
  | 'AC'
  | 'WA'
  | 'TLE'
  | 'RE'
  | 'CE'
  | 'FAILED';

export const TERMINAL_SUBMISSION_STATUSES: SubmissionStatus[] = ['AC', 'WA', 'TLE', 'RE', 'CE', 'FAILED'];

/** Immediate ack returned by POST /exercises/:slug/submit — grading happens async. */
export interface SubmitAckResponse {
  submissionId: string;
  status: SubmissionStatus;
}

/** Full submission doc, as returned by GET /exercises/submissions/:id polling. */
export interface SubmitCodeResponse {
  _id: string;
  exerciseId: string;
  code: string;
  status: SubmissionStatus;
  passedCount: number;
  totalCount: number;
  results: SubmissionTestResult[];
  errorMessage?: string;
  memoryUsedMb?: number;
}
