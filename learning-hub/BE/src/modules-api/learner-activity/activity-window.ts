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

/** Ngày YYYY-MM-DD của thời điểm `now` theo múi giờ cho trước (phút lệch so với UTC). */
export function localDateKey(now: Date, offsetMinutes: number): string {
  return new Date(now.getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}
