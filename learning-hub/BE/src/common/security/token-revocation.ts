/**
 * Danh sách thu hồi token phía server (đăng xuất). Lưu trong bộ nhớ, mỗi `jti` sống đúng bằng thời hạn còn lại của
 * token nên bảng không phình mãi. Triển khai nhiều instance thì thay `store` bằng Redis (SET jti EX ttl) giữ nguyên giao diện.
 */
export class TokenRevocationList {
  private readonly store = new Map<string, number>();

  revoke(jti: string, expSeconds: number | undefined, now = Date.now()): void {
    // Token không có hạn thì giữ 7 ngày (bằng hạn dài nhất ta cấp).
    const expiresAt = expSeconds ? expSeconds * 1000 : now + 7 * 24 * 3600 * 1000;
    if (expiresAt <= now) return;
    this.store.set(jti, expiresAt);
    this.sweep(now);
  }

  isRevoked(jti: string | undefined, now = Date.now()): boolean {
    if (!jti) return false;
    const exp = this.store.get(jti);
    if (exp === undefined) return false;
    if (exp <= now) {
      this.store.delete(jti);
      return false;
    }
    return true;
  }

  private sweep(now: number): void {
    if (this.store.size < 1000) return;
    for (const [k, v] of this.store) if (v <= now) this.store.delete(k);
  }

  get size(): number {
    return this.store.size;
  }
}

export const tokenRevocation = new TokenRevocationList();
