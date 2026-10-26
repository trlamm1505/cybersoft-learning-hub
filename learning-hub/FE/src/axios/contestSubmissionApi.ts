import axiosClient from '../common/configAxios';
import type { IntegrityClientPayload } from '../types/integrity';

export interface ContestProblemOption {
  key: string;
  text: string;
}

export interface ContestQuizQuestionForStudent {
  content: string;
  codeSnippet?: string;
  points?: number;
  options: ContestProblemOption[];
}

export interface ContestTestCaseForStudent {
  input?: string;
  expectedOutput?: string;
  isHidden?: boolean;
}

export interface ContestProblemForStudent {
  slug: string;
  title: string;
  type: 'coding' | 'quiz';
  maxPoints: number;
  content?: string;
  starterCode?: string;
  testCasesCount?: number;
  testCases?: ContestTestCaseForStudent[];
  quizQuestions?: ContestQuizQuestionForStudent[];
}

export interface SubmitContestProblemResult {
  /** SUBMITTED: quiz trong lúc thi, đã lưu nhưng chưa công bố đúng/sai. */
  verdict: 'AC' | 'WA' | 'PARTIAL' | 'CE' | 'TLE' | 'RE' | 'SUBMITTED';
  score: number | null;
  maxPoints: number;
  passedCount: number | null;
  totalCount: number;
  isLate: boolean;
  resultHidden: boolean;
}

/**
 * Contest submission API — coding/quiz problems are graded server-side (never trust the
 * client's own scoring) so results are auditable from the ContestSubmission log.
 */
export const contestSubmissionApi = {
  /** GET /api/contests/:id/problems/:slug — sanitized problem content (no correct answers / hidden tests). */
  getProblem: async (contestId: string, slug: string): Promise<ContestProblemForStudent> => {
    return await axiosClient.get(`/contests/${contestId}/problems/${slug}`);
  },

  /** POST /api/contests/:id/submissions — server grades and logs the attempt; studentId comes from the JWT, never the client. */
  submit: async (
    contestId: string,
    payload: {
      problemSlug: string;
      code?: string;
      quizAnswers?: Record<string, string>;
      /** Tín hiệu liêm chính tích lũy từ lúc vào thi (chỉ khi cuộc thi bật giám sát). */
      integrity?: IntegrityClientPayload | null;
    },
  ): Promise<SubmitContestProblemResult> => {
    return await axiosClient.post(`/contests/${contestId}/submissions`, payload);
  },
};

export default contestSubmissionApi;
