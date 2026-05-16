import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export const resolveFileUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${SERVER_URL}${url}`;
};

export const resolveDownloadUrl = (url) => {
  if (!url) return '';
  const filename = url.split('/').pop();
  return `${SERVER_URL}/download/${filename}`;
};
