/**
 * Một lượt nộp bài đã chấm xong, rút gọn từ Submission — chỉ giữ field cần để
 * tính mastery/recommendation, không kéo theo code/results/stderr.
 */
export interface GradedAttempt {
  exerciseId: string;
  tags: string[];
  status: string; // 'AC' | 'WA' | 'TLE' | 'RE' | 'CE' | 'FAILED' | 'QUEUED' | 'RUNNING'
  passedCount: number;
  totalCount: number;
  createdAt: Date;
}

export interface ExerciseSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  prerequisiteSlug?: string;
}

/** Mastery gộp theo tag: tỉ lệ AC trên tổng số lần nộp có liên quan tới tag đó. */
export interface TagMastery {
  tag: string;
  attemptCount: number;
  acCount: number;
  masteryPercent: number; // 0-100, làm tròn 1 chữ số thập phân
  lastAttemptStatus: string;
  lastAttemptAt: Date;
}

export type RecommendationReasonKind =
  | 'REMEDIATION'
  | 'PROGRESSION'
  | 'EXPLORATION';

export interface RecommendedExercise {
  exercise: ExerciseSummary;
  kind: RecommendationReasonKind;
  reason: string;
  tag: string;
}
