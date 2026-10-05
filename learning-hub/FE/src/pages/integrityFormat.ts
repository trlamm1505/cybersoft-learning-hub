import type { IntegrityDecision, IntegrityQueueRow, IntegrityReviewStatus } from '../types/integrity';

/** "1 giờ 02 phút", "5 phút 07 giây", "42 giây". */
export const formatDuration = (seconds: number): string => {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h} giờ ${String(m).padStart(2, '0')} phút`;
  if (m > 0) return `${m} phút ${String(sec).padStart(2, '0')} giây`;
  return `${sec} giây`;
};

export const formatSimilarity = (score: number): string => `${Math.round(score * 100)}%`;

/** Nhãn trung tính: "cần xem xét" chứ không phải "nghi gian lận". */
export const REVIEW_STATUS_LABEL: Record<IntegrityReviewStatus, string> = {
  NORMAL: 'Bình thường',
  NEEDS_REVIEW: 'Cần xem xét',
  REVIEWED: 'Đã duyệt',
};

export const DECISION_LABEL: Record<IntegrityDecision, string> = {
  CLEARED: 'Không có vấn đề',
  CONCERN: 'Có dấu hiệu bất thường',
  FOLLOW_UP: 'Cần trao đổi thêm với học viên',
};

export const DECISIONS: IntegrityDecision[] = ['CLEARED', 'CONCERN', 'FOLLOW_UP'];

/** Hàng chờ: chưa duyệt lên trước, trong cùng nhóm thì mới nhất trước. Không đổi mảng gốc. */
export const sortQueue = (rows: IntegrityQueueRow[]): IntegrityQueueRow[] => {
  const rank = (r: IntegrityQueueRow) => (r.integrity.reviewStatus === 'REVIEWED' ? 1 : 0);
  return [...rows].sort(
    (a, b) => rank(a) - rank(b) || Date.parse(b.submittedAt) - Date.parse(a.submittedAt),
  );
};

/** Chỉ cho gửi kết luận khi đã chọn kết luận và có lý do (khớp ràng buộc BE). */
export const canSubmitReview = (decision: IntegrityDecision | '', note: string): boolean =>
  decision !== '' && note.trim().length > 0;
