import axiosClient from '../common/configAxios';
import type {
  ExerciseListItem,
  ExerciseDetail,
  RunCodeResponse,
  SubmitCodeResponse,
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
   * POST /api/exercises/:slug/submit — grades code against all sample tests
   */
  submitCode: async (slug: string, code: string): Promise<SubmitCodeResponse> => {
    return await axiosClient.post(`/exercises/${slug}/submit`, { code });
  },
};

export default exerciseApi;
