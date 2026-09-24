import axiosClient from '../common/configAxios';
import type { LessonAuthoring, ImportLessonPayload } from '../types/authoring';

/**
 * Dùng axiosClient (không phải axios trần) để mọi request tự động gắn Bearer
 * token qua interceptor (configAxios.ts) — cần thiết vì create/update/delete/
 * import và GET :id giờ yêu cầu đăng nhập (TEACHER) ở phía Backend.
 */
export const authoringApi = {
  createLesson: async (lessonData: Partial<LessonAuthoring>): Promise<LessonAuthoring> => {
    return await axiosClient.post('/authoring/lessons/create', lessonData);
  },

  updateLesson: async (id: string, lessonData: Partial<LessonAuthoring>): Promise<LessonAuthoring> => {
    return await axiosClient.put(`/authoring/lessons/${id}`, lessonData);
  },

  getLessons: async (): Promise<LessonAuthoring[]> => {
    return await axiosClient.get('/authoring/lessons');
  },

  getLessonById: async (id: string): Promise<LessonAuthoring> => {
    return await axiosClient.get(`/authoring/lessons/${id}`);
  },

  exportLessonJson: async (id: string): Promise<ImportLessonPayload> => {
    return await axiosClient.get(`/authoring/lessons/export/${id}`);
  },

  importLessonJson: async (payload: ImportLessonPayload): Promise<LessonAuthoring> => {
    return await axiosClient.post('/authoring/lessons/import', payload);
  },

  deleteLesson: async (id: string): Promise<{ message: string }> => {
    return await axiosClient.delete(`/authoring/lessons/${id}`);
  },
};

export default authoringApi;
