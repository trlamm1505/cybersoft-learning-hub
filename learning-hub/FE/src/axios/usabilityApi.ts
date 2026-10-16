import axiosClient from '../common/configAxios';

export type AgeGroup = 'KIDS_8_12' | 'TEENS_13_17' | 'ADULTS_18_PLUS';

export interface SubmitUsabilitySessionPayload {
  ageGroup: AgeGroup;
  scenarioId: string;
  completionTimeSeconds: number;
  errorCount: number;
  confusionMarkersCount: number;
  satisfactionRating: number;
  feedbackText?: string;
  parentalConsentVerified?: boolean;
}

export const usabilityApi = {
  getReport: async (): Promise<any> => {
    return await axiosClient.get('/usability/report');
  },
  submitSession: async (payload: SubmitUsabilitySessionPayload): Promise<any> => {
    return await axiosClient.post('/usability/session', payload);
  },
  getTopFixes: async (): Promise<any> => {
    return await axiosClient.get('/usability/top-fixes');
  },
};

export default usabilityApi;
