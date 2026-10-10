/**
 * Ma trận quyền dùng chung. STAFF = giảng viên và quản trị viên: soạn đề,
 * chấm bài, xem bài nộp của học viên. Chỉ STUDENT được làm bài thực hành
 * (StudentOnlyGuard). FE dùng cùng quy ước (FE/src/types/auth.ts).
 */
export const STAFF_ROLES = ['TEACHER', 'ADMIN'] as const;

export const isStaff = (role: string | undefined): boolean =>
  STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]);
