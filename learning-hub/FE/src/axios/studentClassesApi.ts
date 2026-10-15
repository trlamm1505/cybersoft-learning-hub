import axiosClient from '../common/configAxios';
import type { MyClass, MyEnrollment } from '../types/studentClasses';

/** GET /api/student/classes: lớp của học viên đang đăng nhập kèm bài được giao và trạng thái từng bài. */
export const studentClassesApi = {
  getMyClasses: async (): Promise<MyClass[]> => {
    return await axiosClient.get('/student/classes');
  },

  /** GET /api/student/enrollments: lớp đã tham gia + trạng thái + dữ liệu chứng chỉ khi hoàn thành. */
  getEnrollments: async (): Promise<MyEnrollment[]> => {
    return await axiosClient.get('/student/enrollments');
  },
};

export default studentClassesApi;
