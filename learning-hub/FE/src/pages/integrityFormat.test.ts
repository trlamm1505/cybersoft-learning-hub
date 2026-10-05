import { describe, expect, it } from 'vitest';
import {
  canSubmitReview,
  formatDuration,
  formatSimilarity,
  REVIEW_STATUS_LABEL,
  sortQueue,
} from './integrityFormat';
import type { IntegrityQueueRow } from '../types/integrity';

const row = (id: string, submittedAt: string, reviewStatus: 'NEEDS_REVIEW' | 'REVIEWED'): IntegrityQueueRow =>
  ({
    id,
    submittedAt,
    judgeStatus: 'AC',
    student: { id: 'u' },
    exercise: { id: 'e' },
    integrity: { reviewStatus },
  }) as unknown as IntegrityQueueRow;

describe('định dạng hiển thị liêm chính', () => {
  it('formatDuration', () => {
    expect(formatDuration(42)).toBe('42 giây');
    expect(formatDuration(307)).toBe('5 phút 07 giây');
    expect(formatDuration(3720)).toBe('1 giờ 02 phút');
    expect(formatDuration(-5)).toBe('0 giây');
  });

  it('formatSimilarity làm tròn phần trăm', () => {
    expect(formatSimilarity(0.876)).toBe('88%');
    expect(formatSimilarity(0)).toBe('0%');
  });

  it('nhãn trạng thái trung tính, không dùng từ kết tội', () => {
    for (const label of Object.values(REVIEW_STATUS_LABEL)) {
      expect(label).not.toMatch(/gian lận|sao chép|vi phạm/i);
    }
  });

  it('sortQueue: chưa duyệt trước, mới nhất trước, không đổi mảng gốc', () => {
    const rows = [
      row('a', '2026-10-05T10:00:00Z', 'REVIEWED'),
      row('b', '2026-10-05T09:00:00Z', 'NEEDS_REVIEW'),
      row('c', '2026-10-05T11:00:00Z', 'NEEDS_REVIEW'),
    ];
    expect(sortQueue(rows).map((r) => r.id)).toEqual(['c', 'b', 'a']);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });

  it('canSubmitReview cần cả kết luận lẫn lý do', () => {
    expect(canSubmitReview('', 'ghi chú')).toBe(false);
    expect(canSubmitReview('CLEARED', '   ')).toBe(false);
    expect(canSubmitReview('CLEARED', 'Cùng mã khung')).toBe(true);
  });
});
