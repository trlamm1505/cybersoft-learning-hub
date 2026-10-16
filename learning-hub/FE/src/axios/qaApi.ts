import axiosClient from '../common/configAxios';

export interface QualityGateBypassItem {
  testId: string;
  bypass: boolean;
  bypassReason?: string;
}

export const qaApi = {
  getQualityDashboard: async () => {
    return await axiosClient.get('/qa/dashboard');
  },
  runSmokeTests: async () => {
    return await axiosClient.post('/qa/run-smoke-tests');
  },
  runAiRegression: async () => {
    return await axiosClient.post('/qa/run-ai-regression');
  },
  evaluateGate: async (bypasses: QualityGateBypassItem[]) => {
    return await axiosClient.post('/qa/evaluate-gate', { bypasses });
  },
};

export default qaApi;
