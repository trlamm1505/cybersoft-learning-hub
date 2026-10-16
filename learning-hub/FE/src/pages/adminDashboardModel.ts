import type { AdminClassSummary } from '../types/teacherAnalytics';

export interface AdminOverview {
  totalClasses: number;
  activeClasses: number;
  archivedClasses: number;
  /** Số giảng viên khác nhau đang phụ trách ít nhất một lớp. */
  teachers: number;
  /** Tổng chỗ học viên ở mọi lớp (một học viên ở hai lớp tính hai lần). */
  studentSeats: number;
  /** Lớp đang hoạt động thiếu giảng viên, học viên hoặc bài được giao. */
  attention: Array<{ cls: AdminClassSummary; reasons: string[] }>;
}

export function adminOverview(classes: AdminClassSummary[]): AdminOverview {
  const active = classes.filter((c) => !c.archived);
  const attention = active
    .map((cls) => {
      const reasons: string[] = [];
      if (!cls.teacher) reasons.push('chưa gán giảng viên');
      if (cls.studentCount === 0) reasons.push('chưa có học viên');
      if (cls.exerciseCount === 0) reasons.push('chưa giao bài');
      return { cls, reasons };
    })
    .filter((a) => a.reasons.length > 0);
  return {
    totalClasses: classes.length,
    activeClasses: active.length,
    archivedClasses: classes.length - active.length,
    teachers: new Set(classes.map((c) => c.teacher?.id).filter(Boolean)).size,
    studentSeats: classes.reduce((sum, c) => sum + c.studentCount, 0),
    attention,
  };
}

/** Admin vào /admin/* hoặc về /admin/dashboard; vai trò khác không có đường vào Admin Portal. */
export function portalHome(role: string | undefined): string {
  return role === 'ADMIN' ? '/admin/dashboard' : role === 'TEACHER' ? '/authoring' : '/catalog';
}
