/**
 * Đếm "lần rời màn hình" khi làm bài. Trình duyệt thường bắn nhiều sự kiện cho một lần
 * rời (visibilitychange rồi blur, hoặc ngược lại), nên một lần rời chỉ được tính MỘT lần:
 * phải quay lại (visible/focus) thì lần rời kế tiếp mới được tính. Thuần logic, không đụng DOM.
 */
export class LeaveDetector {
  private away = false;
  private total = 0;

  /** Trả true nếu đây là một lần rời MỚI (chưa được tính). */
  onLeave(): boolean {
    if (this.away) return false;
    this.away = true;
    this.total += 1;
    return true;
  }

  onReturn(): void {
    this.away = false;
  }

  get count(): number {
    return this.total;
  }

  reset(): void {
    this.away = false;
    this.total = 0;
  }
}

/** Phản hồi của POST /proctor/leave. */
export interface LeaveReport {
  count: number;
  locked: boolean;
  closed: boolean;
  teacherNotified: boolean;
  lockAt?: number;
}
