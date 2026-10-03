import axiosClient from '../common/configAxios';

interface StudentRef {
  id: string;
  fullName?: string;
  email?: string;
}

export interface DaLabSubmissionRow {
  id: string;
  type: 'SQL' | 'INSIGHT';
  status: 'GRADED' | 'PENDING_REVIEW';
  score: number;
  bestScore: number;
  maxScore: number;
  attemptCount: number;
  content: string;
  aiExplanation?: string;
  teacherComment?: string;
  updatedAt: string;
  student: StudentRef;
  exercise: { id: string; slug: string; title?: string };
}

export interface AiLabSubmissionRow {
  id: string;
  exerciseSlug: string;
  status: 'PASSED' | 'FAILED';
  score: number;
  maxScore: number;
  qualityScore: number;
  cost: number;
  latency: number;
  model: string;
  prompt: string;
  totalAttempts: number;
  bestQualityScore: number;
  best: { score: number; qualityScore: number; status: 'PASSED' | 'FAILED' } | null;
  updatedAt: string;
  student: StudentRef;
}

/** API cho giảng viên/quản trị viên xem bài nộp DA Lab và AI Lab (Ngày 23). */
export const teacherLabSubmissionsApi = {
  getDaSubmissions: async (type: 'SQL' | 'INSIGHT'): Promise<DaLabSubmissionRow[]> => {
    return await axiosClient.get('/teacher/submissions/da', { params: { type } });
  },

  getAiSubmissions: async (): Promise<AiLabSubmissionRow[]> => {
    return await axiosClient.get('/teacher/ai-lab-submissions');
  },
};

export default teacherLabSubmissionsApi;
