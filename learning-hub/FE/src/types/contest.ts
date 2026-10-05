export type ContestProblemSource = 'lesson' | 'exercise' | 'bank';

export interface ContestProblem {
  /** Nguồn đề: bài soạn, Code Playground hoặc ngân hàng câu hỏi (thiếu = bài soạn). */
  source?: ContestProblemSource;
  lessonId?: string;
  exerciseSlug?: string;
  questionIds?: string[];
  title: string;
  slug: string;
  type?: 'coding' | 'quiz';
  points?: number;
  order?: number;
}

export interface ContestRegistration {
  studentId: string;
  studentName?: string;
  registeredAt: string;
}

export interface ContestItem {
  _id?: string;
  title: string;
  slug: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  problems: ContestProblem[];
  registrations?: ContestRegistration[];
  status?: 'draft' | 'published';
  /** Bật tín hiệu liêm chính (thời gian, rời màn hình, tương đồng mã). Mặc định bật. */
  integrityEnabled?: boolean;
  authorId?: string;
  createdAt?: string;
  updatedAt?: string;

  // Computed fields from server response
  serverTime?: string;
  computedStatus?: 'UPCOMING' | 'ONGOING' | 'ENDED';
  statusText?: string;
  isRegistered?: boolean;
  registrationsCount?: number;
  /** Trạng thái lượt thi của chính học viên, do máy chủ giữ. */
  myAttemptStatus?: 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED';
}

export interface ContestStatusResponse {
  contestId: string;
  slug: string;
  title: string;
  serverTime: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  integrityEnabled?: boolean;
  computedStatus: 'UPCOMING' | 'ONGOING' | 'ENDED';
  statusText: string;
  isRegistered: boolean;
  isAllowedToJoin: boolean;
  isAllowedToSubmit: boolean;
  timeRemainingSeconds: number;
  countdownSeconds: number;
  message: string;
}

/** Lượt thi của học viên: đồng hồ do máy chủ giữ. */
export interface ContestAttemptView {
  startedAt: string;
  deadlineAt: string;
  finishedAt: string | null;
  finishReason: 'MANUAL' | 'TIMEOUT' | null;
  serverTime: string;
  durationMinutes: number;
  integrityEnabled: boolean;
}

export interface ContestMyResultRow {
  slug: string;
  title: string;
  type: 'coding' | 'quiz';
  maxPoints: number;
  submitted: boolean;
  resultHidden: boolean;
  score: number | null;
  verdict: string | null;
  passedCount: number | null;
  totalCount: number | null;
  submittedAt: string | null;
}

export interface ContestMyAttempt {
  attempt: ContestAttemptView | null;
  results: ContestMyResultRow[];
  totalScore: number;
  maxScore: number;
  scoreHidden?: boolean;
}

/** Kết quả theo thí sinh dành cho giảng viên. */
export type ContestParticipantStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'FINISHED' | 'EXPIRED';

export interface ContestParticipantRow {
  studentId: string;
  studentName: string;
  registeredAt: string;
  attemptId: string | null;
  status: ContestParticipantStatus;
  startedAt: string | null;
  finishedAt: string | null;
  totalScore: number;
  perProblem: Array<{ slug: string; score: number | null; verdict: string | null }>;
  integrity: {
    flag: 'NONE' | 'REVIEW';
    reviewStatus: 'NORMAL' | 'NEEDS_REVIEW' | 'REVIEWED';
    decision: 'CLEARED' | 'CONCERN' | 'FOLLOW_UP' | null;
    similarityScore: number;
    focusCount: number;
    awaySeconds: number;
    activeSeconds: number;
  } | null;
}

export interface ContestManageResults {
  contest: {
    id: string;
    slug: string;
    title: string;
    startTime: string;
    endTime: string;
    durationMinutes: number;
    integrityEnabled: boolean;
    problems: Array<{ slug: string; title: string; type: 'coding' | 'quiz'; maxPoints: number }>;
    maxScore: number;
  };
  summary: { registered: number; started: number; finished: number; needsReview: number };
  rows: ContestParticipantRow[];
}

export interface QuestionBankItem {
  id: string;
  content: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  hasCode: boolean;
}

export interface QuestionBank {
  categories: string[];
  items: QuestionBankItem[];
}

export interface ExerciseBankItem {
  slug: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  topic: string | null;
  testCaseCount: number;
}
