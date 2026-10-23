import axiosClient from '../common/configAxios';
import type { CareerRoster, CareerStudentDetail, ClassFinalGrades, KidProgressRow, TesterRoster, TesterStudentDetail, TesterSubmissionDetail } from '../types/assessment';
import type { ReviewQueueItem } from '../types/testerLab';

/** Tầng nghiệp vụ đánh giá (BE modules-api/assessment): chỉ giảng viên phụ trách lớp (hoặc Admin) gọi được, BE trả 403 với lớp khác. */
export const assessmentApi = {
  /** GET /teacher/classes/:classId/final-grades: điểm tổng kết 30/40/30 của mọi học viên trong lớp. */
  getClassFinalGrades: async (classId: string): Promise<ClassFinalGrades> => {
    return await axiosClient.get(`/teacher/classes/${encodeURIComponent(classId)}/final-grades`);
  },

  /** GET /teacher/classes/:classId/kid-progress: tiến độ ải khối 3-5, bé bị kẹt (STUCK_ALERT) đứng đầu. */
  getKidProgress: async (classId: string): Promise<KidProgressRow[]> => {
    return await axiosClient.get(`/teacher/classes/${encodeURIComponent(classId)}/kid-progress`);
  },

  /** Lớp Tester QA: bảng xếp hạng & tiến độ (đọc từ chính bài nộp Tester Lab của học viên). */
  getTesterRoster: async (classId: string): Promise<TesterRoster> => {
    return await axiosClient.get(`/teacher/classes/${encodeURIComponent(classId)}/tester/roster`);
  },

  /** Hồ sơ bài làm của một học viên: từng Lab, điểm từng tiêu chí rubric, nhận xét. */
  getTesterStudent: async (classId: string, studentId: string): Promise<TesterStudentDetail> => {
    return await axiosClient.get(`/teacher/classes/${encodeURIComponent(classId)}/tester/students/${encodeURIComponent(studentId)}`);
  },

  /** Giảng viên ĐỌC một bài nộp (test case, bug report, điểm, nhận xét); endpoint riêng cho TEACHER, không phải endpoint nộp bài. */
  getTesterSubmission: async (submissionId: string): Promise<TesterSubmissionDetail> => {
    return await axiosClient.get(`/teacher/tester-labs/submissions/${encodeURIComponent(submissionId)}`);
  },

  /** Lớp Data SQL / AI Prompt: danh sách học viên + tiến độ (chỉ theo dõi). */
  getCareerRoster: async (classId: string): Promise<CareerRoster> => {
    return await axiosClient.get(`/teacher/classes/${encodeURIComponent(classId)}/career/roster`);
  },

  /** Chi tiết bài làm: câu SQL / prompt đã nộp, điểm từng Lab. */
  getCareerStudent: async (classId: string, studentId: string): Promise<CareerStudentDetail> => {
    return await axiosClient.get(`/teacher/classes/${encodeURIComponent(classId)}/career/students/${encodeURIComponent(studentId)}`);
  },

  /** Hàng chờ chấm của riêng lớp Tester QA. */
  getTesterQueue: async (classId: string): Promise<ReviewQueueItem[]> => {
    return await axiosClient.get(`/teacher/classes/${encodeURIComponent(classId)}/tester/queue`);
  },
};

export default assessmentApi;
