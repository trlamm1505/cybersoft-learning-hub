export type AssignmentState = 'DONE' | 'EXPIRED' | 'NOT_OPEN' | 'IN_PROGRESS' | 'NOT_STARTED';

export interface ClassAssignmentRow {
  id: string;
  type: 'CODING' | 'QUIZ';
  title: string;
  exerciseSlug: string | null;
  questionCount: number | null;
  maxPoints: number;
  startAt: string;
  dueAt: string;
  state: AssignmentState;
  /** Khóa = chưa mở hoặc đã hết hạn mà chưa hoàn thành. */
  locked: boolean;
  done: boolean;
  /** Điểm đã đạt (null nếu chưa hoàn thành). */
  score: number | null;
  wrongCount: number;
  attempts: number;
  /** Điểm sẽ nhận nếu AC ngay (mỗi lần nộp sai trừ 1 điểm). */
  potentialScore: number;
  completedAt: string | null;
}

export interface ClassDay {
  date: string;
  dayNumber: number;
  totalCount: number;
  doneCount: number;
  pendingCount: number;
  assignments: ClassAssignmentRow[];
}

export interface ClassOverview {
  class: {
    id: string;
    name: string;
    code: string | null;
    description: string;
    memberCount: number;
    teacher: { name: string; email: string; avatar: string | null } | null;
  };
  progress: { done: number; total: number; percent: number; points: number; maxPoints: number };
  myRank: { rank: number; of: number } | null;
  days: ClassDay[];
}

export interface ClassLeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  avatar: string | null;
  points: number;
  doneCount: number;
  lastScoredAt: string | null;
  isMe: boolean;
}

export interface ClassLeaderboard {
  classId: string;
  rows: ClassLeaderboardRow[];
}

export interface MyAssignment extends ClassAssignmentRow {
  classId: string;
  className: string;
}
