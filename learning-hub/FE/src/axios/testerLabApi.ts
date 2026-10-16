import axiosClient from '../common/configAxios';
import type {
  ReviewableSubmission,
  RubricGrade,
  TesterLab,
  TesterLabSubmission,
} from '../types/testerLab';

async function saveBlob(path: string, fileName: string): Promise<void> {
  const blob: Blob = await axiosClient.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** Tester Lab API Service Layer (Ngày 21) — wraps NestJS /tester-labs/*. */
export const testerLabApi = {
  getLabs: async (): Promise<TesterLab[]> => {
    return await axiosClient.get('/tester-labs');
  },

  getLab: async (labCode: string): Promise<TesterLab> => {
    return await axiosClient.get(`/tester-labs/${labCode}`);
  },

  getMySubmissions: async (labCode: string): Promise<TesterLabSubmission[]> => {
    return await axiosClient.get(`/tester-labs/${labCode}/submissions/mine`);
  },

  submitArtifact: async (labCode: string, file: File): Promise<TesterLabSubmission> => {
    const form = new FormData();
    form.append('file', file);
    return await axiosClient.post(`/tester-labs/${labCode}/submissions`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Bài của người khác cần chấm (giảng viên hoặc peer). */
  getReviewable: async (labCode: string): Promise<ReviewableSubmission[]> => {
    return await axiosClient.get(`/tester-labs/${labCode}/submissions`);
  },

  review: async (
    submissionId: string,
    grades: RubricGrade[],
    reviewerNotes: string,
  ): Promise<void> => {
    await axiosClient.put(`/tester-labs/submissions/${submissionId}/review`, {
      grades,
      reviewerNotes,
    });
  },

  /** Tải tài liệu qua axios (cần Bearer token) rồi kích hoạt lưu file. */
  downloadAsset: (labCode: string, name: string) =>
    saveBlob(`/tester-labs/${labCode}/files/${name}`, name),

  downloadArtifact: (submissionId: string, fileType: string) =>
    saveBlob(`/tester-labs/submissions/${submissionId}/artifact`, `bai-nop.${fileType}`),
};

export default testerLabApi;
