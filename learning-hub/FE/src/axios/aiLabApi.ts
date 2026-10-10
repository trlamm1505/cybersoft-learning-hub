import axiosClient from '../common/configAxios';
import type {
  AiLabConfig,
  AiLabDetail,
  AiLabRun,
  AiLabSummary,
  EvaluationSetPreview,
} from '../types/aiLab';

// Chấm bài gọi Dataset Registry lấy evaluation set: cho phép lâu hơn mặc định 10s.
const GRADING_TIMEOUT_MS = 30_000;

/** AI Lab API Service Layer (Ngày 23) — wraps NestJS /ai-labs/*. */
export const aiLabApi = {
  getLabs: async (): Promise<AiLabSummary[]> => {
    return await axiosClient.get('/ai-labs');
  },

  getLab: async (slug: string): Promise<AiLabDetail> => {
    return await axiosClient.get(`/ai-labs/${slug}`);
  },

  /** Một phần evaluation set (câu hỏi, không có đáp án chuẩn) BE kéo từ Data & AI Resource. */
  getEvaluationPreview: async (slug: string): Promise<EvaluationSetPreview> => {
    return await axiosClient.get(`/ai-labs/${slug}/evaluation-set`);
  },

  submit: async (
    slug: string,
    payload: { prompt: string; model: string; config: AiLabConfig },
  ): Promise<AiLabRun> => {
    return await axiosClient.post(`/ai-labs/${slug}/submit`, payload, {
      timeout: GRADING_TIMEOUT_MS,
    });
  },

  /** Lần chạy mới nhất của học viên; null nếu chưa chạy. */
  getMySubmission: async (slug: string): Promise<AiLabRun | null> => {
    // BE trả body rỗng khi chưa nộp; interceptor đã unwrap nên nhận ''.
    const res: AiLabRun | '' | null = await axiosClient.get(`/ai-labs/${slug}/my-submission`);
    return res || null;
  },
};

export default aiLabApi;
