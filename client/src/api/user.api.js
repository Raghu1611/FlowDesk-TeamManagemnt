import api from './axios';

export const getUsersAPI = async () => {
  const response = await api.get('/users');
  return response.data;
};

export const updateUserRoleAPI = async (id, role) => {
  const response = await api.patch(`/users/${id}/role`, { role });
  return response.data;
};

export const updateProfileAPI = async (data) => {
  const response = await api.patch('/users/profile', data);
  return response.data;
};

export const uploadAvatarAPI = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const changePasswordAPI = async (data) => {
  const response = await api.patch('/users/password', data);
  return response.data;
};
