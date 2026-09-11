export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER';
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER';
}

export interface LoginPayload {
  email: string;
  password: string;
}
