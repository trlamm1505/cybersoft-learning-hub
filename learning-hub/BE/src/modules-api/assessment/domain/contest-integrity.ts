/** Một lần rời màn hình chỉ bị tính khi kéo dài từ 5 giây. */
export const MIN_COUNTED_LEAVE_MS = 5_000;
/** Đủ 3 lần rời (mỗi lần >= 5 giây) thì hệ thống tự nộp bài và gắn cờ cảnh báo. */
export const FORCE_SUBMIT_AT = 3;

export interface LeaveOutcome {
  /** Lần rời này có bị tính không. */
  counted: boolean;
  leaveCount: number;
  /** Lần này làm chạm ngưỡng: phải forceSubmit() ngay. */
  forceSubmit: boolean;
}

/**
 * Ghi nhận một lần rời màn hình trong cuộc thi. Lần rời dưới 5 giây (đổi tab thoáng qua) không tính.
 * `alreadyForced`: bài đã bị tự nộp trước đó thì không kích hoạt lại.
 */
export function registerLeave(currentCount: number, awayMs: number, alreadyForced = false): LeaveOutcome {
  const counted = Number.isFinite(awayMs) && awayMs >= MIN_COUNTED_LEAVE_MS;
  const leaveCount = currentCount + (counted ? 1 : 0);
  return { counted, leaveCount, forceSubmit: counted && !alreadyForced && leaveCount >= FORCE_SUBMIT_AT };
}

export const INTEGRITY_FLAG = 'OUT_TAB_FORCE_SUBMIT';
