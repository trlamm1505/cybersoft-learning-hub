import axiosClient from '../common/configAxios';
import type { ClassLeaderboard, ClassOverview, MyAssignment } from '../types/classAssignments';

/** Bài giao cho lớp (điểm, hạn chót, xếp hạng): danh tính luôn lấy từ token, chỉ thành viên lớp xem được. */
export const classAssignmentsApi = {
  /** GET /api/student/classes/:classId/overview */
  getOverview: async (classId: string): Promise<ClassOverview> => {
    return await axiosClient.get(`/student/classes/${encodeURIComponent(classId)}/overview`);
  },

  /** GET /api/student/classes/:classId/leaderboard */
  getLeaderboard: async (classId: string): Promise<ClassLeaderboard> => {
    return await axiosClient.get(`/student/classes/${encodeURIComponent(classId)}/leaderboard`);
  },

  /** GET /api/student/assignments/:id — một bài của lớp (cho banner khi làm bài). */
  getAssignment: async (assignmentId: string): Promise<MyAssignment> => {
    return await axiosClient.get(`/student/assignments/${encodeURIComponent(assignmentId)}`);
  },
};

export default classAssignmentsApi;
