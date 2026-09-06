import api from './api';

export const chatService = {
  async sendMessage({ message, cityId, pageContext = 'dashboard', simulationContext = null, history = [] }) {
    const res = await api.post('/api/chat', {
      message,
      city_id: cityId,
      page_context: pageContext,
      simulation_context: simulationContext,
      history
    });
    return res.data;
  }
};
