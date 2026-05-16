import api from './axios';

export const loginAPI = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerAPI = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const getMeAPI = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
