import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getErrorMessage = (err, fallback = 'An error occurred') => {
  if (!err) return fallback;
  if (err.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map(item => item.msg || JSON.stringify(item)).join(', ');
    }
    if (typeof detail === 'object') return detail.msg || JSON.stringify(detail);
  }
  if (err.response?.data?.message) return err.response.data.message;
  if (err.message === 'Network Error' || !err.response) {
    return 'Unable to connect to the backend server. Please ensure the API is running at http://localhost:8000.';
  }
  return err.message || fallback;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': undefined,
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

// ── Known Emails Registry ─────────────────────────────────────────────────

export const addKnownEmails = async (emails) => {
  // emails: array of { email, label? }
  const response = await api.post('/known-emails/add', { emails });
  return response.data;
};

export const getKnownEmails = async (page = 1, limit = 50, search = '') => {
  const params = { page, limit };
  if (search) params.search = search;
  const response = await api.get('/known-emails', { params });
  return response.data;
};

export const getKnownEmailStats = async () => {
  const response = await api.get('/known-emails/stats');
  return response.data;
};

export const deleteKnownEmail = async (emailId) => {
  const response = await api.delete(`/known-emails/${emailId}`);
  return response.data;
};

export const clearKnownEmails = async () => {
  const response = await api.delete('/known-emails');
  return response.data;
};

export default api;
