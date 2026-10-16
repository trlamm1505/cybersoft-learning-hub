import { describe, expect, it } from 'vitest';
import {
  EDIT_MARK_INTERVAL_MS,
  IntegrityTracker,
  MAX_EDIT_MARKS,
  MAX_FOCUS_EVENTS,
} from './integrityTracker';

const T0 = Date.parse('2026-10-05T10:00:00Z');

describe('IntegrityTracker — thu thập tối thiểu', () => {
  it('chưa bắt đầu thì không ghi gì và snapshot là null', () => {
    const t = new IntegrityTracker();
    t.markEdit(T0, 10);
    t.onHidden(T0);
    t.onVisible(T0 + 1000);
    expect(t.snapshot(T0 + 2000)).toBeNull();
  });

  it('ghi lúc bắt đầu và một lần rời/quay lại màn hình', () => {
    const t = new IntegrityTracker();
    t.start(T0);
    t.onHidden(T0 + 60_000);
    t.onVisible(T0 + 90_000);
    const s = t.snapshot(T0 + 120_000)!;
    expect(s.startedAt).toBe(new Date(T0).toISOString());
    expect(s.focusEvents).toEqual([
      {
        leftAt: new Date(T0 + 60_000).toISOString(),
        returnedAt: new Date(T0 + 90_000).toISOString(),
      },
    ]);
  });

  it('hai lần ẩn liên tiếp không tạo sự kiện kép; quay lại không có lần ẩn thì bỏ qua', () => {
    const t = new IntegrityTracker();
    t.start(T0);
    t.onVisible(T0 + 1000);
    t.onHidden(T0 + 2000);
    t.onHidden(T0 + 3000);
    t.onVisible(T0 + 4000);
    expect(t.snapshot(T0 + 5000)!.focusEvents).toHaveLength(1);
  });

  it('mốc chỉnh sửa chỉ ghi thưa (mỗi 30s) và chỉ lưu độ dài, không lưu nội dung', () => {
    const t = new IntegrityTracker();
    t.start(T0);
    for (let i = 1; i <= 100; i++) t.markEdit(T0 + i * 1000, i * 5);
    const marks = t.snapshot(T0 + 200_000)!.editMarks;
    // 100 lần gõ trong 100s → chỉ 4 mốc: giây 1, 31, 61, 91.
    expect(marks.map((m) => m.charCount)).toEqual([5, 155, 305, 455]);
    expect(marks[1].at).toBe(new Date(T0 + 31_000).toISOString());
    expect(Object.keys(marks[0]).sort()).toEqual(['at', 'charCount']);
  });

  it('chặn phình dữ liệu: tối đa số mốc và số sự kiện cho phép', () => {
    const t = new IntegrityTracker();
    t.start(T0);
    for (let i = 1; i <= MAX_EDIT_MARKS + 20; i++) {
      t.markEdit(T0 + i * EDIT_MARK_INTERVAL_MS, i);
    }
    for (let i = 0; i < MAX_FOCUS_EVENTS + 20; i++) {
      t.onHidden(T0 + i * 2000);
      t.onVisible(T0 + i * 2000 + 1000);
    }
    const s = t.snapshot(T0 + 10_000_000)!;
    expect(s.editMarks).toHaveLength(MAX_EDIT_MARKS);
    expect(s.focusEvents).toHaveLength(MAX_FOCUS_EVENTS);
  });

  it('đang rời màn hình lúc nộp: đóng sự kiện tại thời điểm nộp', () => {
    const t = new IntegrityTracker();
    t.start(T0);
    t.onHidden(T0 + 10_000);
    const s = t.snapshot(T0 + 25_000)!;
    expect(s.focusEvents).toEqual([
      {
        leftAt: new Date(T0 + 10_000).toISOString(),
        returnedAt: new Date(T0 + 25_000).toISOString(),
      },
    ]);
  });

  it('start() lần nữa xóa dữ liệu của phiên trước (đổi bài tập)', () => {
    const t = new IntegrityTracker();
    t.start(T0);
    t.onHidden(T0 + 1000);
    t.onVisible(T0 + 2000);
    t.start(T0 + 5000);
    expect(t.snapshot(T0 + 6000)!.focusEvents).toEqual([]);
  });
});
