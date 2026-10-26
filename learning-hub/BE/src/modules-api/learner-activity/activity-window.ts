/** Hàm thuần cho API hoạt động học tập (heatmap): cửa sổ thời gian và múi giờ. */

export const DEFAULT_ACTIVITY_DAYS = 371; // 53 tuần, đủ phủ một năm cộng phần tuần dở
export const MAX_ACTIVITY_DAYS = 400;

/** Chuẩn hóa số ngày tra cứu: mặc định 371, tối thiểu 1, tối đa 400. */
export function clampDays(raw: unknown): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_ACTIVITY_DAYS;
  return Math.min(n, MAX_ACTIVITY_DAYS);
}

/** Độ lệch múi giờ (phút, dương là phía đông UTC) → '+07:00'. Giá trị ngoài [-12h, +14h] hoặc không hợp lệ → UTC. */
export function formatTzOffset(raw: unknown): string {
  const n = Math.trunc(Number(raw));
  if (!Number.isFinite(n) || n < -720 || n > 840) return '+00:00';
  const sign = n < 0 ? '-' : '+';
  const abs = Math.abs(n);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

/** '+07:00' → số phút (420). */
export function tzOffsetMinutes(tz: string): number {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(tz);
  if (!m) return 0;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

const nextDay = (key: string): string => {
  const d = new Date(`${key}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Chuỗi ngày luyện tập liên tiếp. `dates`: các ngày (YYYY-MM-DD) có hoạt động; `today`: hôm nay theo múi giờ người dùng.
 * current = chuỗi kết thúc hôm nay, hoặc hôm qua nếu hôm nay chưa luyện (chưa mất chuỗi); best = chuỗi dài nhất trong dữ liệu.
 */
export function computeStreaks(dates: string[], today: string): { current: number; best: number } {
  const set = new Set(dates);
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && nextDay(prev) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  let cursor = set.has(today) ? today : null;
  if (!cursor) {
    const y = new Date(`${today}T00:00:00.000Z`);
    y.setUTCDate(y.getUTCDate() - 1);
    const yesterday = y.toISOString().slice(0, 10);
    cursor = set.has(yesterday) ? yesterday : null;
  }
  let current = 0;
  while (cursor && set.has(cursor)) {
    current++;
    const c = new Date(`${cursor}T00:00:00.000Z`);
    c.setUTCDate(c.getUTCDate() - 1);
    cursor = c.toISOString().slice(0, 10);
  }
  return { current, best };
}

/** Ngày YYYY-MM-DD của thời điểm `now` theo múi giờ cho trước (phút lệch so với UTC). */
export function localDateKey(now: Date, offsetMinutes: number): string {
  return new Date(now.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}
