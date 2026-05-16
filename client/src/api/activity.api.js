import api from './axios';

export const getActivityLogsAPI = async (params = {}) => {
  const response = await api.get('/activity', { params });
  return response.data;
};
