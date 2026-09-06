import api from './api';

export const predictionService = {
  async getFloodPrediction(cityId) {
    const res = await api.get(`/api/prediction/flood/${cityId}`);
    return res.data;
  },

  async getTrafficPrediction(cityId) {
    const res = await api.get(`/api/prediction/traffic/${cityId}`);
    return res.data;
  }
};
