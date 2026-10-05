import { describe, expect, it } from 'vitest';
import {
  buildHeatmap,
  dateKey,
  formatDateVi,
  levelFor,
  mondayOf,
  monthsShown,
  parseDateKey,
  sampleActivity,
  toCountMap,
  WEEKS_SHOWN,
} from './heatmapModel';

// Thứ Hai 05/10/2026 (giờ địa phương).
const END = new Date(2026, 9, 7); // Thứ Tư 07/10/2026

describe('ngày theo giờ địa phương', () => {
  it('dateKey/parseDateKey khứ hồi không lệch ngày', () => {
    expect(dateKey(new Date(2026, 0, 1, 23, 59))).toBe('2026-01-01');
    expect(dateKey(parseDateKey('2026-10-07'))).toBe('2026-10-07');
  });

  it('mondayOf: thứ Hai giữ nguyên, Chủ nhật lùi về thứ Hai trước đó', () => {
    expect(dateKey(mondayOf(new Date(2026, 9, 5)))).toBe('2026-10-05'); // Thứ Hai
    expect(dateKey(mondayOf(new Date(2026, 9, 7)))).toBe('2026-10-05'); // Thứ Tư
    expect(dateKey(mondayOf(new Date(2026, 9, 11)))).toBe('2026-10-05'); // Chủ nhật
  });

  it('formatDateVi', () => {
    expect(formatDateVi('2026-10-05')).toBe('05/10/2026');
  });
});

describe('levelFor', () => {
  it('0 lượt là mức 0', () => expect(levelFor(0, 10)).toBe(0));
  it('ít hoạt động (max ≤ 4): mức bằng đúng số lượt', () => {
    expect([1, 2, 3, 4].map((n) => levelFor(n, 4))).toEqual([1, 2, 3, 4]);
    expect(levelFor(1, 1)).toBe(1);
  });
  it('nhiều hoạt động: chia theo tỷ lệ so với ngày cao nhất', () => {
    expect([2, 5, 8, 10].map((n) => levelFor(n, 10))).toEqual([1, 2, 4, 4]);
    expect(levelFor(7, 10)).toBe(3);
  });
});

describe('buildHeatmap', () => {
  it('lưới WEEKS_SHOWN tuần × 7 ngày, bắt đầu từ thứ Hai, tuần cuối chứa ngày kết thúc', () => {
    const m = buildHeatmap({}, END);
    expect(m.weeks).toHaveLength(WEEKS_SHOWN);
    expect(m.weeks.every((w) => w.length === 7)).toBe(true);
    expect(new Date(m.weeks[0][0].date).getDay()).toBe(1); // thứ Hai
    const last = m.weeks[WEEKS_SHOWN - 1];
    expect(last[0].date).toBe('2026-10-05');
    expect(last.find((c) => c.date === '2026-10-07')?.future).toBe(false);
    expect(last.find((c) => c.date === '2026-10-08')?.future).toBe(true);
    expect(last.filter((c) => c.future)).toHaveLength(4); // thứ Năm đến Chủ nhật
  });

  it('cột đầu cách cột cuối đúng WEEKS_SHOWN - 1 tuần', () => {
    const m = buildHeatmap({}, END);
    expect(m.weeks[0][0].date).toBe('2026-01-05');
    expect(monthsShown()).toBe(9);
  });

  it('tổng, số ngày hoạt động và mức màu; bỏ dữ liệu ngoài cửa sổ và giá trị không dương', () => {
    const m = buildHeatmap(
      { '2026-10-07': 8, '2026-10-06': 2, '2026-10-01': 0, '2020-01-01': 99, '2026-12-01': 5, '2026-10-02': -3 },
      END,
    );
    expect(m.total).toBe(10);
    expect(m.activeDays).toBe(2);
    expect(m.max).toBe(8);
    const cell = (k: string) => m.weeks.flat().find((c) => c.date === k)!;
    expect(cell('2026-10-07')).toMatchObject({ count: 8, level: 4 });
    expect(cell('2026-10-06')).toMatchObject({ count: 2, level: 1 });
    expect(cell('2026-10-01')).toMatchObject({ count: 0, level: 0 });
  });

  it('nhãn tháng nằm ở cột đầu của tháng, không chồng nhau và theo thứ tự', () => {
    const m = buildHeatmap({}, END);
    const cols = m.monthLabels.map((l) => l.col);
    expect(cols).toEqual([...cols].sort((a, b) => a - b));
    for (let i = 1; i < cols.length; i++) expect(cols[i] - cols[i - 1]).toBeGreaterThanOrEqual(3);
    expect(m.monthLabels.map((l) => l.label)).toContain('Th10');
    expect(new Set(m.monthLabels.map((l) => l.label)).size).toBeGreaterThanOrEqual(9);
  });
});

describe('sampleActivity / toCountMap', () => {
  it('xác định theo ngày (cùng đầu vào luôn cùng kết quả) và có hoạt động', () => {
    const a = sampleActivity(END);
    expect(sampleActivity(END)).toEqual(a);
    const m = buildHeatmap(a, END);
    expect(m.total).toBeGreaterThan(50);
    expect(m.activeDays).toBeGreaterThan(40);
    expect(Math.max(...Object.values(a))).toBeLessThanOrEqual(6);
  });

  it('ngày thường nhiều hoạt động hơn cuối tuần', () => {
    const a = sampleActivity(END);
    let weekday = 0;
    let weekend = 0;
    for (const k of Object.keys(a)) {
      if ([0, 6].includes(parseDateKey(k).getDay())) weekend += 1;
      else weekday += 1;
    }
    expect(weekday).toBeGreaterThan(weekend * 2);
  });

  it('toCountMap chuyển danh sách ngày thành bảng tra', () => {
    expect(toCountMap([{ date: '2026-10-01', count: 2 }, { date: '2026-10-02', count: 5 }])).toEqual({
      '2026-10-01': 2,
      '2026-10-02': 5,
    });
  });
});
