import axiosClient from '../common/configAxios';
import type { BankExercise, BankQuery, BankQuestion, CreateDayAssignment, Paged, TeacherClassDays } from '../types/classDays';

const cls = (id: string) => encodeURIComponent(id);
const params = (q: BankQuery) => ({ q: q.q || undefined, difficulty: q.difficulty || undefined, band: q.band || undefined, page: q.page ?? 1, pageSize: q.pageSize ?? 10 });

/** Bài giao theo Ngày của lớp (collection class_assignments, cùng nguồn học viên đọc ở "Lớp học của tôi"). */
export const teacherClassAssignmentsApi = {
  getDays: async (classId: string): Promise<TeacherClassDays> => {
    return await axiosClient.get(`/teacher/class-assignments/${cls(classId)}/days`);
  },

  /** Ngân hàng bài code, 10 bài/trang, tìm theo tên và lọc độ khó. */
  catalogExercises: async (q: BankQuery): Promise<Paged<BankExercise>> => {
    return await axiosClient.get('/teacher/class-assignments/catalog/exercises', { params: params(q) });
  },

  catalogQuestions: async (q: BankQuery): Promise<Paged<BankQuestion>> => {
    return await axiosClient.get('/teacher/class-assignments/catalog/questions', { params: params(q) });
  },

  create: async (classId: string, body: CreateDayAssignment) => {
    return await axiosClient.post(`/teacher/class-assignments/${cls(classId)}`, body);
  },

  remove: async (classId: string, assignmentId: string): Promise<{ deleted: boolean }> => {
    return await axiosClient.delete(`/teacher/class-assignments/${cls(classId)}/${encodeURIComponent(assignmentId)}`);
  },
};

export default teacherClassAssignmentsApi;
