import api from '../../../shared/api/api';

export const getGraphData = async () => {
  const response = await api.get('/graph');
  return response.data;
};
