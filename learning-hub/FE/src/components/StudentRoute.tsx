import React from 'react';
import { Navigate } from 'react-router-dom';
import type { AuthUser } from '../types/auth';
import { isStaff } from '../types/auth';

/**
 * Trang làm bài thực hành (AI Lab, DA Lab) chỉ dành cho STUDENT. Giảng viên và
 * quản trị viên về hàng chờ chấm bài, vai trò khác về trang chủ; không render
 * giao diện làm bài. BE vẫn chặn nộp bài bằng StudentOnlyGuard.
 */
export const StudentRoute: React.FC<{ authUser: AuthUser | null; children: React.ReactElement }> = ({
  authUser,
  children,
}) => {
  if (!authUser) return <Navigate to="/login" replace />;
  if (authUser.role !== 'STUDENT') {
    return <Navigate to={isStaff(authUser.role) ? '/teacher/review-queue' : '/'} replace />;
  }
  return children;
};

export default StudentRoute;
