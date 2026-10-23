import { describe, expect, it } from 'vitest';
import { donutArcs, intensityLevel, lastDays } from './progressCharts';

describe('donutArcs', () => {
  const slices = [
    { key: 'ac', label: 'AC', value: 3, color: 'g' },
    { key: 'wa', label: 'WA', value: 1, color: 'r' },
    { key: 'tle', label: 'TLE', value: 0, color: 'y' },
  ];
  it('chia chu vi theo tỷ lệ, bỏ lát bằng 0, cung nối tiếp nhau', () => {
    const arcs = donutArcs(slices, 100);
    expect(arcs.map((a) => a.key)).toEqual(['ac', 'wa']);
    expect(arcs[0]).toMatchObject({ percent: 75, length: 75, offset: 0 });
    expect(arcs[1]).toMatchObject({ percent: 25, length: 25, offset: 75 });
  });
  it('tổng bằng 0 thì không có cung', () => {
    expect(donutArcs([{ key: 'a', label: 'a', value: 0, color: 'x' }], 100)).toEqual([]);
  });
});

describe('intensityLevel', () => {
  it('0 lượt là ô trống, càng nhiều càng đậm', () => {
    expect([0, 1, 2, 3, 4, 6, 7, 20].map(intensityLevel)).toEqual([0, 1, 2, 2, 3, 3, 4, 4]);
  });
});

describe('lastDays', () => {
  it('đủ N ngày liên tiếp kết thúc hôm nay, ngày không có dữ liệu = 0', () => {
    const r = lastDays([{ date: '2026-10-04', count: 2 }, { date: '2026-10-05', count: 1 }], '2026-10-05', 4);
    expect(r).toEqual([
      { date: '2026-10-02', count: 0 },
      { date: '2026-10-03', count: 0 },
      { date: '2026-10-04', count: 2 },
      { date: '2026-10-05', count: 1 },
    ]);
  });
});
