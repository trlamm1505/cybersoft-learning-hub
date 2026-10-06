import type { AnalyticsSummary, PairStatus } from '../types/teacherAnalytics';

/** Giá trị chưa có mẫu số (lớp chưa ai làm bài) hiện là gạch ngang, không phải 0%. */
export const EMPTY = '—';

export const formatPercent = (rate: number | null | undefined): string =>
  rate === null || rate === undefined ? EMPTY : `${Math.round(rate * 100)}%`;

export const formatAvg = (n: number | null | undefined): string =>
  n === null || n === undefined ? EMPTY : n.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

export const formatDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : EMPTY;

export const STATUS_LABEL: Record<PairStatus, string> = {
  PASSED: 'Đạt',
  ATTEMPTED: 'Chưa đạt',
  NOT_STARTED: 'Chưa làm',
};

/** Điểm khó 0..100 thành nhãn ngắn; null (chưa ai làm) hiện gạch ngang. */
export const difficultyLabel = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return EMPTY;
  if (score >= 50) return 'Khó';
  if (score >= 25) return 'Vừa';
  return 'Dễ';
};

export type DashboardState = 'NO_STUDENTS' | 'NO_EXERCISES' | 'NO_ATTEMPTS' | 'READY';

/** Quyết định nội dung trang: lớp thiếu học viên/bài, hay có đủ nhưng chưa ai nộp, hay có số liệu. */
export const dashboardState = (s: Pick<AnalyticsSummary, 'students' | 'exercises' | 'attemptedPairs'>): DashboardState => {
  if (s.students === 0) return 'NO_STUDENTS';
  if (s.exercises === 0) return 'NO_EXERCISES';
  if (s.attemptedPairs === 0) return 'NO_ATTEMPTS';
  return 'READY';
};

export const EMPTY_MESSAGE: Record<Exclude<DashboardState, 'READY'>, string> = {
  NO_STUDENTS: 'Lớp chưa có học viên.',
  NO_EXERCISES: 'Chưa giao bài tập nào.',
  NO_ATTEMPTS: 'Chưa có lượt làm bài nào.',
};

export type SortDir = 'asc' | 'desc';

/** Sắp xếp theo khóa số hoặc chuỗi; giá trị null luôn xuống cuối, ổn định với phần tử bằng nhau. */
export function sortRows<T>(rows: T[], pick: (row: T) => number | string | null, dir: SortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: pick(row) }))
    .sort((a, b) => {
      if (a.v === null && b.v === null) return a.i - b.i;
      if (a.v === null) return 1;
      if (b.v === null) return -1;
      const cmp =
        typeof a.v === 'string' || typeof b.v === 'string'
          ? String(a.v).localeCompare(String(b.v), 'vi')
          : a.v - b.v;
      return cmp * sign || a.i - b.i;
    })
    .map((x) => x.row);
}
