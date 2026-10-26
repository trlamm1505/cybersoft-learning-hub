import type { AgeGroup, AuthUser } from '../types/auth';

/** Các nhóm đối tượng người dùng chọn khi đăng ký / ở modal sau đăng nhập lần đầu. */
export const USER_GROUP_OPTIONS: Array<{ value: AgeGroup; label: string }> = [
  { value: '3-5', label: 'Lớp 3-5' },
  { value: '6-9', label: 'Lớp 6-9' },
  { value: '10-12', label: 'Lớp 10-12' },
  { value: 'CAREER_ADULT', label: 'Người đi làm / Trái ngành' },
];

export const isCareerAdult = (user: Pick<AuthUser, 'role' | 'ageGroup'> | null | undefined): boolean =>
  !!user && user.role === 'STUDENT' && user.ageGroup === 'CAREER_ADULT';

/**
 * Người đi làm / Trái ngành chỉ dùng: Phòng thực hành chuyên ngành, Lớp học của tôi, Danh mục khóa học.
 * Ẩn Playground học sinh, Thi trắc nghiệm phổ thông và Cuộc thi. Ngoại lệ: bài của LỚP (có ?assignment=) mở bằng
 * trang Playground/Quiz để làm bài giao trong "Lớp học của tôi".
 */
export function careerBlockedPath(pathname: string, search = ''): boolean {
  const inClass = new URLSearchParams(search).has('assignment');
  if (pathname.startsWith('/playground') || pathname.startsWith('/quiz')) return !inClass;
  return ['/contests', '/block-puzzle', '/kid-leaderboard', '/progress'].some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
