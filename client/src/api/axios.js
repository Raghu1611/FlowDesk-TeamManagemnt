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
  if (url.startsWith('http') && url.includes('res.cloudinary.com')) {
    // For Cloudinary: fix resource_type and add fl_attachment to force download
    let fixed = url;
    if (url.match(/\.(pdf|doc|docx|xls|xlsx|zip|rar|txt|csv)$/i)) {
      fixed = fixed.replace('/image/upload/', '/raw/upload/');
    }
    // Insert fl_attachment after /upload/ to force browser download
    return fixed.replace('/upload/', '/upload/fl_attachment/');
  }
  if (url.startsWith('http')) return url;
  const filename = url.split('/').pop();
  return `${SERVER_URL}/download/${filename}`;
};
