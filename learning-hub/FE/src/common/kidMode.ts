import type { AuthUser } from '../types/auth';
import { isStaff } from '../types/auth';

/**
 * Chế độ Kid (Lớp 3–5): bật cho học viên có ageGroup '3-5'. Giảng viên/Admin xem trước bằng `?kid=1`
 * (chỉ staff, học viên khác không tự bật được bằng URL).
 */
export const isKidMode = (user: AuthUser | null | undefined, search = ''): boolean => {
  if (user?.role === 'STUDENT') return user.ageGroup === '3-5';
  if (isStaff(user?.role)) return new URLSearchParams(search).get('kid') === '1';
  return false;
};

/** Trang chủ của học sinh Kid Mode: danh sách mini-game Block Puzzle. */
export const KID_HOME = '/block-puzzle';

/** Trong Kid Mode chỉ các trang này được mở; mọi đường dẫn khác đưa về Góc Học Tập. */
const KID_ALLOWED_PREFIXES = ['/playground', '/block-puzzle', '/progress', '/kid-leaderboard', '/profile', '/login'];

export const isKidAllowedPath = (pathname: string): boolean =>
  KID_ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/** Mục điều hướng của Kid Mode: đúng ba nút lớn. */
export const KID_NAV = [
  { key: 'learn', label: 'Góc Học Tập', path: '/block-puzzle' },
  { key: 'achievements', label: 'Bảng Thành Tích', path: '/progress' },
  { key: 'honor', label: 'Bảng Vinh Danh', path: '/kid-leaderboard' },
] as const;
