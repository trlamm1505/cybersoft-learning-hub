import axiosClient from '../common/configAxios';
import type {
  AddStudentsResult,
  AdminClassDetail,
  AdminClassSummary,
  CatalogStudent,
  ClassSummary,
  ImportResult,
  PersonRef,
} from '../types/teacherAnalytics';

const cls = (id: string) => `/admin/classes/${encodeURIComponent(id)}`;

/** API quản trị lớp học: chỉ ADMIN (BE trả 403 cho giảng viên và học viên). */
export const adminClassesApi = {
  list: async (): Promise<AdminClassSummary[]> => {
    return await axiosClient.get('/admin/classes');
  },

  create: async (input: { name: string; description?: string; teacherId: string }): Promise<ClassSummary> => {
    return await axiosClient.post('/admin/classes', input);
  },

  update: async (
    classId: string,
    input: { name?: string; description?: string; archived?: boolean; teacherId?: string },
  ): Promise<ClassSummary> => {
    return await axiosClient.put(cls(classId), input);
  },

  remove: async (classId: string): Promise<{ id: string; deleted: boolean }> => {
    return await axiosClient.delete(cls(classId));
  },

  detail: async (classId: string): Promise<AdminClassDetail> => {
    return await axiosClient.get(cls(classId));
  },

  addStudents: async (classId: string, identifiers: string[]): Promise<AddStudentsResult> => {
    return await axiosClient.post(`${cls(classId)}/students`, { identifiers });
  },

  removeStudent: async (classId: string, studentId: string) => {
    return await axiosClient.delete(`${cls(classId)}/students/${encodeURIComponent(studentId)}`);
  },

  /** Import danh sách email từ .xlsx/.xls/.csv (multipart, trường `file`). */
  importStudents: async (classId: string, file: File): Promise<ImportResult> => {
    const form = new FormData();
    form.append('file', file);
    return await axiosClient.post(`${cls(classId)}/students/import`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    });
  },

  searchTeachers: async (q = ''): Promise<PersonRef[]> => {
    return await axiosClient.get('/admin/classes/catalog/teachers', { params: { q } });
  },

  searchStudents: async (q: string): Promise<CatalogStudent[]> => {
    return await axiosClient.get('/admin/classes/catalog/students', { params: { q } });
  },
};

export default adminClassesApi;
