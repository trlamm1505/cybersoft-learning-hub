import axiosClient from '../common/configAxios';

export const resilienceApi = {
  getDashboard: async (): Promise<any> => {
    return await axiosClient.get('/resilience/dashboard');
  },
  runLoadTest: async (concurrentRequests: number = 100): Promise<any> => {
    return await axiosClient.post('/resilience/run-load-test', { concurrentRequests });
  },
  testWorkerRestart: async (): Promise<any> => {
    return await axiosClient.post('/resilience/test-worker-restart');
  },
  getLimits: async (): Promise<any> => {
    return await axiosClient.get('/resilience/limits');
  },
};

export default resilienceApi;
