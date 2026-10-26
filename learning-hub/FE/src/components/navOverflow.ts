/**
 * Chia thanh điều hướng thành phần hiện sẵn và phần gom vào menu "Thêm" khi
 * không đủ chỗ. Thuần tính toán (không đụng DOM) để dễ kiểm thử.
 */
export interface OverflowInput {
  /** Chiều rộng từng mục (px), theo thứ tự hiển thị. */
  widths: number[];
  /** Chỗ trống có thể dùng (px). */
  available: number;
  /** Chiều rộng nút "Thêm" (px). */
  moreWidth: number;
  /** Khoảng cách giữa các mục (px). */
  gap: number;
}

/** Số mục hiện sẵn: tất cả nếu vừa; nếu không thì nhiều nhất có thể mà vẫn còn chỗ cho nút "Thêm". */
export function computeVisibleCount({ widths, available, moreWidth, gap }: OverflowInput): number {
  const total = widths.reduce((sum, w) => sum + w, 0) + gap * Math.max(0, widths.length - 1);
  if (total <= available) return widths.length;
  let used = moreWidth;
  let count = 0;
  for (const w of widths) {
    const next = used + gap + w;
    if (next > available) break;
    used = next;
    count++;
  }
  return count;
}

export interface OverflowSplit<T> {
  visible: T[];
  overflow: T[];
}

/**
 * Tách theo số mục hiện sẵn. Mục đang mở luôn được hiện sẵn (đổi chỗ với mục
 * cuối của phần hiện) để người dùng thấy mình đang ở đâu; thứ tự gốc được giữ.
 */
export function splitNavItems<T extends { key: string }>(items: T[], activeKey: string, count: number): OverflowSplit<T> {
  if (count >= items.length) return { visible: items, overflow: [] };
  if (count <= 0) return { visible: [], overflow: items };
  const activeIndex = items.findIndex((i) => i.key === activeKey);
  const keep = new Set(items.slice(0, count).map((i) => i.key));
  if (activeIndex >= count) {
    keep.delete(items[count - 1].key);
    keep.add(activeKey);
  }
  return {
    visible: items.filter((i) => keep.has(i.key)),
    overflow: items.filter((i) => !keep.has(i.key)),
  };
}
