import api from './api';

export const analyticsService = {
  async getAnalytics(cityId, limit = 50) {
    const res = await api.get(`/api/analytics/${cityId}?limit=${limit}`);
    return res.data;
  }
};
