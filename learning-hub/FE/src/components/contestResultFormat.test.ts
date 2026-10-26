import { describe, expect, it } from 'vitest';
import { PENDING_SCORE_LABEL, countPendingScores, formatProblemScore } from './contestResultFormat';

describe('Kết quả contest: quiz chờ công bố điểm', () => {
  it('bài quiz chưa công bố hiện nhãn chờ, không hiện "0 / N"', () => {
    const text = formatProblemScore({ score: 0, maxPoints: 100, pendingScore: true });
    expect(text).toBe(PENDING_SCORE_LABEL);
    expect(text).not.toContain('0 / 100');
  });

  it('bài đã có điểm vẫn hiện điểm như cũ', () => {
    expect(formatProblemScore({ score: 50, maxPoints: 100 })).toBe('50 / 100đ');
    expect(formatProblemScore({ score: 0, maxPoints: 100, pendingScore: false })).toBe('0 / 100đ');
  });

  it('đếm số bài đang chờ để ghi chú tổng điểm', () => {
    expect(
      countPendingScores([
        { score: 0, maxPoints: 10, pendingScore: true },
        { score: 5, maxPoints: 10 },
        { score: 0, maxPoints: 10, pendingScore: true },
      ]),
    ).toBe(2);
  });
});
