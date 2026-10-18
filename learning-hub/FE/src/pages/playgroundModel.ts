import type { PlaygroundExercise, PlaygroundResponse } from '../types/exercise';

/**
 * Mô hình thuần của Code Playground (Day 31). Danh sách, thứ tự #1..#N, trạng thái hoàn thành / mở khóa và tổng số bài đều do
 * MÁY CHỦ tính (GET /exercises/playground) từ bài nộp AC trong CSDL; FE chỉ hiển thị, không tự suy ra và không lưu localStorage.
 */

export const DIFFICULTY_BADGE: Record<string, string> = {
  EASY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

export type PlaygroundBandKey = '6-9' | '10-12';

/** Khóa nhóm FE của Playground ('6-9' | '9-12' | 'CAREER_ADULT' | '3-5') -> khối của API; null nếu không có lộ trình Python. */
export const apiBandOfKey = (key: string | null | undefined): PlaygroundBandKey | null =>
  key === '6-9' ? '6-9' : key === '9-12' || key === '10-12' ? '10-12' : null;

export const BAND_LABEL: Record<PlaygroundBandKey, string> = { '6-9': 'Lớp 6-9', '10-12': 'Lớp 10-12' };

export const progressText = (data: Pick<PlaygroundResponse, 'completed' | 'total'>): string =>
  `Tiến độ: ${data.completed}/${data.total} bài đã hoàn thành`;

/** Bài bấm mở được: đã hoàn thành (xem/làm lại) hoặc đang mở. Chỉ bài khóa là không mở. */
export const canOpen = (item: Pick<PlaygroundExercise, 'status'>): boolean => item.status !== 'locked';

/** Lý do bài đang khóa, chỉ bài ngay trước chưa xong thì mới là "bài cần làm trước". */
export const lockedHint = (items: readonly PlaygroundExercise[], item: PlaygroundExercise): string => {
  const blocker = items.find((x) => x.status === 'available');
  return `Hoàn thành bài #${blocker ? blocker.order : Math.max(item.order - 1, 1)} trước để mở khóa bài #${item.order}`;
};

/** Vừa hoàn thành bài cuối cùng của lộ trình (chuyển từ chưa xong hết sang xong hết) thì mới chúc mừng, không chúc mừng lại ở lần mở sau. */
export const justFinishedTrack = (before: Pick<PlaygroundResponse, 'completed' | 'total'> | undefined, after: Pick<PlaygroundResponse, 'completed' | 'total'>): boolean =>
  after.total > 0 && after.completed >= after.total && !!before && before.completed < before.total;

/** Bài đứng ngay sau bài đang xem trong lộ trình (nút "Bài tiếp theo"). */
export const nextItem = (items: readonly PlaygroundExercise[], slug: string | null): PlaygroundExercise | null => {
  if (!slug) return null;
  const idx = items.findIndex((x) => x.slug === slug);
  return idx >= 0 ? (items[idx + 1] ?? null) : null;
};
