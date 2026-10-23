import { createContext, useContext } from 'react';
import type { TeacherClassSummary } from '../types/teacherAnalytics';
import { canUseAiGeneratorFor } from '../pages/teacherClassesModel';

export interface TeacherClassesState {
  /** null = đang tải. */
  classes: TeacherClassSummary[] | null;
  loadFailed: boolean;
}

export const TeacherClassesContext = createContext<TeacherClassesState>({ classes: null, loadFailed: false });

export const useTeacherClasses = (): TeacherClassesState => useContext(TeacherClassesContext);

/** Giảng viên được dùng AI Tạo Đề không: chỉ khi phụ trách lớp K6-9 hoặc K10-12 còn hoạt động. null = chưa biết (đang tải). */
export function useCanUseAiGenerator(): boolean | null {
  const { classes } = useTeacherClasses();
  return classes === null ? null : canUseAiGeneratorFor(classes);
}
