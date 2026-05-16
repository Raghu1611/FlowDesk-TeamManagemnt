import api from './axios';

export const getDashboardStatsAPI = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data;
};
