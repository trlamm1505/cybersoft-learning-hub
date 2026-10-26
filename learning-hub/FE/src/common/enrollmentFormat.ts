import type { CertificateGrade, EnrollmentStatus } from '../types/studentClasses';

export const ENROLLMENT_STATUS_LABEL: Record<EnrollmentStatus, string> = {
  IN_PROGRESS: 'Đang học',
  COMPLETED: 'Đã hoàn thành',
  ENDED: 'Đã kết thúc',
};

export const ENROLLMENT_STATUS_TONE: Record<EnrollmentStatus, string> = {
  IN_PROGRESS: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
  ENDED: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
};

/** Màu nhãn xếp loại trên chứng chỉ (nền sáng cố định, không phụ thuộc giao diện Sáng/Tối). */
export const GRADE_TONE: Record<CertificateGrade, string> = {
  'Xuất sắc': 'text-amber-700 border-amber-600 bg-amber-50',
  Giỏi: 'text-emerald-700 border-emerald-600 bg-emerald-50',
  Khá: 'text-sky-700 border-sky-600 bg-sky-50',
};

/** dd/mm/yyyy theo giờ Việt Nam; chuỗi rỗng nếu ngày không hợp lệ. */
export function formatCertificateDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()}`;
}

/** Điểm hiển thị gọn: 95 -> "95", 87.5 -> "87,5". */
export const formatScore = (n: number): string => String(Math.round(n * 10) / 10).replace('.', ',');
