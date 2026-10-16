import axiosClient from '../common/configAxios';
import type { Paged } from '../types/classDays';
import type { QuestionBankDetail, QuestionBankQuery, QuestionBankRow, QuestionBankUpdate } from '../types/questionBank';

const enc = (s: string) => encodeURIComponent(s);

/** Quản lý Ngân hàng đề (chỉ giảng viên phụ trách lớp K6-9 / K10-12). */
export const questionBankApi = {
  list: async (q: QuestionBankQuery): Promise<Paged<QuestionBankRow>> =>
    await axiosClient.get('/teacher/question-bank', { params: { q: q.q || undefined, band: q.band || undefined, difficulty: q.difficulty || undefined, page: q.page ?? 1, pageSize: 10 } }),
  detail: async (slug: string): Promise<QuestionBankDetail> => await axiosClient.get(`/teacher/question-bank/${enc(slug)}`),
  update: async (slug: string, body: QuestionBankUpdate): Promise<QuestionBankDetail> => await axiosClient.patch(`/teacher/question-bank/${enc(slug)}`, body),
  remove: async (slug: string): Promise<{ deleted: boolean; slug: string }> => await axiosClient.delete(`/teacher/question-bank/${enc(slug)}`),
};

export default questionBankApi;
