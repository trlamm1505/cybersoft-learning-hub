export enum SubmissionStatus {
  PASSED = 'PASSED',
  WRONG_ANSWER = 'WRONG_ANSWER',
  TIME_LIMIT_EXCEEDED = 'TIME_LIMIT_EXCEEDED',
  MEMORY_LIMIT_EXCEEDED = 'MEMORY_LIMIT_EXCEEDED',
  COMPILE_ERROR = 'COMPILE_ERROR',
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  PENDING = 'PENDING',
}

export class Submissions {
  id: string;
  attemptId?: string;
  userId: string;
  exerciseId: string;
  testId?: string;
  code: string;
  status: SubmissionStatus;
  executionTimeMs?: number;
  memoryUsedMb?: number;
  errorMessage?: string;
  createdAt: Date;
}
