import axios from 'axios';

const api = axios.create({
  baseURL: '', // Uses Vite proxy to http://127.0.0.1:8000
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('livingcity_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and not on login page, clear token
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('livingcity_token');
        localStorage.removeItem('livingcity_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
