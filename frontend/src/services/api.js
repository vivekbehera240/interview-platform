import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
};

export const resumeApi = {
  upload: (file) => {
    const form = new FormData();
    form.append('file', file);
    return API.post('/resume/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  getSkills: (id) => API.get(`/resume/${id}/skills`),
  getMyResumes: () => API.get('/resume/my'),
};

export const interviewApi = {
  getRoles: () => API.get('/roles'),
  startSession: (data) => API.post('/sessions/start', data),
  submitAnswer: (sessionId, questionId, answer) =>
    API.post(`/sessions/${sessionId}/answers/${questionId}`, { answer }),
  getResults: (sessionId) => API.get(`/sessions/${sessionId}/results`),
  getDashboard: () => API.get('/dashboard/summary'),
};

export default API;
