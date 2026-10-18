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
  tags?: string[];
  prerequisiteSlug?: string;
  gradeBand?: string;
  topic?: string;
  orderInTopic?: number;
  // Ma trận nhóm đối tượng x loại lab (bài cũ chưa có). Xem common/exerciseMatrix.ts.
  targetGroup?: 'K3_5' | 'K6_9' | 'K10_12' | 'CAREER_ADULT';
  labType?: 'PUZZLE_BLOCK' | 'PYTHON_CODE' | 'ALGO_JUDGE' | 'DATA_SQL' | 'AI_PROMPT' | 'TESTER_QA';
  /** Bài K3_5: câu chuyện dẫn dắt + ảnh minh họa. */
  storyContext?: string;
  illustrationUrl?: string;
  /** Bài DATA_SQL: dataset mẫu liên kết (vd sales_v1). */
  datasetId?: string;
  // Cờ trạng thái tính sẵn ở BE (ExerciseService.findAll) để hiển thị badge
  // Draft/Ready/Validated trên bank picker — không phải nội dung thật của
  // testCases/solutionCode (route này không trả field đó để không lộ đáp án).
  hasSolution?: boolean;
  testCaseCount?: number;
  // Có mặt khi bài đã từng được publish qua một Lesson (Teacher Authoring),
  // tức đã qua bước "Chọn từ Ngân hàng đề -> Xuất bản" ít nhất 1 lần.
  sourceLessonSlug?: string;
}

export interface ExerciseTestCase {
  input: string;
  expectedOutput?: string;
  isHidden: boolean;
}

export interface ExerciseDetail extends ExerciseListItem {
  testCases: ExerciseTestCase[];
  hiddenTestCount: number;
  hints?: {
    hint1?: string;
    hint2?: string;
    hint3?: string;
  };
}

// Bản đầy đủ CHỈ giáo viên xem được (GET /exercises/:slug/full) — có
// solutionCode thật và testCases KHÔNG bị lọc hidden, khác ExerciseDetail
// (bản học viên xem, luôn ẩn đáp án/test ẩn).
export interface ExerciseFullDetail extends Pick<ExerciseListItem, 'targetGroup' | 'labType' | 'storyContext' | 'illustrationUrl' | 'datasetId'> {
  /** Chỉ staff nhận được hai trường dưới đây; không bao giờ render ở giao diện học viên. */
  hiddenTestCases?: ExerciseTestCase[];
  officialSolution?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  authorId?: string;
  _id: string;
  title: string;
  slug: string;
  description: string;
  type: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  starterCode: string;
  solutionCode?: string;
  testCases: ExerciseTestCase[];
  tags?: string[];
  hints?: {
    hint1?: string;
    hint2?: string;
    hint3?: string;
  };
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

/** Trạng thái một bài trong lộ trình Playground, do MÁY CHỦ tính từ bài nộp AC (Day 31). */
export type PlaygroundStatus = 'completed' | 'available' | 'locked';

export interface PlaygroundExercise extends ExerciseListItem {
  /** Số thứ tự cố định #1..#N trong lộ trình của khối. */
  order: number;
  status: PlaygroundStatus;
}

/** Lộ trình Playground chuẩn của một khối: GET /exercises/playground. completed/total là con số duy nhất cho "X / N bài". */
export interface PlaygroundResponse {
  band: '6-9' | '10-12' | null;
  topic: string | null;
  total: number;
  completed: number;
  nextSlug: string | null;
  exercises: PlaygroundExercise[];
}
