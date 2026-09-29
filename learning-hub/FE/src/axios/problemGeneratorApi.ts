import axiosClient from '../common/configAxios';
import type {
  GenerateProblemPayload,
  GenerateProblemResponse,
  RevalidateProblemPayload,
  SaveProblemPayload,
  SaveProblemResponse,
  ValidationResult,
} from '../types/problemGenerator';

/**
 * Problem Generator API Service Layer (Ngày 19)
 * Wraps NestJS Backend problem-generator API using configured Axios Client.
 */
export const problemGeneratorApi = {
  /**
   * POST /api/problem-generator/generate
   * Gemini free tier (model nhẹ) có thể mất 10-30s/bài, sinh tuần tự ở
   * backend — timeout riêng dài hơn mặc định 10s, nhân theo số bài trong
   * payload để không huỷ ngang khi sinh nhiều bài cùng lúc.
   */
  generate: async (
    payload: GenerateProblemPayload,
  ): Promise<GenerateProblemResponse> => {
    const timeout = Math.max(60000, payload.specs.length * 35000);
    return await axiosClient.post('/problem-generator/generate', payload, {
      timeout,
    });
  },

  /**
   * POST /api/problem-generator/save
   * Lưu một draft đã được giáo viên xem qua vào ngân hàng đề thật.
   * forceSave/overrideReason: human-in-the-loop cho cảnh báo trùng lặp mềm.
   */
  save: async (payload: SaveProblemPayload): Promise<SaveProblemResponse> => {
    return await axiosClient.post('/problem-generator/save', payload);
  },

  /**
   * POST /api/problem-generator/revalidate
   * "Chạy lại test" cho một draft giáo viên vừa tự sửa trực tiếp trên UI —
   * không gọi Gemini, chỉ chạy lại syntax/test/duplicate check.
   */
  revalidate: async (
    payload: RevalidateProblemPayload,
  ): Promise<ValidationResult> => {
    return await axiosClient.post('/problem-generator/revalidate', payload, {
      timeout: 15000,
    });
  },
};

export default problemGeneratorApi;
