export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export class Users {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}
