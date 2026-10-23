import { INTEGRITY_CONFIG } from './integrity.config';
import type { IntegritySignals } from '../../modules-system/database/schemas/submission.schema';

/** Payload client gửi kèm khi nộp bài. Không tin tưởng: luôn qua sanitize. */
export interface ClientIntegrityPayload {
  startedAt?: string | number;
  editMarks?: Array<{ at?: string | number; charCount?: number }>;
  focusEvents?: Array<{
    leftAt?: string | number;
    returnedAt?: string | number;
  }>;
}

export interface SimilarityInput {
  score: number;
  submissionId?: string;
  userId?: string;
}

const toDate = (v: unknown): Date | null => {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Dựng tín hiệu liêm chính từ payload client + đồng hồ server + điểm tương đồng.
 * Thời điểm nộp luôn là của server. Hàm này chỉ GHI NHẬN và GẮN CỜ: không
 * trả về điểm, không đổi trạng thái chấm. Nộp nhanh một mình không bao giờ gắn cờ.
 */
export function buildIntegritySignals(
  payload: ClientIntegrityPayload | undefined,
  similarity: SimilarityInput,
  now: Date = new Date(),
): IntegritySignals {
  const submittedAt = now;
  let startedAt = toDate(payload?.startedAt) ?? submittedAt;
  if (startedAt > submittedAt) startedAt = submittedAt;
  const totalSeconds = Math.round(
    (submittedAt.getTime() - startedAt.getTime()) / 1000,
  );

  const focusEvents: IntegritySignals['focusEvents'] = [];
  for (const ev of (payload?.focusEvents ?? []).slice(
    0,
    INTEGRITY_CONFIG.maxFocusEvents,
  )) {
    const leftAt = toDate(ev?.leftAt);
    const returnedAt = toDate(ev?.returnedAt);
    if (!leftAt || !returnedAt || returnedAt < leftAt) continue;
    const awaySeconds = Math.min(
      Math.round((returnedAt.getTime() - leftAt.getTime()) / 1000),
      INTEGRITY_CONFIG.maxSingleAwaySeconds,
    );
    focusEvents.push({ leftAt, returnedAt, awaySeconds });
  }
  const totalAwaySeconds = Math.min(
    focusEvents.reduce((sum, e) => sum + e.awaySeconds, 0),
    totalSeconds,
  );

  const editMarks: IntegritySignals['timeline']['editMarks'] = [];
  for (const m of (payload?.editMarks ?? []).slice(
    0,
    INTEGRITY_CONFIG.maxEditMarks,
  )) {
    const at = toDate(m?.at);
    if (!at || typeof m.charCount !== 'number' || m.charCount < 0) continue;
    editMarks.push({
      at,
      charCount: Math.min(Math.floor(m.charCount), 1_000_000),
    });
  }

  const similarityFlagged =
    similarity.score >= INTEGRITY_CONFIG.similarityThreshold;
  const focusFlagged =
    focusEvents.length >= INTEGRITY_CONFIG.focusLeaveCountThreshold &&
    totalAwaySeconds >= INTEGRITY_CONFIG.focusAwaySecondsThreshold;

  const reasons: string[] = [];
  if (similarityFlagged) {
    reasons.push(
      `Mã nguồn tương đồng ${Math.round(similarity.score * 100)}% với một bài nộp khác (ngưỡng ${Math.round(INTEGRITY_CONFIG.similarityThreshold * 100)}%). Cần giảng viên xem xét, chưa kết luận sao chép.`,
    );
  }
  if (focusFlagged) {
    reasons.push(
      `Rời màn hình làm bài ${focusEvents.length} lần, tổng ${totalAwaySeconds} giây. Có thể do lý do chính đáng (tra tài liệu, thông báo hệ thống).`,
    );
  }
  const flagged = reasons.length > 0;

  return {
    timeline: {
      startedAt,
      submittedAt,
      editMarks,
      totalSeconds,
      activeSeconds: Math.max(0, totalSeconds - totalAwaySeconds),
    },
    focusEvents,
    focusSummary: { count: focusEvents.length, totalAwaySeconds },
    similarity: {
      score: similarity.score,
      matchedSubmissionId: similarity.submissionId,
      matchedUserId: similarity.userId,
      flagged: similarityFlagged,
    },
    flag: flagged ? 'REVIEW' : 'NONE',
    reasons,
    reviewStatus: flagged ? 'NEEDS_REVIEW' : 'NORMAL',
  };
}
