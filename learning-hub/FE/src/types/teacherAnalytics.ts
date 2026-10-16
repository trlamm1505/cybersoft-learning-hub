/** Số liệu Teacher Dashboard (Ngày 25). Tỷ lệ là số 0..1, null khi chưa có mẫu số. */

export interface CatalogExercise {
  slug: string;
  title: string;
  type: string | null;
  difficulty: string | null;
  tags: string[];
}

export interface CatalogStudent {
  id: string;
  name: string;
  email: string;
  studentCode: string | null;
}

export interface AddStudentsResult {
  added: Array<{ id: string; name: string }>;
  already: string[];
  notFound: string[];
}

export interface ClassSummary {
  id: string;
  name: string;
  /** Giảng viên phụ trách (do Admin gán). */
  teacherId: string;
  description: string;
  archived: boolean;
  studentCount: number;
  exerciseCount: number;
}

export interface AnalyticsSummary {
  students: number;
  exercises: number;
  attemptedPairs: number;
  passedPairs: number;
  totalAttempts: number;
  completionRate: number | null;
  passRate: number | null;
  avgAttempts: number | null;
  hintUnlocks: number;
  hintUsageRate: number | null;
}

export interface TagRow {
  tag: string;
  exercises: number;
  attemptedPairs: number;
  passedPairs: number;
  passRate: number | null;
  avgAttempts: number | null;
  hintUsageRate: number | null;
  difficultyScore: number | null;
  bottleneck: boolean;
}

export interface ExerciseRow {
  slug: string;
  title: string;
  difficulty?: string;
  tags: string[];
  attemptedStudents: number;
  passedStudents: number;
  completionRate: number | null;
  passRate: number | null;
  avgAttempts: number | null;
  hintUnlocks: number;
  hintUsageRate: number | null;
  difficultyScore: number | null;
}

export interface StudentRow {
  id: string;
  name: string;
  attemptedExercises: number;
  passedExercises: number;
  completionRate: number | null;
  totalAttempts: number;
  avgAttempts: number | null;
  hintUnlocks: number;
  lastActiveAt: string | null;
}

export type PairStatus = 'PASSED' | 'ATTEMPTED' | 'NOT_STARTED';

export interface PairRow {
  status: PairStatus;
  attempts: number;
  hintUnlocks: number;
  lastAt: string | null;
}

export interface ClassOverview {
  class: ClassSummary;
  summary: AnalyticsSummary;
  tags: TagRow[];
  exercises: ExerciseRow[];
  students: StudentRow[];
}

export interface StudentDetail {
  class: ClassSummary;
  student: StudentRow;
  exercises: Array<{ slug: string; title: string; tags: string[] } & PairRow>;
}

export interface ExerciseDetail {
  class: ClassSummary;
  exercise: ExerciseRow;
  students: Array<{ id: string; name: string } & PairRow>;
}

export interface ClassDetail extends ClassSummary {
  students: CatalogStudent[];
  exercises: CatalogExercise[];
}

export interface PersonRef {
  id: string;
  name: string;
  email: string;
}

/** Lớp trên trang quản trị: kèm giảng viên phụ trách. */
export interface AdminClassSummary extends ClassSummary {
  teacher: PersonRef | null;
}

export interface AdminClassDetail extends ClassDetail {
  teacher: PersonRef | null;
}

export interface ImportResult extends AddStudentsResult {
  /** Giá trị ở cột email nhưng sai cú pháp. */
  invalid: string[];
  duplicatesInFile: number;
  totalRows: number;
}

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  studentCode: string | null;
  role: UserRole;
  status: UserStatus;
  avatar: string | null;
  createdAt: string | null;
  /** Số lớp (chưa lưu trữ) của học viên; null với vai trò khác. 0 nghĩa là "Chưa vào lớp". */
  classCount?: number | null;
}

export interface AdminUserList {
  items: AdminUserRow[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProfileClass {
  id: string;
  name: string;
  archived: boolean;
  /** Học viên: tên giảng viên và tiến độ trên bài được giao. Giảng viên: số học viên và bài của lớp. */
  teacher: string | null;
  assigned: number | null;
  passed: number | null;
  completionRate: number | null;
  students: number | null;
  exercises: number | null;
}

export interface ProfileRecent {
  title: string;
  kind: 'CODE' | 'SQL' | 'INSIGHT' | 'AI_LAB';
  status: 'PASSED' | 'FAILED' | 'PENDING';
  at: string;
}

export interface AdminUserProfile {
  user: AdminUserRow & { ageGroup: string | null };
  classes: ProfileClass[];
  stats: {
    totalSubmissions: number;
    attemptedExercises: number;
    passedExercises: number;
    passRate: number | null;
  } | null;
  recent: ProfileRecent[];
  activity: { from: string; to: string; total: number; activeDays: number; days: Array<{ date: string; count: number }> } | null;
}
