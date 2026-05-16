import api from './axios';

export const getProjectsAPI = async () => {
  const response = await api.get('/projects');
  return response.data;
};

export const getProjectAPI = async (id) => {
  const response = await api.get(`/projects/${id}`);
  return response.data;
};

export const createProjectAPI = async (data) => {
  const response = await api.post('/projects', data);
  return response.data;
};

export const updateProjectAPI = async (id, data) => {
  const response = await api.patch(`/projects/${id}`, data);
  return response.data;
};

export const deleteProjectAPI = async (id) => {
  const response = await api.delete(`/projects/${id}`);
  return response.data;
};
