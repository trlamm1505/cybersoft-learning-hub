import axiosClient from '../common/configAxios';
import type {
  CatalogExercise,
  ClassDetail,
  ClassOverview,
  TeacherClassSummary,
  ExerciseDetail,
  StudentDetail,
} from '../types/teacherAnalytics';

const cls = (id: string) => `/teacher/classes/${encodeURIComponent(id)}`;

/**
 * API Teacher Dashboard: giảng viên chỉ xem số liệu và giao bài cho lớp được Admin phân công. BE trả
 * 403 cho học viên và khi mở lớp của giảng viên khác. Tạo/sửa/xóa lớp và quản lý học viên: adminClassesApi.
 */
export const teacherAnalyticsApi = {
  /**
   * Mọi lớp giảng viên có tên trong teacherId/teacherIds, kể cả lớp đã lưu trữ (xem lại lịch sử): số lớp khớp 100% với Admin Portal.
   * Truyền false để chỉ lấy lớp đang hoạt động.
   */
  getClasses: async (includeArchived = true): Promise<TeacherClassSummary[]> => {
    const res = (await axiosClient.get('/teacher/classes', {
      params: includeArchived ? { includeArchived: 'true' } : {},
    })) as unknown as { data: TeacherClassSummary[] };
    return res.data;
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
