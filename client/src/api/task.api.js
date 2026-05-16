import api from './axios';

export const getTasksAPI = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

export const createTaskAPI = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTaskAPI = async (id, taskData) => {
  const response = await api.patch(`/tasks/${id}`, taskData);
  return response.data;
};

export const deleteTaskAPI = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const addCommentAPI = async (id, text) => {
  const response = await api.post(`/tasks/${id}/comments`, { text });
  return response.data;
};

export const addAttachmentAPI = async (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/tasks/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
