/** Kết quả điểm tổng kết (BE domain/final-grade.ts), thang 100. */
export interface FinalGrade {
  studentId: string;
  assignmentAvg: number | null;
  contestAvg: number | null;
  examScore: number | null;
  droppedAssignmentId: string | null;
  missedAssignments: number;
  totalAssignments: number;
  weights: { assignment: number; contest: number; exam: number };
  finalScore: number;
  letter: 'A' | 'B' | 'C' | 'D' | 'F';
  locked: boolean;
  lockReason: string | null;
  pending: number;
  provisional: boolean;
}

export interface ClassFinalGrades {
  classId: string;
  /** 0 = lớp chưa có bài đánh giá nào. */
  assessmentCount: number;
  students: FinalGrade[];
}

export interface KidProgressRow {
  studentId: string;
  fullName: string;
  currentLevel: number;
  /** Số sao = số màn bé đã hoàn thành (đúng con số trên hồ sơ của bé). */
  starsEarned: number;
  levelsDone: number;
  levelsTotal: number;
  lastActiveAt: string | null;
  stuckAlert: { active: boolean; level: number | null; since: string | null };
}

export type TesterRating = 'EXCELLENT' | 'GOOD' | 'PASS' | 'NEEDS_WORK' | 'NONE';

/** Một dòng bảng xếp hạng & tiến độ lớp Tester QA (GET /teacher/classes/:classId/tester/roster). */
export interface TesterRosterRow {
  rank: number | null;
  studentId: string;
  fullName: string;
  email: string;
  labsCompleted: number;
  labsTotal: number;
  avgScore: number | null;
  rating: TesterRating;
  ratingLabel: string;
  pending: number;
}

export interface TesterRoster {
  classId: string;
  labsTotal: number;
  students: TesterRosterRow[];
}

export interface TesterStudentSubmission {
  id: string;
  lab: { labCode: string; title: string };
  status: 'SUBMITTED' | 'REVIEWED' | 'INVALIDATED';
  submittedAt: string;
  total: number | null;
  criteria: Array<{ key: string; label: string; max: number; score: number | null }>;
  feedback: string;
  isFinalized: boolean;
  testCaseCount: number;
  bugReportCount: number;
}

export interface TesterStudentDetail {
  student: { id: string; fullName: string; email: string };
  summary: Omit<TesterRosterRow, 'rank' | 'studentId' | 'fullName' | 'email'>;
  submissions: TesterStudentSubmission[];
}

/** Một bài nộp Tester Lab để giảng viên đọc (GET /teacher/tester-labs/submissions/:id). */
export interface TesterSubmissionDetail {
  id: string;
  status: 'SUBMITTED' | 'REVIEWED' | 'INVALIDATED';
  submittedAt: string;
  lab: { labCode: string; title: string };
  student: { id: string; fullName: string; email: string };
  formData: {
    testCases: Array<{ code: string; description: string; input: string; expected: string }>;
    bugReports: Array<{ title: string; steps: string; expected: string; actual: string; severity: string }>;
  } | null;
  total: number | null;
  criteria: Array<{ key: string; label: string; max: number; score: number | null }>;
  feedback: string;
  isFinalized: boolean;
}

/** Lớp Data SQL Lab / AI Prompt Lab (GET /teacher/classes/:classId/career/...). */
export interface CareerRosterRow {
  rank: number | null;
  studentId: string;
  fullName: string;
  email: string;
  labsCompleted: number;
  labsAttempted: number;
  labsTotal: number;
  avgScore: number | null;
  rating: TesterRating;
  ratingLabel: string;
  attempts: number;
  pending: number;
}

export interface CareerRoster {
  classId: string;
  courseKey: 'data-sql' | 'ai-prompt';
  labsTotal: number;
  students: CareerRosterRow[];
}

export interface CareerLabEntry {
  slug: string;
  title: string;
  type: 'SQL' | 'INSIGHT' | 'AI_LAB';
  status: string;
  attempts: number;
  score: number;
  maxScore: number;
  percent: number | null;
  passed: boolean;
  pendingReview: boolean;
  lastAt: string | null;
  /** Câu SQL (Data) hoặc prompt (AI) đã nộp. */
  content: string;
  feedback: string;
  history: Array<{ content: string; score: number | null; maxScore: number | null; status: string; at: string | null }>;
}

export interface CareerStudentDetail {
  courseKey: 'data-sql' | 'ai-prompt';
  student: { id: string; fullName: string; email: string };
  summary: Omit<CareerRosterRow, 'rank' | 'studentId' | 'fullName' | 'email'>;
  labs: CareerLabEntry[];
}
