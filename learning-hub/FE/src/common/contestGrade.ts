import type { AuthUser } from '../types/auth';

/** Khối dự thi của cuộc thi (khớp BE contest-grade.ts). Cuộc thi cũ chưa khai báo là 'ALL'. */
export type ContestGradeBand = 'ALL' | '6-9' | '10-12';
export type ContestGradeFilter = 'all' | '6-9' | '10-12';

export const GRADE_FILTER_OPTIONS: ReadonlyArray<{ value: ContestGradeFilter; label: string }> = [
  { value: 'all', label: 'Tất cả khối' },
  { value: '6-9', label: 'Khối 6–9' },
  { value: '10-12', label: 'Khối 10–12' },
];

/** Cuộc thi mở không giới hạn: giờ đóng cách hiện tại hơn 1 năm. */
export const isUnlimitedContest = (endTimeIso: string, now: Date = new Date()): boolean =>
  new Date(endTimeIso).getTime() - now.getTime() > 365 * 24 * 60 * 60 * 1000;

export const contestBandLabel = (band?: string): string =>
  band === '6-9' ? 'Khối 6–9' : band === '10-12' ? 'Khối 10–12' : 'Mở cho mọi khối';

/** Tab lọc: 'all' thấy hết; tab khối thấy cuộc thi riêng của khối đó và cuộc thi mở cho mọi khối. */
export const matchesGradeFilter = (band: string | undefined, filter: ContestGradeFilter): boolean =>
  filter === 'all' || !band || band === 'ALL' || band === filter;

/**
 * Học sinh có được vào phòng thi không. Chỉ để báo sớm cho người dùng: máy chủ vẫn kiểm tra và trả 403.
 * Trả về thông báo lỗi, hoặc undefined nếu được vào.
 */
export function contestGradeDenied(band: string | undefined, user: Pick<AuthUser, 'role' | 'ageGroup'> | null | undefined): string | undefined {
  if (!band || band === 'ALL' || !user || user.role !== 'STUDENT') return undefined;
  return user.ageGroup === band ? undefined : `Cuộc thi dành riêng cho học sinh ${contestBandLabel(band)}.`;
}
