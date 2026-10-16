/** Kiểu dữ liệu DA Lab (Ngày 22), khớp với BE /da-labs/*. */

export type DaLabType = 'SQL_LAB' | 'DA_INSIGHT';

export interface InsightRubricCriterion {
  id: string;
  title: string;
  maxPoints: number;
  description: string;
}

export interface DaLab {
  _id: string;
  slug: string;
  title: string;
  description: string;
  type: DaLabType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  points: number;
  starterCode: string;
  orderInTopic: number;
  resource_id: string;
  insightRubric?: InsightRubricCriterion[];
}

/** Data dictionary do Data & AI Resource (TTS 01) cung cấp, không hardcode ở FE. */
export interface DatasetColumn {
  name: string;
  type: string;
  nullable: boolean;
  pk?: boolean;
  fk?: string | null;
  description: string;
}

export interface DatasetTable {
  name: string;
  description?: string;
  columns: DatasetColumn[];
}

export interface DatasetInfo {
  resource_id: string;
  dataset_name: string;
  version: string;
  data_dictionary: { tables: DatasetTable[] };
}

export interface SqlPreview {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  truncated: boolean;
}

export interface SqlRunResult {
  status: 'OK' | 'REJECTED' | 'SQL_ERROR';
  error?: string;
  result?: SqlPreview;
}

export interface SqlGradeResult {
  status: 'ACCEPTED' | 'WRONG_ANSWER' | 'REJECTED' | 'SQL_ERROR';
  score: number;
  maxScore: number;
  feedback: string;
  result?: SqlPreview;
}

export interface InsightCriterionResult {
  id: string;
  title: string;
  score: number;
  maxPoints: number;
  evidence: string;
  reasoning: string;
  flag?: string;
}

export interface InsightGradeResult {
  status: 'GRADED' | 'PENDING_REVIEW' | 'REJECTED';
  score: number;
  maxScore: number;
  feedback: string;
  criteria: InsightCriterionResult[];
}

/** Bài Insight chờ giảng viên chấm (GET /teacher/submissions/pending). */
export interface PendingInsightSubmission {
  id: string;
  status: 'PENDING_REVIEW';
  content: string;
  /** Lý do AI không chấm (guardrail từ chối, chưa có model, lỗi hệ thống). */
  aiExplanation: string;
  criteria: InsightCriterionResult[];
  maxScore: number;
  submittedAt: string;
  student: { id: string; fullName?: string; email?: string };
  exercise: {
    id: string;
    slug: string;
    title?: string;
    points?: number;
    insightRubric?: InsightRubricCriterion[];
  };
}

export interface TeacherReviewResult {
  id: string;
  status: 'GRADED';
  score: number;
  maxScore: number;
  teacherComment: string;
  reviewedAt: string;
}

/** Bài nộp Insight mới nhất của chính học viên (GET /da-labs/exercises/:id/my-submission). */
export interface MyDaSubmission {
  id: string;
  exerciseId: string;
  content: string;
  status: 'GRADED' | 'PENDING_REVIEW';
  score: number;
  maxScore: number;
  /** Nhận xét tổng của AI, hoặc lý do AI không chấm tự động. */
  aiExplanation?: string;
  criteria?: InsightCriterionResult[];
  teacherComment?: string;
  reviewedAt?: string;
  submittedAt: string;
}
