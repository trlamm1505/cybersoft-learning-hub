/**
 * Tổng kết một lớp học của học viên (hàm thuần): trạng thái Đang học / Đã hoàn thành, điểm tổng kết,
 * xếp loại và mã chứng chỉ. Chứng chỉ chỉ cấp khi mọi bài được giao đã khép lại (làm xong hoặc quá hạn)
 * và điểm tổng kết đạt ngưỡng loại Khá.
 */
export type Grade = 'Xuất sắc' | 'Giỏi' | 'Khá';
export type EnrollmentStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ENDED';

/** Ngưỡng % điểm tổng kết cho từng loại. Dưới ngưỡng Khá: lớp kết thúc nhưng chưa được cấp chứng chỉ. */
export const GRADE_THRESHOLDS: Array<{ grade: Grade; minPercent: number }> = [
  { grade: 'Xuất sắc', minPercent: 90 },
  { grade: 'Giỏi', minPercent: 80 },
  { grade: 'Khá', minPercent: 65 },
];

export function gradeOf(percent: number): Grade | null {
  for (const t of GRADE_THRESHOLDS) if (percent >= t.minPercent) return t.grade;
  return null;
}

export interface EnrollmentAssignment {
  maxPoints: number;
  dueAt: Date;
  done: boolean;
  score: number;
  completedAt?: Date | null;
}

export interface EnrollmentSummary {
  status: EnrollmentStatus;
  totalAssignments: number;
  doneCount: number;
  earned: number;
  max: number;
  /** Điểm tổng kết quy về thang 100, làm tròn 1 chữ số thập phân. */
  percent: number;
  grade: Grade | null;
  /** Thời điểm lớp khép lại với học viên (chỉ có khi không còn bài nào mở). */
  completedAt: Date | null;
}

export function summarizeEnrollment(list: EnrollmentAssignment[], now: Date): EnrollmentSummary {
  const earned = Math.round(list.reduce((s, a) => s + (a.done ? a.score : 0), 0) * 10) / 10;
  const max = list.reduce((s, a) => s + a.maxPoints, 0);
  const percent = max > 0 ? Math.round((earned / max) * 1000) / 10 : 0;
  const doneCount = list.filter((a) => a.done).length;
  const settled = list.length > 0 && list.every((a) => a.done || now.getTime() > a.dueAt.getTime());

  let completedAt: Date | null = null;
  if (settled) {
    for (const a of list) {
      const t = a.done && a.completedAt ? a.completedAt : a.dueAt;
      if (!completedAt || t > completedAt) completedAt = t;
    }
  }
  const grade = settled ? gradeOf(percent) : null;
  const status: EnrollmentStatus = !settled ? 'IN_PROGRESS' : grade ? 'COMPLETED' : 'ENDED';
  return { status, totalAssignments: list.length, doneCount, earned, max, percent, grade, completedAt };
}

/** FNV-1a 32-bit: mã chứng chỉ ổn định (cùng lớp + học viên luôn ra cùng mã), không cần lưu thêm bảng. */
function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().padStart(8, '0');
}

/** Dạng CSH-2026-69PY01-3A9F12BC: năm hoàn thành, mã lớp, rồi mã băm của (lớp, học viên). */
export function certificateCode(classKey: string, classId: string, userId: string, completedAt: Date): string {
  const key = classKey.replace(/^CL-/i, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || classId.slice(-6).toUpperCase();
  return `CSH-${completedAt.getUTCFullYear()}-${key}-${fnv(`${classId}|${userId}`)}`;
}
