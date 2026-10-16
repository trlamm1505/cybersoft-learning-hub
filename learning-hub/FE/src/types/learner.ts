export interface TagMastery {
  tag: string;
  attemptCount: number;
  acCount: number;
  masteryPercent: number;
  lastAttemptStatus: string;
  lastAttemptAt: string;
}

export interface LearnerProgress {
  tagMastery: TagMastery[];
  totalAttempts: number;
}

export type RecommendationReasonKind = 'REMEDIATION' | 'PROGRESSION' | 'EXPLORATION';

export interface RecommendedExerciseSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  tags: string[];
  prerequisiteSlug?: string;
}

export interface RecommendedExercise {
  exercise: RecommendedExerciseSummary;
  kind: RecommendationReasonKind;
  reason: string;
  tag: string;
}

export interface LearnerRecommendations {
  recommendations: RecommendedExercise[];
}

/** Lượt nộp bài theo ngày (chỉ các ngày có hoạt động), dùng vẽ biểu đồ hoạt động ở trang cá nhân. */
export interface LearnerActivity {
  from: string;
  to: string;
  total: number;
  activeDays: number;
  days: Array<{ date: string; count: number }>;
}
