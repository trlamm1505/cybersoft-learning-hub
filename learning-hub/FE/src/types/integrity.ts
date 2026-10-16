/** Tín hiệu liêm chính (Ngày 24). Chỉ hỗ trợ giảng viên xem xét, không tự kết luận. */

export type IntegrityFlag = 'NONE' | 'REVIEW';
export type IntegrityReviewStatus = 'NORMAL' | 'NEEDS_REVIEW' | 'REVIEWED';
export type IntegrityDecision = 'CLEARED' | 'CONCERN' | 'FOLLOW_UP';

/** Payload tối thiểu client gửi kèm khi nộp bài. */
export interface IntegrityClientPayload {
  startedAt: string;
  editMarks: Array<{ at: string; charCount: number }>;
  focusEvents: Array<{ leftAt: string; returnedAt: string }>;
}

export interface IntegritySignals {
  timeline: {
    startedAt: string;
    submittedAt: string;
    editMarks: Array<{ at: string; charCount: number }>;
    totalSeconds: number;
    activeSeconds: number;
  };
  focusEvents: Array<{ leftAt: string; returnedAt: string; awaySeconds: number }>;
  focusSummary: { count: number; totalAwaySeconds: number };
  similarity: {
    score: number;
    matchedSubmissionId?: string;
    matchedUserId?: string;
    flagged: boolean;
  };
  flag: IntegrityFlag;
  reasons: string[];
  reviewStatus: IntegrityReviewStatus;
  decision?: IntegrityDecision;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface IntegrityQueueRow {
  id: string;
  submittedAt: string;
  judgeStatus: string;
  student: { id: string; fullName?: string; email?: string };
  exercise: { id: string; slug?: string; title?: string };
  integrity: IntegritySignals;
}

export interface IntegrityDetail extends IntegrityQueueRow {
  code: string;
  match: {
    submissionId: string;
    student: { id: string; fullName?: string; email?: string };
    code: string;
  } | null;
}
