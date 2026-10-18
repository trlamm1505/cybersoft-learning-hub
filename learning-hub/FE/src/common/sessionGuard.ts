import { clearAuthSession, getStoredToken, isTokenExpired } from './authSession';

export type SessionEndReason = 'expired' | 'locked';

/** Thông báo thân thiện ở trang đăng nhập theo lý do kết thúc phiên (dùng chung với LoginPage). */
export const SESSION_NOTICE: Record<SessionEndReason, string> = {
  expired: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại',
  locked: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
};

const EXPIRED_FLAG = 'app_session_expired_notice';

/** Ghi nhớ (qua lần chuyển trang) rằng phiên vừa hết hạn để trang đăng nhập hiện thông báo. */
export function markSessionExpiredNotice(): void {
  try {
    sessionStorage.setItem(EXPIRED_FLAG, '1');
  } catch {
    /* trình duyệt chặn sessionStorage: bỏ qua, chỉ mất thông báo */
  }
}

/** Đọc và xóa cờ thông báo hết hạn (mỗi lần hết hạn chỉ hiện một lần). */
export function consumeSessionExpiredNotice(): boolean {
  try {
    const on = sessionStorage.getItem(EXPIRED_FLAG) === '1';
    sessionStorage.removeItem(EXPIRED_FLAG);
    return on;
  } catch {
    return false;
  }
}

export const loginUrlFor = (reason: SessionEndReason): string => (reason === 'locked' ? '/login?locked=1' : '/login?expired=1');

export interface SessionGuardDeps {
  clear: () => void;
  redirect: (url: string) => void;
  currentPath: () => string;
  getToken: () => string | null;
}

/**
 * Chặn "bão request" khi phiên hỏng: lần đầu gặp token hết hạn/bị từ chối thì xóa phiên và chuyển về /login ĐÚNG MỘT LẦN; mọi request
 * còn lại (kể cả đang chờ trong hàng đợi) bị hủy ngay ở client thay vì tiếp tục gọi API và dội 401 liên tục.
 */
export function createSessionGuard(deps: SessionGuardDeps) {
  let ended = false;

  const end = (reason: SessionEndReason) => {
    if (ended) return;
    ended = true;
    deps.clear();
    if (deps.currentPath() !== '/login') deps.redirect(loginUrlFor(reason));
  };

  return {
    end,
    /** Phiên đã kết thúc: mọi request mới phải bị hủy. */
    get ended() {
      return ended;
    },
    /** Gọi trước mỗi request có token: true = được phép gửi. Token đã hết hạn thì kết thúc phiên và chặn luôn, không gọi API. */
    allowRequest(isPublic: boolean): boolean {
      if (ended) return false;
      const token = deps.getToken();
      if (token && !isPublic && isTokenExpired(token)) {
        end('expired');
        return false;
      }
      return true;
    },
    /** Đăng nhập lại thành công: cho phép gọi API trở lại. */
    reset() {
      ended = false;
    },
  };
}

export const browserSessionGuard = createSessionGuard({
  clear: clearAuthSession,
  redirect: (url) => window.location.assign(url),
  currentPath: () => window.location.pathname,
  getToken: getStoredToken,
});
