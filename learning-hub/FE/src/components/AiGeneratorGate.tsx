import React from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useCanUseAiGenerator } from './teacherClassesContext';

/** Chặn trang AI Tạo Đề với giảng viên không phụ trách lớp K6-9 / K10-12: đưa về Soạn bài thủ công. */
export const AiGeneratorGate: React.FC<{ children: React.ReactNode; redirectTo?: string }> = ({ children, redirectTo = '/teacher/authoring' }) => {
  const can = useCanUseAiGenerator();
  if (can === null) {
    return (
      <div className="flex items-center py-8 text-sm text-[var(--text-muted)]">
        <Loader2 className="mr-2 animate-spin" size={16} /> Đang tải...
      </div>
    );
  }
  return can ? <>{children}</> : <Navigate to={redirectTo} replace />;
};

export default AiGeneratorGate;
