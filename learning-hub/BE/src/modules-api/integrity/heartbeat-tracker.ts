/** Client gửi nhịp 5 giây/lần; mất liên tục 2 nhịp (cộng dung sai mạng) mà không do offline cục bộ thì là gián đoạn nghi vấn. */
export const HEARTBEAT_INTERVAL_MS = 5_000;
export const HEARTBEAT_MISSED_BEATS = 2;
export const HEARTBEAT_GRACE_MS = 2_000;
export const SUSPICIOUS_GAP_MS = HEARTBEAT_INTERVAL_MS * HEARTBEAT_MISSED_BEATS + HEARTBEAT_GRACE_MS;
const MAX_ENTRIES = 5_000;

export interface BeatResult {
  /** Khoảng trống từ nhịp trước (ms); null ở nhịp đầu tiên. */
  gapMs: number | null;
  /** Có một gián đoạn nghi vấn vừa được phát hiện. */
  suspicious: boolean;
}

/**
 * Theo dõi nhịp tim theo (học viên, bài). Nhịp đến trễ hơn SUSPICIOUS_GAP_MS và client không báo `wasOffline`
 * (mất mạng cục bộ, do chính trình duyệt biết) thì tính là một gián đoạn nghi vấn.
 */
export class HeartbeatTracker {
  private readonly last = new Map<string, number>();

  beat(key: string, wasOffline: boolean, now = Date.now()): BeatResult {
    const prev = this.last.get(key);
    this.last.set(key, now);
    if (this.last.size > MAX_ENTRIES) this.sweep(now);
    if (prev === undefined) return { gapMs: null, suspicious: false };
    const gapMs = now - prev;
    return { gapMs, suspicious: gapMs > SUSPICIOUS_GAP_MS && !wasOffline };
  }

  end(key: string): void {
    this.last.delete(key);
  }

  private sweep(now: number): void {
    for (const [k, t] of this.last) if (now - t > 10 * 60_000) this.last.delete(k);
  }
}
