export type AgeGroup = '3-5' | '6-9' | '10-12';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

/**
 * Ma trận quyền dùng chung với BE (BE/src/common/auth/roles.ts): STAFF =
 * giảng viên + quản trị viên, dùng giao diện soạn đề / chấm bài. Chỉ STUDENT
 * làm bài thực hành.
 */
export const isStaff = (role: string | undefined): boolean => role === 'TEACHER' || role === 'ADMIN';

export const ROLE_LABEL: Record<UserRole, string> = {
  STUDENT: 'Học viên',
  TEACHER: 'Giảng viên',
  ADMIN: 'Quản trị viên',
};

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  ageGroup?: AgeGroup;
  studentCode?: string;
  /** URL ảnh hoặc data URL ảnh đã thu nhỏ; thiếu thì dùng avatar chữ cái. */
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

// Đăng ký công khai luôn tạo STUDENT — role/ageGroup không còn nhận từ form.
export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role?: 'STUDENT';
}

export interface SetAgeGroupPayload {
  ageGroup: AgeGroup;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}
