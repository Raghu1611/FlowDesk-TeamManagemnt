import api from './axios';

export const getMessagesAPI = async (room) => {
  const response = await api.get(`/messages/${room}`);
  return response.data;
};

export const getRoomsAPI = async () => {
  const response = await api.get('/messages/rooms');
  return response.data;
};

export const getChatUsersAPI = async () => {
  const response = await api.get('/messages/users');
  return response.data;
};

export const editMessageAPI = async (id, content) => {
  const response = await api.patch(`/messages/${id}/edit`, { content });
  return response.data;
};

export const deleteForMeAPI = async (id) => {
  const response = await api.patch(`/messages/${id}/delete-for-me`);
  return response.data;
};

export const deleteForEveryoneAPI = async (id) => {
  const response = await api.delete(`/messages/${id}/delete-for-everyone`);
  return response.data;
};

export const toggleReactionAPI = async (id, emoji) => {
  const response = await api.post(`/messages/${id}/react`, { emoji });
  return response.data;
};
