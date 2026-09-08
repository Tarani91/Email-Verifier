import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const startVerification = async (jobId) => {
  const response = await api.post(`/verify/${jobId}`);
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/job/${jobId}`);
  return response.data;
};

export const getJobStatistics = async (jobId) => {
  const response = await api.get(`/statistics/${jobId}`);
  return response.data;
};

export const getJobResults = async (jobId, page = 1, limit = 50, status = '', search = '') => {
  const params = { page, limit };
  if (status) params.status = status;
  if (search) params.search = search;
  const response = await api.get(`/results/${jobId}`, { params });
  return response.data;
};

export const getJobHistory = async (limit = 20, offset = 0) => {
  const response = await api.get('/history', { params: { limit, offset } });
  return response.data;
};

export const getDownloadUrl = (jobId, format = 'csv') => {
  return `${API_BASE_URL}/download/${format}/${jobId}`;
};

export default api;
