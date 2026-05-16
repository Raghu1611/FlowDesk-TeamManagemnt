import api from './axios';

export const getMessagesAPI = async (room) => {
  const response = await api.get(`/messages/${room}`);
  return response.data;
};

export const getRoomsAPI = async () => {
  const response = await api.get('/messages/rooms');
  return response.data;
};
