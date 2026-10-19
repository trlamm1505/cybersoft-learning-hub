import type { TeacherClassSummary } from '../types/teacherAnalytics';

export const NO_CLASS_MESSAGE =
  'Bạn hiện chưa được phân công phụ trách lớp học nào. Vui lòng liên hệ Quản trị viên để được cấp quyền quản lý lớp.';

export const AGE_GROUP_LABEL: Record<string, string> = {
  '3-5': 'Khối 3-5',
  '6-9': 'Khối 6-9',
  '10-12': 'Khối 10-12',
  CAREER_ADULT: 'Người đi làm',
};

export const ageGroupLabel = (g: TeacherClassSummary['ageGroup']): string => (g ? (AGE_GROUP_LABEL[g] ?? g) : 'Chưa phân khối');

/** Lớp đang xem: classId trên URL nếu thuộc danh sách của giảng viên, nếu không thì lớp đầu tiên ('' khi chưa có lớp). */
export const resolveClassId = (classes: Array<{ id: string }>, requested: string | null): string =>
  classes.find((c) => c.id === requested)?.id ?? classes[0]?.id ?? '';

export const totalPending = (classes: Array<{ pendingSubmissions: number }>): number =>
  classes.reduce((n, c) => n + c.pendingSubmissions, 0);

export const totalStudents = (classes: Array<{ studentCount: number }>): number =>
  classes.reduce((n, c) => n + c.studentCount, 0);

/** Giao diện theo nhóm đào tạo: Kid (3-5), School (6-9 & 10-12), Career (Người đi làm). Lớp chưa phân khối dùng giao diện School. */
export type ClassKind = 'KID' | 'SCHOOL' | 'CAREER';

export const classKind = (g: TeacherClassSummary['ageGroup'] | undefined): ClassKind =>
  g === '3-5' ? 'KID' : g === 'CAREER_ADULT' ? 'CAREER' : 'SCHOOL';

/** Mỗi bài đạt được một sao. */
export const kidStars = (passedExercises: number): number => Math.max(0, passedExercises);

/** Cấp ải game nhí: mỗi 3 sao lên một ải, bắt đầu từ ải 1. */
export const kidLevel = (passedExercises: number): number => Math.floor(Math.max(0, passedExercises) / 3) + 1;

/** Bảng vinh danh: tối đa `limit` bé có nhiều sao nhất (bỏ bé chưa có sao). */
export function honorRoll<T extends { passedExercises: number; name: string }>(rows: T[], limit = 3): T[] {
  return [...rows]
    .filter((r) => r.passedExercises > 0)
    .sort((a, b) => b.passedExercises - a.passedExercises || a.name.localeCompare(b.name, 'vi'))
    .slice(0, limit);
}

/** Tỷ lệ đạt (0..1) -> "75%"; chưa có mẫu số -> "—". */
export const percentLabel = (rate: number | null | undefined): string => (rate === null || rate === undefined ? '—' : `${Math.round(rate * 100)}%`);

export type SubmissionState = 'NO_EXERCISE' | 'NOT_SUBMITTED' | 'PASSED' | 'WRONG_ANSWER';

export interface SubmissionStatus {
  state: SubmissionState;
  label: string;
}

/** Trạng thái nộp bài của một học viên: Passed 100/100, Wrong Answer 60/100 hoặc Chưa nộp. */
export function submissionStatus(
  row: { attemptedExercises: number; passedExercises: number; bestScorePercent: number | null } | undefined,
  totalExercises: number,
): SubmissionStatus {
  if (totalExercises === 0) return { state: 'NO_EXERCISE', label: 'Chưa giao bài' };
  if (!row || row.attemptedExercises === 0) return { state: 'NOT_SUBMITTED', label: 'Chưa nộp' };
  const score = row.bestScorePercent ?? Math.round((row.passedExercises / totalExercises) * 100);
  return row.passedExercises >= totalExercises
    ? { state: 'PASSED', label: `Passed ${score}/100` }
    : { state: 'WRONG_ANSWER', label: `Wrong Answer ${score}/100` };
}

/** Từ 3 lần rời màn hình trở lên là mức đỏ; ít hơn là mức vàng. */
export const OUT_TAB_RED_AT = 3;
export const outTabSeverity = (count: number): 'RED' | 'AMBER' => (count >= OUT_TAB_RED_AT ? 'RED' : 'AMBER');

/** Bài giao có hạn nộp: Đang mở / Hết hạn / Sắp mở theo thời điểm hiện tại. */
export function assignmentWindow(startAt: string, dueAt: string, now = Date.now()): 'UPCOMING' | 'OPEN' | 'EXPIRED' {
  if (now < new Date(startAt).getTime()) return 'UPCOMING';
  return now > new Date(dueAt).getTime() ? 'EXPIRED' : 'OPEN';
}

export const ASSIGNMENT_WINDOW_LABEL = { UPCOMING: 'Sắp mở', OPEN: 'Đang mở', EXPIRED: 'Hết hạn' } as const;

/** Lớp Tester QA (khóa Career Adult): Lab cố định, không giao bài, không đo out-tab. Khớp BE isTesterClass. */
export const isTesterSummary = (c: { courseKey?: string | null; code?: string | null } | null | undefined): boolean =>
  !!c && (c.courseKey === 'tester-qa' || c.code === 'CL-CAREER-TESTER');

/** Lớp Data SQL Lab / AI Prompt Lab: bài tự chấm trên sandbox, giảng viên chỉ theo dõi. Khớp BE isSandboxCareerClass. */
export const isSandboxSummary = (c: { courseKey?: string | null } | null | undefined): boolean => c?.courseKey === 'data-sql' || c?.courseKey === 'ai-prompt';

/** Khớp BE canUseAiGenerator: lớp phổ thông K6-9 / K10-12, còn hoạt động, không phải lớp khóa Career. */
export const canUseAiGeneratorFor = (classes: Array<{ ageGroup: string | null; status?: string; courseKey?: string | null }>): boolean =>
  classes.some((c) => (c.ageGroup === '6-9' || c.ageGroup === '10-12') && !c.courseKey && c.status !== 'ARCHIVED');

/** Biểu tượng phân biệt khối của lớp trên sidebar. */
export const classGroupIcon = (g: TeacherClassSummary['ageGroup'] | undefined): string =>
  g === '3-5' ? '🎒' : g === '6-9' ? '📘' : g === '10-12' ? '🚀' : g === 'CAREER_ADULT' ? '💼' : '📚';

export const NO_ASSIGNED_CLASS_SHORT = 'Bạn chưa được phân công lớp học nào.';

/** Nhãn hiển thị cạnh điểm tổng kết: khóa (đỏ), tạm thời (vàng) hoặc chính thức. */
export function finalGradeBadge(g: { locked: boolean; provisional: boolean; pending: number; letter: string }): {
  kind: 'LOCKED' | 'PROVISIONAL' | 'OFFICIAL';
  label: string;
  tooltip: string;
} {
  if (g.locked) return { kind: 'LOCKED', label: 'Khóa kết quả - Điểm F', tooltip: 'Bỏ nộp > 30% số bài tập' };
  if (g.provisional) return { kind: 'PROVISIONAL', label: `Tạm thời (${g.pending} bài chờ chấm)`, tooltip: 'Điểm sẽ thay đổi khi các bài đang chờ được chấm và công bố' };
  return { kind: 'OFFICIAL', label: `Hạng ${g.letter}`, tooltip: 'Điểm chính thức' };
}

/** Bé bị kẹt ải đứng đầu, sau đó theo số sao giảm dần. */
export function sortKidsForTeacher<T extends { starsEarned: number; stuckAlert: { active: boolean } }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => Number(b.stuckAlert.active) - Number(a.stuckAlert.active) || b.starsEarned - a.starsEarned);
}

/** Top 3 vinh danh theo số sao (bỏ bé chưa có sao). */
export function kidHonorRoll<T extends { starsEarned: number; fullName: string }>(rows: T[]): T[] {
  return [...rows]
    .filter((r) => r.starsEarned > 0)
    .sort((a, b) => b.starsEarned - a.starsEarned || a.fullName.localeCompare(b.fullName, 'vi'))
    .slice(0, 3);
}
