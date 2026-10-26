import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PlaygroundGrid, PlaygroundProgress } from './PlaygroundList';
import { apiBandOfKey, canOpen, justFinishedTrack, lockedHint, nextItem, progressText } from '../pages/playgroundModel';
import type { PlaygroundExercise, PlaygroundStatus } from '../types/exercise';

/** Day 31: Code Playground (Khối 6-9 / 10-12): lộ trình chuẩn #1..#N, mở khóa tuần tự, X/N do máy chủ tính. */
const text = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

/** Thuộc tính HTML disabled thật (không lẫn aria-disabled="false"). */
const isDisabled = (html: string) => / disabled=""/.test(html);

const make = (statuses: PlaygroundStatus[]): PlaygroundExercise[] =>
  statuses.map((status, i) => ({
    _id: `id${i + 1}`, slug: `bai-${i + 1}`, title: `Bài số ${i + 1}`, description: '', type: 'CODE_TEXT', difficulty: 'EASY',
    points: 10, starterCode: '', timeLimitMs: 2000, order: i + 1, status,
  }));

describe('thẻ bài: #1 không bao giờ có ổ khóa, bài đã xong có huy hiệu xanh, bài sau bài đang mở bị khóa', () => {
  const items = make(['completed', 'completed', 'available', 'locked', 'locked']);
  const html = renderToString(<PlaygroundGrid items={items} showStatus onOpen={() => undefined} />);
  const card = (n: number) => html.split('<button')[n];

  it('đánh số #1..#N đúng thứ tự', () => {
    expect([1, 2, 3, 4, 5].every((n) => text(html).includes(`#${n}`))).toBe(true);
    expect(text(html).indexOf('#1')).toBeLessThan(text(html).indexOf('#2'));
  });

  it('bài đã hoàn thành (#1, #2): huy hiệu "Đã hoàn thành", KHÔNG ổ khóa, bấm được', () => {
    for (const n of [1, 2]) {
      expect(text(card(n))).toContain('Đã hoàn thành');
      expect(text(card(n))).not.toContain('Chưa mở khóa');
      expect(isDisabled(card(n))).toBe(false);
      expect(card(n)).toContain('data-status="completed"');
    }
  });

  it('bài đầu tiên chưa xong (#3): "Đang mở", bấm được; #4 #5: ổ khóa "Chưa mở khóa", không bấm được', () => {
    expect(text(card(3))).toContain('Đang mở');
    expect(isDisabled(card(3))).toBe(false);
    for (const n of [4, 5]) {
      expect(text(card(n))).toContain('Chưa mở khóa');
      expect(isDisabled(card(n))).toBe(true);
      expect(card(n)).toContain('aria-disabled="true"');
      expect(card(n)).toContain('Hoàn thành bài #3 trước để mở khóa bài');
    }
  });

  it('chưa làm gì: #1 là "Đang mở" (không ổ khóa), phần còn lại khóa', () => {
    const fresh = renderToString(<PlaygroundGrid items={make(['available', 'locked', 'locked'])} showStatus onOpen={() => undefined} />);
    const first = fresh.split('<button')[1];
    expect(text(first)).toContain('Đang mở');
    expect(text(first)).not.toContain('Chưa mở khóa');
    expect(isDisabled(first)).toBe(false);
  });

  it('giảng viên/Admin (showStatus=false): xem toàn bộ lộ trình, không huy hiệu, không khóa', () => {
    const staff = renderToString(<PlaygroundGrid items={make(['available', 'available'])} showStatus={false} onOpen={() => undefined} />);
    expect(text(staff)).not.toMatch(/Đang mở|Đã hoàn thành|Chưa mở khóa/);
    expect(isDisabled(staff)).toBe(false);
  });
});

describe('tiến độ và mô hình', () => {
  it('"Tiến độ: X/N" lấy đúng completed/total của máy chủ (kể cả 0/N)', () => {
    expect(text(renderToString(<PlaygroundProgress data={{ completed: 2, total: 20 }} />))).toContain('Tiến độ: 2/20 bài đã hoàn thành');
    expect(progressText({ completed: 0, total: 15 })).toBe('Tiến độ: 0/15 bài đã hoàn thành');
  });

  it('canOpen: chỉ bài khóa là không mở', () => {
    expect([canOpen({ status: 'completed' }), canOpen({ status: 'available' }), canOpen({ status: 'locked' })]).toEqual([true, true, false]);
  });

  it('lockedHint chỉ đúng bài cần làm trước; nextItem là bài ngay sau', () => {
    const items = make(['completed', 'available', 'locked']);
    expect(lockedHint(items, items[2])).toBe('Hoàn thành bài #2 trước để mở khóa bài #3');
    expect(nextItem(items, 'bai-1')?.slug).toBe('bai-2');
    expect(nextItem(items, 'bai-3')).toBeNull();
    expect(nextItem(items, 'khong-co')).toBeNull();
    expect(nextItem(items, null)).toBeNull();
  });

  it('chúc mừng chỉ khi vừa chuyển sang hoàn thành bài cuối (không chúc mừng khi mở lại lộ trình đã xong)', () => {
    expect(justFinishedTrack({ completed: 19, total: 20 }, { completed: 20, total: 20 })).toBe(true);
    expect(justFinishedTrack({ completed: 20, total: 20 }, { completed: 20, total: 20 })).toBe(false);
    expect(justFinishedTrack({ completed: 5, total: 20 }, { completed: 6, total: 20 })).toBe(false);
    expect(justFinishedTrack(undefined, { completed: 20, total: 20 })).toBe(false);
    expect(justFinishedTrack({ completed: 0, total: 0 }, { completed: 0, total: 0 })).toBe(false);
  });

  it('khóa nhóm FE -> khối API; Lớp 3-5 và Người lớn không có lộ trình', () => {
    expect([apiBandOfKey('6-9'), apiBandOfKey('9-12'), apiBandOfKey('10-12')]).toEqual(['6-9', '10-12', '10-12']);
    expect([apiBandOfKey('3-5'), apiBandOfKey('CAREER_ADULT'), apiBandOfKey(null)]).toEqual([null, null, null]);
  });
});
