import type { AuthUser } from '../types/auth';

/** Các trang xác thực: khách chưa đăng nhập chỉ được vào những trang này. */
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export const isAuthPath = (pathname: string): boolean => AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Trang đích sau khi đăng nhập/đăng ký thành công:
 *  - ADMIN -> trang quản trị; TEACHER -> Teacher Studio;
 *  - học sinh Lớp 3–5 -> /block-puzzle (Kid Mode);
 *  - Người đi làm / Trái ngành (CAREER_ADULT) -> /career-labs (Hub 3 phòng lab);
 *  - học sinh còn lại (6–9, 10–12, chưa chọn nhóm tuổi) -> /playground.
 */
export function homeFor(user: Pick<AuthUser, 'role' | 'ageGroup'> | null | undefined): string {
  if (!user) return '/login';
  if (user.role === 'ADMIN') return '/admin/dashboard';
  if (user.role === 'TEACHER') return '/teacher/dashboard';
  if (user.ageGroup === 'CAREER_ADULT') return '/career-labs';
  return user.ageGroup === '3-5' ? '/block-puzzle' : '/playground';
}
