import { describe, expect, it } from 'vitest';
import { assignmentPath, dayHeading, rankMedal, scoreText, STATE_LABEL } from './classFormat';

describe('dayHeading', () => {
  it('đúng định dạng ví dụ trong đặc tả', () => {
    expect(dayHeading({ dayNumber: 1, date: '2026-03-23', pendingCount: 2 })).toBe('Ngày 1 - 23/03/2026: 2 bài chưa hoàn thành');
  });
  it('xong hết thì báo đã hoàn thành tất cả', () => {
    expect(dayHeading({ dayNumber: 3, date: '2026-03-25', pendingCount: 0 })).toBe('Ngày 3 - 25/03/2026: đã hoàn thành tất cả');
  });
});

describe('scoreText', () => {
  it('trắc nghiệm hiện thẳng điểm đạt, ví dụ 9/10 điểm', () => {
    expect(scoreText({ type: 'QUIZ', score: 9, maxPoints: 10, wrongCount: 0 })).toBe('9/10 điểm');
    expect(scoreText({ type: 'QUIZ', score: 7.8, maxPoints: 10, wrongCount: 0 })).toBe('7.8/10 điểm');
  });
  it('bài code bị trừ điểm thì nói rõ số lần nộp sai', () => {
    expect(scoreText({ type: 'CODING', score: 7, maxPoints: 10, wrongCount: 3 })).toBe('7/10 điểm (trừ 3 điểm do nộp sai 3 lần)');
    expect(scoreText({ type: 'CODING', score: 10, maxPoints: 10, wrongCount: 0 })).toBe('10/10 điểm');
  });
  it('chưa có điểm thì rỗng', () => {
    expect(scoreText({ type: 'CODING', score: null, maxPoints: 10, wrongCount: 1 })).toBe('');
  });
});

describe('assignmentPath', () => {
  it('bài code mở Playground kèm mã bài giao; trắc nghiệm mở /quiz', () => {
    expect(assignmentPath({ id: 'a1', type: 'CODING', exerciseSlug: 'tinh-tong' })).toBe('/playground?slug=tinh-tong&assignment=a1');
    expect(assignmentPath({ id: 'a2', type: 'QUIZ', exerciseSlug: null })).toBe('/quiz?assignment=a2');
  });
});

describe('nhãn', () => {
  it('trạng thái hết hạn ghi đúng cụm từ', () => expect(STATE_LABEL.EXPIRED).toBe('Đã hết hạn - Đã khóa'));
  it('huy chương top 3', () => {
    expect([1, 2, 3, 4].map(rankMedal)).toEqual(['🥇', '🥈', '🥉', '']);
  });
});
