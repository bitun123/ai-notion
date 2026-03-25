import api from '../../../shared/api/api';

export const askQuestion = async (question) => {
  const response = await api.post('/ask', { question });
  return response.data;
};
