export type AgeGroup = '3-5' | '6-9' | '10-12';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER';
  ageGroup?: AgeGroup;
  studentCode?: string;
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
