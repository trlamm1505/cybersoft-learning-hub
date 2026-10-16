import axiosClient from '../common/configAxios';
import type {
  CatalogExercise,
  ClassDetail,
  ClassOverview,
  ClassSummary,
  ExerciseDetail,
  StudentDetail,
} from '../types/teacherAnalytics';

const cls = (id: string) => `/teacher/classes/${encodeURIComponent(id)}`;

/**
 * API Teacher Dashboard: giảng viên chỉ xem số liệu và giao bài cho lớp được Admin phân công. BE trả
 * 403 cho học viên và khi mở lớp của giảng viên khác. Tạo/sửa/xóa lớp và quản lý học viên: adminClassesApi.
 */
export const teacherAnalyticsApi = {
  getClasses: async (includeArchived = false): Promise<ClassSummary[]> => {
    return await axiosClient.get('/teacher/classes', {
      params: includeArchived ? { includeArchived: 'true' } : {},
    });
  },

  getClassDetail: async (classId: string): Promise<ClassDetail> => {
    return await axiosClient.get(cls(classId));
  },

  setExercises: async (classId: string, slugs: string[]): Promise<{ exerciseSlugs: string[] }> => {
    return await axiosClient.put(`${cls(classId)}/exercises`, { slugs });
  },

  searchExercises: async (q = ''): Promise<CatalogExercise[]> => {
    return await axiosClient.get('/teacher/classes/catalog/exercises', { params: { q } });
  },

  getOverview: async (classId: string): Promise<ClassOverview> => {
    return await axiosClient.get(`${cls(classId)}/analytics`);
  },

  getStudent: async (classId: string, studentId: string): Promise<StudentDetail> => {
    return await axiosClient.get(`${cls(classId)}/students/${encodeURIComponent(studentId)}`);
  },

  getExercise: async (classId: string, slug: string): Promise<ExerciseDetail> => {
    return await axiosClient.get(`${cls(classId)}/exercises/${encodeURIComponent(slug)}`);
  },
};

export default teacherAnalyticsApi;
