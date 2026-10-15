import type { AuthUser } from '../types/auth';

/** Các trang xác thực: khách chưa đăng nhập chỉ được vào những trang này. */
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export const isAuthPath = (pathname: string): boolean => AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Trang đích sau khi đăng nhập/đăng ký thành công:
 *  - ADMIN -> trang quản trị; TEACHER -> soạn bài;
 *  - học sinh Lớp 3–5 -> /block-puzzle (Kid Mode);
 *  - học sinh còn lại (6–9, 10–12, người lớn, chưa chọn nhóm tuổi) -> /playground.
 */
export function homeFor(user: Pick<AuthUser, 'role' | 'ageGroup'> | null | undefined): string {
  if (!user) return '/login';
  if (user.role === 'ADMIN') return '/admin/dashboard';
  if (user.role === 'TEACHER') return '/authoring';
  return user.ageGroup === '3-5' ? '/block-puzzle' : '/playground';
}
