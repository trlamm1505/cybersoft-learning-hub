import axiosClient from '../common/configAxios';
import type { MyClass } from '../types/studentClasses';

/** GET /api/student/classes: lớp của học viên đang đăng nhập kèm bài được giao và trạng thái từng bài. */
export const studentClassesApi = {
  getMyClasses: async (): Promise<MyClass[]> => {
    return await axiosClient.get('/student/classes');
  },
};

export default studentClassesApi;
