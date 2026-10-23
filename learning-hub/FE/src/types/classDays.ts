export type AssignmentWindow = 'UPCOMING' | 'OPEN' | 'EXPIRED';

/** Một bài trong một Ngày học của lớp (GET /teacher/class-assignments/:classId/days). */
export interface TeacherDayAssignment {
  id: string;
  type: 'CODING' | 'QUIZ';
  title: string;
  exerciseSlug: string | null;
  questionCount: number | null;
  maxPoints: number;
  startAt: string;
  dueAt: string;
  window: AssignmentWindow;
  /** Số học viên đã hoàn thành trên sĩ số lớp. */
  doneCount: number;
  memberCount: number;
}

export interface TeacherDay {
  /** YYYY-MM-DD theo giờ Việt Nam. */
  date: string;
  dayNumber: number;
  assignments: TeacherDayAssignment[];
}

export interface TeacherClassDays {
  classId: string;
  archived: boolean;
  /** Khối của lớp ('6-9' | '10-12'); dùng làm tab mặc định khi chọn bài từ ngân hàng. */
  band: BankBand | null;
  days: TeacherDay[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type BankBand = '6-9' | '10-12';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface BankExercise {
  slug: string;
  title: string;
  difficulty: Difficulty | null;
  tags: string[];
  points: number | null;
  band: BankBand | null;
}

export interface BankQuestion {
  id: string;
  content: string;
  difficulty: Difficulty | null;
  category: string | null;
  tags: string[];
}

export interface BankQuery {
  band?: BankBand | '';
  q?: string;
  difficulty?: Difficulty | '';
  page?: number;
  pageSize?: number;
}

export interface CreateDayAssignment {
  type: 'CODING' | 'QUIZ';
  title: string;
  exerciseSlug?: string;
  questionIds?: string[];
  maxPoints: number;
  startAt: string;
  dueAt: string;
}
