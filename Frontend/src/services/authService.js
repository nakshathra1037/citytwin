import api from './api';

export const authService = {
  async register(name, email, password, role = 'urban_planner') {
    const res = await api.post('/api/auth/register', { name, email, password, role });
    if (res.data.access_token) {
      localStorage.setItem('livingcity_token', res.data.access_token);
      localStorage.setItem('livingcity_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.data.access_token) {
      localStorage.setItem('livingcity_token', res.data.access_token);
      localStorage.setItem('livingcity_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },

  async getMe() {
    const res = await api.get('/api/auth/me');
    return res.data;
  },

  logout() {
    localStorage.removeItem('livingcity_token');
    localStorage.removeItem('livingcity_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('livingcity_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('livingcity_token'));
  }
};
