import { describe, expect, it } from 'vitest';
import { computeVisibleCount, splitNavItems } from './navOverflow';

const items = ['a', 'b', 'c', 'd', 'e'].map((key) => ({ key }));
const widths = [100, 100, 100, 100, 100];

describe('computeVisibleCount', () => {
  it('đủ chỗ thì hiện hết, không cần nút Thêm', () => {
    expect(computeVisibleCount({ widths, available: 520, moreWidth: 80, gap: 4 })).toBe(5);
  });

  it('thiếu chỗ thì chừa chỗ cho nút Thêm', () => {
    // 80 (Thêm) + 3 mục (100 + 4 mỗi mục) = 392 ≤ 400; 4 mục = 496 > 400.
    expect(computeVisibleCount({ widths, available: 400, moreWidth: 80, gap: 4 })).toBe(3);
  });

  it('rất hẹp: không mục nào vừa thì gom hết vào Thêm', () => {
    expect(computeVisibleCount({ widths, available: 150, moreWidth: 80, gap: 4 })).toBe(0);
  });

  it('danh sách rỗng không lỗi', () => {
    expect(computeVisibleCount({ widths: [], available: 100, moreWidth: 80, gap: 4 })).toBe(0);
  });
});

describe('splitNavItems', () => {
  it('chia theo số mục hiện sẵn, giữ thứ tự', () => {
    const r = splitNavItems(items, 'a', 3);
    expect(r.visible.map((i) => i.key)).toEqual(['a', 'b', 'c']);
    expect(r.overflow.map((i) => i.key)).toEqual(['d', 'e']);
  });

  it('mục đang mở nằm trong phần gom thì được đưa ra hiện sẵn, thay mục hiện cuối', () => {
    const r = splitNavItems(items, 'e', 3);
    expect(r.visible.map((i) => i.key)).toEqual(['a', 'b', 'e']);
    expect(r.overflow.map((i) => i.key)).toEqual(['c', 'd']);
  });

  it('hiện hết hoặc gom hết', () => {
    expect(splitNavItems(items, 'a', 9)).toEqual({ visible: items, overflow: [] });
    expect(splitNavItems(items, 'a', 0)).toEqual({ visible: [], overflow: items });
  });

  it('không đổi mảng gốc', () => {
    const copy = [...items];
    splitNavItems(items, 'e', 2);
    expect(items).toEqual(copy);
  });
});
