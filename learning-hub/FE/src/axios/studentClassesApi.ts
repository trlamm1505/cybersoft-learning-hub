import axiosClient from '../common/configAxios';
import type { MyClass, MyEnrollment } from '../types/studentClasses';
import type { CareerCourse } from '../types/careerCourses';

/** GET /api/student/classes: lớp của học viên đang đăng nhập kèm bài được giao và trạng thái từng bài. */
export const studentClassesApi = {
  getMyClasses: async (): Promise<MyClass[]> => {
    return await axiosClient.get('/student/classes');
  },

  /** GET /api/student/career-courses: 3 khóa chuyên ngành của Người đi làm / Trái ngành kèm tiến độ, lịch sử nộp, nhận xét. */
  getCareerCourses: async (): Promise<CareerCourse[]> => {
    return await axiosClient.get('/student/career-courses');
  },

  /** GET /api/student/enrollments: lớp đã tham gia + trạng thái + dữ liệu chứng chỉ khi hoàn thành. */
  getEnrollments: async (): Promise<MyEnrollment[]> => {
    return await axiosClient.get('/student/enrollments');
  },
};

export default studentClassesApi;
