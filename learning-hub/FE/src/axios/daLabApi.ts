import axiosClient from '../common/configAxios';
import type {
  DaLab,
  DatasetInfo,
  InsightGradeResult,
  MyDaSubmission,
  PendingInsightSubmission,
  SqlGradeResult,
  SqlRunResult,
  TeacherReviewResult,
} from '../types/daLab';

// Chấm bài chạy hai câu SQL trên sandbox và có thể gọi LLM: cho phép lâu hơn mặc định 10s.
const GRADING_TIMEOUT_MS = 45_000;

/** DA Lab API Service Layer (Ngày 22) — wraps NestJS /da-labs/*. */
export const daLabApi = {
  getLabs: async (): Promise<DaLab[]> => {
    return await axiosClient.get('/da-labs');
  },

  getLab: async (slug: string): Promise<DaLab> => {
    return await axiosClient.get(`/da-labs/${slug}`);
  },

  /** Schema / data dictionary của dataset mà bài dùng, BE lấy từ Dataset Registry. */
  getLabDataset: async (slug: string): Promise<DatasetInfo> => {
    return await axiosClient.get(`/da-labs/${slug}/dataset`);
  },

  runSql: async (slug: string, sql: string): Promise<SqlRunResult> => {
    return await axiosClient.post(`/da-labs/${slug}/run`, { sql });
  },

  submitSql: async (slug: string, sql: string): Promise<SqlGradeResult> => {
    return await axiosClient.post(
      `/da-labs/${slug}/submit`,
      { sql },
      { timeout: GRADING_TIMEOUT_MS },
    );
  },

  submitInsight: async (slug: string, answer: string): Promise<InsightGradeResult> => {
    return await axiosClient.post(
      `/da-labs/${slug}/insight`,
      { answer },
      { timeout: GRADING_TIMEOUT_MS },
    );
  },

  /** Bài nộp Insight mới nhất của học viên đang đăng nhập; null nếu chưa nộp. */
  getMySubmission: async (exerciseId: string): Promise<MyDaSubmission | null> => {
    // BE trả body rỗng khi chưa nộp; interceptor đã unwrap nên nhận ''.
    const res: MyDaSubmission | '' | null = await axiosClient.get(
      `/da-labs/exercises/${exerciseId}/my-submission`,
    );
    return res || null;
  },

  /** Giảng viên: hàng chờ chấm tay bài Insight. */
  getPendingReviews: async (): Promise<PendingInsightSubmission[]> => {
    return await axiosClient.get('/teacher/submissions/pending');
  },

  reviewSubmission: async (
    id: string,
    score: number,
    teacherComment: string,
  ): Promise<TeacherReviewResult> => {
    return await axiosClient.put(`/teacher/submissions/${id}/review`, { score, teacherComment });
  },
};

export default daLabApi;
