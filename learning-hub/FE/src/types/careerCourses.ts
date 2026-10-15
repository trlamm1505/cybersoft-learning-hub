import type { EnrollmentCertificate, EnrollmentStatus } from './studentClasses';

export type CareerItemState = 'DONE' | 'PENDING' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface CareerLabItem {
  ref: string;
  title: string;
  /** Đường dẫn vào bài lab (vd /tester-labs/LAB-01). */
  path: string;
  state: CareerItemState;
  score: number | null;
  maxScore: number;
  lastSubmittedAt: string | null;
  feedback: string | null;
  feedbackBy: 'TEACHER' | 'SYSTEM' | null;
  attempts: number;
}

/** Một khóa học chuyên ngành của Người đi làm / Trái ngành (GET /student/career-courses). */
export interface CareerCourse {
  key: 'tester-qa' | 'data-sql' | 'ai-prompt';
  title: string;
  hubPath: string;
  teacherName: string | null;
  status: EnrollmentStatus;
  totalItems: number;
  attemptedItems: number;
  doneItems: number;
  percent: number;
  earned: number;
  max: number;
  items: CareerLabItem[];
  certificate: EnrollmentCertificate | null;
}
