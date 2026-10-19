import { vnDayKey } from './class-scoring';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** 00:00 giờ Việt Nam của ngày `YYYY-MM-DD` (đổi sang thời điểm UTC). */
export const startOfVnDay = (dayKey: string): Date => new Date(new Date(`${dayKey}T00:00:00.000Z`).getTime() - VN_OFFSET_MS);

/** Ngày kế tiếp của một khóa ngày `YYYY-MM-DD`. */
export const nextDayKey = (dayKey: string): string => new Date(new Date(`${dayKey}T00:00:00.000Z`).getTime() + DAY_MS).toISOString().slice(0, 10);

export const isValidDayKey = (s: unknown): s is string => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00.000Z`).getTime());

export type AssignmentWindow = 'UPCOMING' | 'OPEN' | 'EXPIRED';

/** Sắp mở / Đang mở / Hết hạn theo startAt, dueAt. */
export function assignmentWindow(startAt: Date, dueAt: Date, now: Date): AssignmentWindow {
  if (now.getTime() < startAt.getTime()) return 'UPCOMING';
  return now.getTime() > dueAt.getTime() ? 'EXPIRED' : 'OPEN';
}

export interface DayGroup<T> {
  date: string;
  dayNumber: number;
  assignments: T[];
}

/**
 * Gom bài theo NGÀY ĐƯỢC GIAO (giờ Việt Nam), đánh số Ngày 1, 2, 3... theo thứ tự thời gian. Dùng chung cho cả trang Học viên
 * (Lớp học của tôi) và trang Giảng viên để hai bên luôn thấy cùng một cấu trúc ngày.
 */
export function groupByDay<T extends { startAt: Date | string }>(rows: T[]): Array<DayGroup<T>> {
  const days: Array<DayGroup<T>> = [];
  for (const row of rows) {
    const key = vnDayKey(new Date(row.startAt));
    let day = days.find((d) => d.date === key);
    if (!day) {
      day = { date: key, dayNumber: 0, assignments: [] };
      days.push(day);
    }
    day.assignments.push(row);
  }
  days.sort((a, b) => a.date.localeCompare(b.date));
  days.forEach((d, i) => (d.dayNumber = i + 1));
  return days;
}

export const PAGE_SIZE_DEFAULT = 10;
export const PAGE_SIZE_MAX = 50;

export interface PageInput {
  page?: unknown;
  pageSize?: unknown;
}

export function normalizePage(input: PageInput): { page: number; pageSize: number } {
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, Math.floor(Number(input.pageSize)) || PAGE_SIZE_DEFAULT));
  const page = Math.max(1, Math.floor(Number(input.page)) || 1);
  return { page, pageSize };
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const toPaged = <T>(items: T[], total: number, page: number, pageSize: number): Paged<T> => ({
  items,
  total,
  page,
  pageSize,
  totalPages: Math.max(1, Math.ceil(total / pageSize)),
});

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;
export const normalizeDifficulty = (v: unknown): (typeof DIFFICULTIES)[number] | undefined =>
  (DIFFICULTIES as readonly string[]).includes(String(v)) ? (v as (typeof DIFFICULTIES)[number]) : undefined;

/** Thoát ký tự đặc biệt của regex trong từ khóa tìm kiếm. */
export const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
