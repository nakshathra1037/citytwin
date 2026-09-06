import api from './api';

export const telemetryService = {
  async getCityTelemetry(cityId) {
    const res = await api.get(`/api/city/${cityId}/telemetry`);
    return res.data;
  },

  async getWeather(cityId) {
    const res = await api.get(`/api/weather/${cityId}`);
    return res.data;
  },

  async getTraffic(cityId) {
    const res = await api.get(`/api/traffic/${cityId}`);
    return res.data;
  },

  async getAQI(cityId) {
    const res = await api.get(`/api/air-quality/${cityId}`);
    return res.data;
  }
};
