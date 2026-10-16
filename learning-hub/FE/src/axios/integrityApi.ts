import axiosClient from '../common/configAxios';
import type { IntegrityDecision, IntegrityDetail, IntegrityQueueRow } from '../types/integrity';

/** API hàng chờ xem xét tính trung thực: chỉ giảng viên/quản trị viên (BE trả 403 cho học viên). */
export const integrityApi = {
  getQueue: async (status?: 'REVIEWED' | 'NORMAL'): Promise<IntegrityQueueRow[]> => {
    return await axiosClient.get('/teacher/integrity/queue', { params: status ? { status } : {} });
  },

  getDetail: async (id: string): Promise<IntegrityDetail> => {
    return await axiosClient.get(`/teacher/integrity/${id}`);
  },

  review: async (id: string, decision: IntegrityDecision, note: string) => {
    return await axiosClient.put(`/teacher/integrity/${id}/review`, { decision, note });
  },
};

export default integrityApi;
