import axiosClient from '../common/configAxios';
import type {
  ExerciseListItem,
  ExerciseDetail,
  ExerciseFullDetail,
  ExerciseTestCase,
  RunCodeResponse,
  SubmitCodeResponse,
  SubmitAckResponse,
  CheckSyntaxResponse,
} from '../types/exercise';
import type { IntegrityClientPayload } from '../types/integrity';

/** Payload tạo/sửa bài (POST/PATCH /exercises); authorId do server gán từ token. */
export interface ExerciseWritePayload {
  title?: string;
  slug?: string;
  description?: string;
  type?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  points?: number;
  starterCode?: string;
  timeLimitMs?: number;
  memoryLimitMb?: number;
  testCases?: ExerciseTestCase[];
  hiddenTestCases?: ExerciseTestCase[];
  officialSolution?: string;
  targetGroup?: string;
  labType?: string;
  storyContext?: string;
  illustrationUrl?: string;
  datasetId?: string;
}

/** Bỏ test ẩn (isHidden) và các trường đáp án khỏi dữ liệu dành cho học viên. */
export function stripSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => !(item && typeof item === 'object' && (item as { isHidden?: boolean }).isHidden === true))
      .map(stripSecrets) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === 'hiddenTestCases' || k === 'officialSolution' || k === 'solutionCode') continue;
      out[k] = stripSecrets(v);
    }
    return out as T;
  }
  return value;
}

/**
 * Exercise / Code Playground API Service Layer
 * Wraps NestJS Backend Code Runner API calls using configured Axios Client
 */
export const exerciseApi = {
  /**
   * GET /api/exercises
   */
  listExercises: async (): Promise<ExerciseListItem[]> => {
    return stripSecrets(await axiosClient.get('/exercises')) as ExerciseListItem[];
  },

  /** POST /api/exercises/legacy/assign-grade — chỉ ADMIN: gán 6-9/K6_9/PYTHON_CODE cho bài Python cũ chưa phân nhóm. */
  assignLegacyGrade: async (dryRun = false): Promise<{ dryRun: boolean; matched: number; slugs: string[] }> => {
    return await axiosClient.post('/exercises/legacy/assign-grade', { dryRun });
  },

  /** POST /api/exercises — chỉ TEACHER/ADMIN. */
  createExercise: async (payload: ExerciseWritePayload): Promise<ExerciseFullDetail> => {
    return await axiosClient.post('/exercises', payload);
  },

  /** PATCH /api/exercises/:id — cập nhật một phần; BE merge với bài hiện tại rồi kiểm tra lại ma trận. */
  updateExercise: async (id: string, payload: ExerciseWritePayload): Promise<ExerciseFullDetail> => {
    return await axiosClient.patch(`/exercises/${id}`, payload);
  },

  /** DELETE /api/exercises/:id — giảng viên chỉ xóa bài của mình. */
  deleteExercise: async (id: string): Promise<{ deleted: boolean; slug: string }> => {
    return await axiosClient.delete(`/exercises/${id}`);
  },

  /**
   * GET /api/exercises/:slug
   */
  getExercise: async (slug: string): Promise<ExerciseDetail> => {
    // Lớp phòng thủ phía client: dù BE lỡ trả dư, UI học viên không bao giờ thấy test ẩn/đáp án.
    return stripSecrets(await axiosClient.get(`/exercises/${slug}`)) as ExerciseDetail;
  },

  /**
   * GET /api/exercises/:slug/full — CHỈ giáo viên, có solutionCode thật và
   * testCases không bị lọc hidden. Dùng để import 1 bài đã có sẵn trong
   * ngân hàng đề vào form soạn thảo bài thi.
   */
  getExerciseFull: async (slug: string): Promise<ExerciseFullDetail> => {
    return await axiosClient.get(`/exercises/${slug}/full`);
  },

  /**
   * POST /api/exercises/:slug/run — ad-hoc run with custom stdin, no grading
   */
  runCode: async (slug: string, code: string, stdin: string): Promise<RunCodeResponse> => {
    return await axiosClient.post(`/exercises/${slug}/run`, { code, stdin });
  },

  /**
   * POST /api/exercises/:slug/submit — enqueues code for grading, returns immediately.
   * Poll getSubmission() with the returned submissionId until a terminal status.
   * Bắt buộc đăng nhập (JwtAuthGuard) — userId lấy từ token, không gửi từ client.
   */
  submitCode: async (
    slug: string,
    code: string,
    integrity?: IntegrityClientPayload | null,
  ): Promise<SubmitAckResponse> => {
    return await axiosClient.post(`/exercises/${slug}/submit`, integrity ? { code, integrity } : { code });
  },

  /**
   * GET /api/exercises/submissions/:id — poll for judge result (AC/WA/TLE/RE/CE/FAILED).
   */
  getSubmission: async (id: string): Promise<SubmitCodeResponse> => {
    return await axiosClient.get(`/exercises/submissions/${id}`);
  },

  /**
   * POST /api/exercises/check-syntax — standalone Compile Error (CE) detection.
   */
  checkSyntax: async (code: string): Promise<CheckSyntaxResponse> => {
    return await axiosClient.post('/exercises/check-syntax', { code });
  },
};

export default exerciseApi;
