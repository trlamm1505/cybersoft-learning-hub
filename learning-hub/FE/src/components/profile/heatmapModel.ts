/** Dựng mô hình biểu đồ hoạt động kiểu GitHub: lưới tuần (cột) × thứ (hàng, bắt đầu từ thứ Hai). */

export type HeatLevel = 0 | 1 | 2 | 3 | 4;

export interface HeatCell {
  /** YYYY-MM-DD theo giờ địa phương. */
  date: string;
  count: number;
  level: HeatLevel;
  /** Ô sau ngày cuối cùng của cửa sổ (tuần cuối còn dở): không vẽ. */
  future: boolean;
}

export interface HeatmapModel {
  /** Mỗi phần tử là một tuần gồm đúng 7 ô, thứ Hai đến Chủ nhật. */
  weeks: HeatCell[][];
  monthLabels: Array<{ col: number; label: string }>;
  total: number;
  activeDays: number;
  max: number;
}

/** 40 tuần (~9 tháng): đủ dài để thấy xu hướng mà ô vẫn đủ to (~10px) để đọc được trong cột nửa trang. */
export const WEEKS_SHOWN = 40;

/** Số tháng xấp xỉ của cửa sổ, để ghi chú dưới biểu đồ cho đúng khoảng thời gian đang hiển thị. */
export const monthsShown = (weeks = WEEKS_SHOWN): number => Math.round((weeks * 7) / 30);

const pad = (n: number) => String(n).padStart(2, '0');

/** Date → YYYY-MM-DD theo giờ địa phương (không qua UTC để không lệch ngày). */
export const dateKey = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Ngày địa phương lúc 00:00 từ YYYY-MM-DD. */
export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Thứ Hai của tuần chứa `d` (00:00 địa phương). */
export const mondayOf = (d: Date): Date => {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7));
  return out;
};

/**
 * Mức màu 0 đến 4. Ít hoạt động (tối đa 4 lượt/ngày) thì mức bằng đúng số lượt để người mới
 * dùng vẫn thấy khác biệt; nhiều hơn thì chia theo tỷ lệ so với ngày cao nhất.
 */
export function levelFor(count: number, max: number): HeatLevel {
  if (count <= 0) return 0;
  if (max <= 4) return Math.min(count, 4) as HeatLevel;
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const MONTH_LABELS = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];

export function buildHeatmap(counts: Record<string, number>, end: Date, weeks = WEEKS_SHOWN): HeatmapModel {
  const endKey = dateKey(end);
  const start = mondayOf(end);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const startKey = dateKey(start);

  let max = 0;
  let total = 0;
  let activeDays = 0;
  for (const [key, n] of Object.entries(counts)) {
    if (key < startKey || key > endKey || n <= 0) continue;
    max = Math.max(max, n);
    total += n;
    activeDays += 1;
  }

  const grid: HeatCell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < weeks; w++) {
    const week: HeatCell[] = [];
    for (let d = 0; d < 7; d++) {
      const key = dateKey(cursor);
      const future = key > endKey;
      const count = future || key < startKey ? 0 : (counts[key] ?? 0);
      week.push({ date: key, count, level: levelFor(count, max), future });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  // Nhãn tháng đặt ở cột đầu tiên của mỗi tháng; bỏ nhãn quá sát nhau để không chồng chữ.
  const monthLabels: Array<{ col: number; label: string }> = [];
  let lastMonth = -1;
  grid.forEach((week, col) => {
    const month = parseDateKey(week[0].date).getMonth();
    if (month === lastMonth) return;
    lastMonth = month;
    const prev = monthLabels[monthLabels.length - 1];
    if (prev && col - prev.col < 3) monthLabels.pop();
    monthLabels.push({ col, label: MONTH_LABELS[month] });
  });

  return { weeks: grid, monthLabels, total, activeDays, max };
}

/** Số ngẫu nhiên xác định từ chuỗi (cùng ngày luôn ra cùng giá trị), 0 đến 1. */
function seeded(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Dữ liệu minh họa khi học viên chưa có lượt nộp nào: ngày thường nhiều hơn cuối tuần,
 * xác định theo ngày nên không nhấp nháy giữa các lần tải. Giao diện phải ghi rõ đây là dữ liệu mẫu.
 */
export function sampleActivity(end: Date, weeks = WEEKS_SHOWN): Record<string, number> {
  const start = mondayOf(end);
  start.setDate(start.getDate() - (weeks - 1) * 7);
  const out: Record<string, number> = {};
  const cursor = new Date(start);
  const endKey = dateKey(end);
  while (dateKey(cursor) <= endKey) {
    const key = dateKey(cursor);
    const weekend = cursor.getDay() === 0 || cursor.getDay() === 6;
    const r = seeded(key);
    if (r < (weekend ? 0.15 : 0.5)) out[key] = 1 + Math.floor(seeded(`${key}#n`) * 6);
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export const toCountMap = (days: Array<{ date: string; count: number }>): Record<string, number> =>
  Object.fromEntries(days.map((d) => [d.date, d.count]));

export const formatDateVi = (key: string): string => {
  const [y, m, d] = key.split('-');
  return `${d}/${m}/${y}`;
};
