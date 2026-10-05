import type { IntegrityClientPayload } from '../types/integrity';

/** Giới hạn khớp với BE (INTEGRITY_CONFIG): thu thập tối thiểu, không phình payload. */
export const MAX_FOCUS_EVENTS = 50;
export const MAX_EDIT_MARKS = 50;
/** Chỉ ghi một mốc chỉnh sửa mỗi khoảng này; không ghi từng phím bấm. */
export const EDIT_MARK_INTERVAL_MS = 30_000;

/**
 * Bộ ghi tín hiệu làm bài ở mức tối thiểu: lúc bắt đầu, vài mốc chỉnh sửa thô
 * (thời điểm + độ dài mã, KHÔNG lưu nội dung) và các lần rời/quay lại màn hình
 * (KHÔNG ghi trang nào khác). Thuần logic, không đụng DOM: nhận thời gian từ
 * ngoài để dễ kiểm thử.
 */
export class IntegrityTracker {
  private startedAt: number | null = null;
  private leftAt: number | null = null;
  private lastMarkAt = 0;
  private editMarks: IntegrityClientPayload['editMarks'] = [];
  private focusEvents: IntegrityClientPayload['focusEvents'] = [];

  start(now: number): void {
    this.startedAt = now;
    this.leftAt = null;
    this.lastMarkAt = 0;
    this.editMarks = [];
    this.focusEvents = [];
  }

  /** Gọi khi người dùng gõ code (không gọi khi hệ thống tự điền mã khung). */
  markEdit(now: number, charCount: number): void {
    if (this.startedAt === null) return;
    if (now - this.lastMarkAt < EDIT_MARK_INTERVAL_MS) return;
    if (this.editMarks.length >= MAX_EDIT_MARKS) return;
    this.lastMarkAt = now;
    this.editMarks.push({ at: new Date(now).toISOString(), charCount });
  }

  onHidden(now: number): void {
    if (this.startedAt === null || this.leftAt !== null) return;
    this.leftAt = now;
  }

  onVisible(now: number): void {
    if (this.startedAt === null || this.leftAt === null) return;
    if (this.focusEvents.length < MAX_FOCUS_EVENTS) {
      this.focusEvents.push({
        leftAt: new Date(this.leftAt).toISOString(),
        returnedAt: new Date(now).toISOString(),
      });
    }
    this.leftAt = null;
  }

  /** Dữ liệu gửi kèm bài nộp; null nếu chưa bắt đầu phiên làm bài. */
  snapshot(now: number): IntegrityClientPayload | null {
    if (this.startedAt === null) return null;
    // Đang rời màn hình lúc nộp (hiếm): đóng sự kiện tại thời điểm nộp.
    const open =
      this.leftAt !== null && this.focusEvents.length < MAX_FOCUS_EVENTS
        ? [
            {
              leftAt: new Date(this.leftAt).toISOString(),
              returnedAt: new Date(now).toISOString(),
            },
          ]
        : [];
    return {
      startedAt: new Date(this.startedAt).toISOString(),
      editMarks: [...this.editMarks],
      focusEvents: [...this.focusEvents, ...open],
    };
  }
}
