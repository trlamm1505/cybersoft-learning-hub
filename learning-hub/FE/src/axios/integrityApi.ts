import axiosClient from '../common/configAxios';
import type { IntegrityDecision, IntegrityDetail, IntegrityQueueRow, ProctorAlertRow } from '../types/integrity';

/** API hàng chờ xem xét tính trung thực: chỉ giảng viên/quản trị viên (BE trả 403 cho học viên). */
export const integrityApi = {
  getQueue: async (status?: 'REVIEWED' | 'NORMAL'): Promise<IntegrityQueueRow[]> => {
    return await axiosClient.get('/teacher/integrity/queue', { params: status ? { status } : {} });
  },

  /** Cảnh báo học viên rời màn hình làm bài (bài lớp > 2 lần, cuộc thi từ lần 1). */
  getAlerts: async (status?: 'ACKNOWLEDGED'): Promise<ProctorAlertRow[]> => {
    return await axiosClient.get('/teacher/integrity/alerts', { params: status ? { status } : {} });
  },

  ackAlert: async (id: string) => {
    return await axiosClient.put(`/teacher/integrity/alerts/${id}/ack`);
  },

  getDetail: async (id: string): Promise<IntegrityDetail> => {
    return await axiosClient.get(`/teacher/integrity/${id}`);
  },

  review: async (id: string, decision: IntegrityDecision, note: string) => {
    return await axiosClient.put(`/teacher/integrity/${id}/review`, { decision, note });
  },
};

export default integrityApi;
