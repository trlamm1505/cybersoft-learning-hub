import { describe, expect, it } from 'vitest';
import {
  addDays,
  buildPayload,
  dayTitle,
  defaultDueLocal,
  localVnToIso,
  nextDayDate,
  pageLabel,
  startOfDayIso,
  toggleId,
  validateAddForm,
  vnDayKey,
  type AddForm,
} from './classDaysModel';

const form = (over: Partial<AddForm> = {}): AddForm => ({
  type: 'CODING',
  exerciseSlug: 'tinh-tong',
  exerciseTitle: 'Tính tổng',
  questionIds: [],
  title: 'Tính tổng',
  maxPoints: 10,
  dueLocal: '2026-10-30T23:59',
  ...over,
});

describe('classDaysModel: ngày học', () => {
  it('khóa ngày theo giờ Việt Nam, cộng ngày qua ranh giới tháng/năm', () => {
    expect(vnDayKey(new Date('2026-10-19T18:00:00Z'))).toBe('2026-10-20');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(startOfDayIso('2026-10-20')).toBe('2026-10-19T17:00:00.000Z');
  });

  it('"Thêm ngày mới": sau ngày cuối (kể cả ngày vừa thêm chưa có bài); lớp chưa có ngày thì hôm nay', () => {
    const days = [{ date: '2026-10-13' }, { date: '2026-10-14' }];
    expect(nextDayDate(days, [])).toBe('2026-10-15');
    expect(nextDayDate(days, ['2026-10-15'])).toBe('2026-10-16');
    expect(nextDayDate([], [], new Date('2026-10-16T05:00:00Z'))).toBe('2026-10-16');
  });

  it('tiêu đề ngày và hạn mặc định (23:59, 7 ngày sau)', () => {
    expect(dayTitle({ dayNumber: 3, date: '2026-10-15' })).toBe('Ngày 3 · 15/10/2026');
    expect(defaultDueLocal('2026-10-15')).toBe('2026-10-22T23:59');
  });

  it('datetime-local hiểu theo giờ Việt Nam', () => {
    expect(localVnToIso('2026-10-30T23:59')).toBe('2026-10-30T16:59:00.000Z');
    expect(localVnToIso('')).toBeNull();
    expect(localVnToIso('30/10/2026')).toBeNull();
  });

  it('kiểm tra form: phải chọn bài, có tiêu đề, điểm hợp lệ, hạn sau ngày giao', () => {
    expect(validateAddForm(form(), '2026-10-20')).toBeNull();
    expect(validateAddForm(form({ exerciseSlug: '' }), '2026-10-20')).toMatch(/chọn một bài code/);
    expect(validateAddForm(form({ type: 'QUIZ', questionIds: [] }), '2026-10-20')).toMatch(/ít nhất 1 câu/);
    expect(validateAddForm(form({ title: '  ' }), '2026-10-20')).toMatch(/Tiêu đề/);
    expect(validateAddForm(form({ maxPoints: 0 }), '2026-10-20')).toMatch(/Tổng điểm/);
    expect(validateAddForm(form({ dueLocal: '' }), '2026-10-20')).toMatch(/Hạn nộp không hợp lệ/);
    expect(validateAddForm(form({ dueLocal: '2026-10-19T10:00' }), '2026-10-20')).toMatch(/sau thời điểm bắt đầu/);
  });

  it('payload: code gửi exerciseSlug, trắc nghiệm gửi questionIds; startAt là 00:00 của ngày được giao', () => {
    expect(buildPayload(form({ title: ' Tính tổng ' }), '2026-10-20')).toEqual({
      type: 'CODING',
      exerciseSlug: 'tinh-tong',
      title: 'Tính tổng',
      maxPoints: 10,
      startAt: '2026-10-19T17:00:00.000Z',
      dueAt: '2026-10-30T16:59:00.000Z',
    });
    const quiz = buildPayload(form({ type: 'QUIZ', questionIds: ['a', 'b'] }), '2026-10-20');
    expect(quiz).toMatchObject({ type: 'QUIZ', questionIds: ['a', 'b'] });
    expect(quiz).not.toHaveProperty('exerciseSlug');
  });

  it('chọn nhiều câu qua các trang không trùng; nhãn phân trang', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
    expect(pageLabel(2, 5, 47)).toBe('Trang 2/5 · 47 bài');
    expect(pageLabel(1, 0, 0)).toBe('Trang 1/1 · 0 bài');
  });
});
