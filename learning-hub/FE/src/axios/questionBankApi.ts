import axiosClient from '../common/configAxios';
import type { Paged } from '../types/classDays';
import type { QuestionBankDetail, QuestionBankQuery, QuestionBankRow, QuestionBankUpdate, QuizBankDetail, QuizBankRow, QuizQuestionPayload } from '../types/questionBank';

const enc = (s: string) => encodeURIComponent(s);

/** Quản lý Ngân hàng đề (chỉ giảng viên phụ trách lớp K6-9 / K10-12). */
export const questionBankApi = {
  list: async (q: QuestionBankQuery): Promise<Paged<QuestionBankRow>> =>
    await axiosClient.get('/teacher/question-bank', { params: { q: q.q || undefined, band: q.band || undefined, difficulty: q.difficulty || undefined, page: q.page ?? 1, pageSize: 10 } }),
  detail: async (slug: string): Promise<QuestionBankDetail> => await axiosClient.get(`/teacher/question-bank/${enc(slug)}`),
  update: async (slug: string, body: QuestionBankUpdate): Promise<QuestionBankDetail> => await axiosClient.patch(`/teacher/question-bank/${enc(slug)}`, body),
  remove: async (slug: string): Promise<{ deleted: boolean; slug: string }> => await axiosClient.delete(`/teacher/question-bank/${enc(slug)}`),

  // ---- Câu hỏi trắc nghiệm (Day 30): chỉ dùng cho bài giao của lớp và đề cuộc thi ----
  listQuiz: async (q: QuestionBankQuery): Promise<Paged<QuizBankRow>> =>
    await axiosClient.get('/teacher/question-bank/questions', { params: { q: q.q || undefined, band: q.band || undefined, difficulty: q.difficulty || undefined, page: q.page ?? 1, pageSize: 10 } }),
  quizDetail: async (id: string): Promise<QuizBankDetail> => await axiosClient.get(`/teacher/question-bank/questions/${enc(id)}`),
  createQuiz: async (body: QuizQuestionPayload): Promise<QuizBankDetail> => await axiosClient.post('/teacher/question-bank/questions', body),
  updateQuiz: async (id: string, body: Partial<QuizQuestionPayload>): Promise<QuizBankDetail> => await axiosClient.patch(`/teacher/question-bank/questions/${enc(id)}`, body),
  removeQuiz: async (id: string): Promise<{ deleted: boolean; id: string }> => await axiosClient.delete(`/teacher/question-bank/questions/${enc(id)}`),
};

export default questionBankApi;
