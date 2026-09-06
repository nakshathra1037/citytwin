import api from './api';

export const cityService = {
  async getCities() {
    const res = await api.get('/api/cities');
    return res.data;
  },

  async getCity(cityId) {
    const res = await api.get(`/api/cities/${cityId}`);
    return res.data;
  }
};
