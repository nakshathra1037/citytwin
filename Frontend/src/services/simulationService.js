import api from './api';

export const simulationService = {
  async runSimulation(payload) {
    const res = await api.post('/api/simulation', payload);
    return res.data;
  }
};
