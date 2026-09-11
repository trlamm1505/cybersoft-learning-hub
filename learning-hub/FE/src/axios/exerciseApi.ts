import axiosClient from '../common/configAxios';
import type {
  ExerciseListItem,
  ExerciseDetail,
  RunCodeResponse,
  SubmitCodeResponse,
  SubmitAckResponse,
  CheckSyntaxResponse,
} from '../types/exercise';

/**
 * Exercise / Code Playground API Service Layer
 * Wraps NestJS Backend Code Runner API calls using configured Axios Client
 */
export const exerciseApi = {
  /**
   * GET /api/exercises
   */
  listExercises: async (): Promise<ExerciseListItem[]> => {
    return await axiosClient.get('/exercises');
  },

  /**
   * GET /api/exercises/:slug
   */
  getExercise: async (slug: string): Promise<ExerciseDetail> => {
    return await axiosClient.get(`/exercises/${slug}`);
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
   */
  submitCode: async (slug: string, code: string): Promise<SubmitAckResponse> => {
    return await axiosClient.post(`/exercises/${slug}/submit`, { code });
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
