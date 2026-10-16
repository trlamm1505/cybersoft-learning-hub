import axiosClient from '../common/configAxios';
import type { IntegrityDecision, IntegrityDetail, IntegrityQueueRow, ProctorAlertRow } from '../types/integrity';

/** API hàng chờ xem xét tính trung thực: chỉ giảng viên/quản trị viên (BE trả 403 cho học viên). */
export const integrityApi = {
  getQueue: async (status?: 'REVIEWED' | 'NORMAL'): Promise<IntegrityQueueRow[]> => {
    return await axiosClient.get('/teacher/integrity/queue', { params: status ? { status } : {} });
  },

  /** Cảnh báo học viên rời màn hình làm bài (bài lớp > 2 lần, cuộc thi từ lần 1). */
  /** @param classId chỉ lấy cảnh báo của bài tập được giao trong lớp đó (không có cảnh báo cuộc thi). */
  getAlerts: async (status?: 'ACKNOWLEDGED', classId?: string): Promise<ProctorAlertRow[]> => {
    return await axiosClient.get('/teacher/integrity/alerts', { params: { ...(status ? { status } : {}), ...(classId ? { classId } : {}) } });
  },

  /** Hủy kết quả bài làm của ca vi phạm; lý do tối thiểu 10 ký tự (BE trả 400 nếu thiếu). */
  invalidateAlert: async (id: string, reason: string) => {
    return await axiosClient.put(`/teacher/integrity/alerts/${id}/invalidate`, { reason });
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
