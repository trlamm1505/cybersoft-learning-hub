import axiosClient from '../common/configAxios';
import type { LeaveReport } from '../common/leaveDetector';

export type ProctorScope = 'CONTEST' | 'CLASS_ASSIGNMENT';

/** Báo máy chủ "vừa rời màn hình làm bài"; số lần do SERVER đếm và cảnh báo giảng viên. */
export const proctorApi = {
  reportLeave: async (scope: ProctorScope, refId: string): Promise<LeaveReport> => {
    return await axiosClient.post('/proctor/leave', { scope, refId });
  },
};

export default proctorApi;
