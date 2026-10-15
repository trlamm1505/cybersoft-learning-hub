/** Số liệu vẽ biểu đồ tròn (donut) kết quả nộp bài và dải ngày luyện tập; hàm thuần để kiểm thử. */
export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

export interface DonutArc extends DonutSlice {
  percent: number;
  /** Độ dài cung và độ dời bắt đầu theo chu vi (dùng cho stroke-dasharray/dashoffset của <circle>). */
  length: number;
  offset: number;
}

/** Chia chu vi `circumference` cho các lát có value > 0; tổng bằng 0 thì không có cung nào. */
export function donutArcs(slices: DonutSlice[], circumference: number): DonutArc[] {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (total <= 0) return [];
  let used = 0;
  return slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const length = (s.value / total) * circumference;
      const arc: DonutArc = { ...s, percent: Math.round((s.value / total) * 100), length, offset: used };
      used += length;
      return arc;
    });
}

/** Mức đậm nhạt (0-4) của một ô ngày theo số lượt nộp, giống thang màu heatmap trang cá nhân. */
export const intensityLevel = (count: number): 0 | 1 | 2 | 3 | 4 =>
  count <= 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;

/** N ngày gần nhất (kết thúc ở `today`, YYYY-MM-DD) kèm số lượt nộp, theo thứ tự cũ -> mới. */
export function lastDays(
  days: Array<{ date: string; count: number }>,
  today: string,
  n: number,
): Array<{ date: string; count: number }> {
  const byDate = new Map(days.map((d) => [d.date, d.count]));
  const out: Array<{ date: string; count: number }> = [];
  const end = new Date(`${today}T00:00:00.000Z`);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: byDate.get(key) ?? 0 });
  }
  return out;
}
