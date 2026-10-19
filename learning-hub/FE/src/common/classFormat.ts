import type { AssignmentState, ClassAssignmentRow, ClassDay } from '../types/classAssignments';

const TZ = 'Asia/Ho_Chi_Minh';

/** dd/mm/yyyy theo giờ Việt Nam (khớp cách máy chủ nhóm bài theo ngày). */
export function formatVnDate(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
}

/** "dd/mm/yyyy HH:mm" theo giờ Việt Nam. */
export function formatVnDateTime(iso: string): string {
  const d = new Date(iso);
  const date = formatVnDate(iso);
  const time = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
  return `${date} ${time}`;
}

/** Tiêu đề ngày của accordion: "Ngày 1 - 23/03/2026: 2 bài chưa hoàn thành" hoặc "... đã hoàn thành tất cả". */
export function dayHeading(day: Pick<ClassDay, 'dayNumber' | 'date' | 'pendingCount'>): string {
  const [y, m, d] = day.date.split('-');
  const date = `${d}/${m}/${y}`;
  return `Ngày ${day.dayNumber} - ${date}: ${day.pendingCount > 0 ? `${day.pendingCount} bài chưa hoàn thành` : 'đã hoàn thành tất cả'}`;
}

export const STATE_LABEL: Record<AssignmentState, string> = {
  DONE: 'Đã hoàn thành',
  EXPIRED: 'Đã hết hạn - Đã khóa',
  NOT_OPEN: 'Chưa đến giờ mở',
  IN_PROGRESS: 'Đang làm',
  NOT_STARTED: 'Chưa làm',
};

/** Điểm hiển thị của một bài đã xong, vd "9/10 điểm"; bài coding bị trừ điểm thì kèm số điểm bị trừ. */
export function scoreText(a: Pick<ClassAssignmentRow, 'type' | 'score' | 'maxPoints' | 'wrongCount'>): string {
  if (a.score === null) return '';
  const base = `${Number.isInteger(a.score) ? a.score : a.score.toFixed(1)}/${a.maxPoints} điểm`;
  return a.type === 'CODING' && a.wrongCount > 0 ? `${base} (trừ ${Math.min(a.wrongCount, a.maxPoints)} điểm do nộp sai ${a.wrongCount} lần)` : base;
}

/** Đường dẫn vào làm bài: bài code mở Playground đúng bài (kèm mã bài giao), bài trắc nghiệm mở trang Thi trắc nghiệm. */
export function assignmentPath(a: Pick<ClassAssignmentRow, 'id' | 'type' | 'exerciseSlug'>): string {
  return a.type === 'CODING' && a.exerciseSlug
    ? `/playground?slug=${encodeURIComponent(a.exerciseSlug)}&assignment=${encodeURIComponent(a.id)}`
    : `/quiz?assignment=${encodeURIComponent(a.id)}`;
}

export const rankMedal = (rank: number): string => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '');
