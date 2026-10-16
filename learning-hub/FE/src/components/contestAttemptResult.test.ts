import { describe, expect, it } from 'vitest';
import { buildAttemptResult, describeResult, submittedResultsByIndex } from './contestAttemptResult';
import type { ContestMyAttempt, ContestMyResultRow } from '../types/contest';

const row = (over: Partial<ContestMyResultRow>): ContestMyResultRow => ({
  slug: 'a',
  title: 'A',
  type: 'coding',
  maxPoints: 60,
  submitted: true,
  resultHidden: false,
  score: 30,
  verdict: 'PARTIAL',
  passedCount: 1,
  totalCount: 2,
  submittedAt: '2026-10-05T10:00:00Z',
  ...over,
});

const mine = (rows: ContestMyResultRow[], over: Partial<ContestMyAttempt> = {}): ContestMyAttempt => ({
  attempt: {
    startedAt: '2026-10-05T09:00:00Z',
    deadlineAt: '2026-10-05T10:30:00Z',
    finishedAt: '2026-10-05T10:20:00Z',
    finishReason: 'MANUAL',
    serverTime: '2026-10-05T10:21:00Z',
    durationMinutes: 90,
    integrityEnabled: true,
  },
  results: rows,
  totalScore: 30,
  maxScore: 100,
  ...over,
});

describe('bảng điểm dựng từ máy chủ', () => {
  it('mô tả từng loại kết quả', () => {
    expect(describeResult(row({}))).toBe('Đạt 1/2 Test cases (30/60đ) — PARTIAL');
    expect(describeResult(row({ type: 'quiz', score: 40, maxPoints: 40, passedCount: 4, totalCount: 4 }))).toBe(
      'Đúng 4/4 câu trắc nghiệm (40/40đ)',
    );
    expect(describeResult(row({ type: 'quiz', resultHidden: true, score: null, totalCount: 4 }))).toMatch(/công bố sau/);
    expect(describeResult(row({ submitted: false, score: null }))).toBe('Chưa nộp bài thi');
  });

  it('điểm trắc nghiệm đang ẩn được đánh dấu pendingScore và tính 0 vào hiển thị', () => {
    const r = buildAttemptResult(
      { id: 'c1', title: 'Thi' },
      { id: 'u1', name: 'An' },
      mine([row({}), row({ slug: 'q', type: 'quiz', resultHidden: true, score: null })]),
    );
    expect(r.problemResults[1]).toMatchObject({ pendingScore: true, score: 0 });
    expect(r.totalScore).toBe(30);
    expect(r.percentage).toBe(30);
    expect(r.completedAt).toBe('2026-10-05T10:20:00Z');
  });

  it('tổng điểm tối đa 0 không gây chia cho 0', () => {
    expect(
      buildAttemptResult({ id: 'c', title: 'T' }, { id: 'u', name: 'N' }, mine([], { totalScore: 0, maxScore: 0 })).percentage,
    ).toBe(0);
  });

  it('khôi phục tiến độ theo thứ tự đề, chỉ các đề đã nộp', () => {
    const map = submittedResultsByIndex(
      [{ slug: 'a' }, { slug: 'b' }, { slug: 'c' }],
      mine([row({ slug: 'a' }), row({ slug: 'b', submitted: false, score: null }), row({ slug: 'c', score: 60, verdict: 'AC' })]),
    );
    expect(Object.keys(map)).toEqual(['0', '2']);
    expect(map[2].score).toBe(60);
  });
});
