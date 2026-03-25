import api from '../../../shared/api/api';

export const getLinks = async () => {
  const response = await api.get('/links');
  return response.data;
};

export const saveLink = async (url, title) => {
  const response = await api.post('/links', { url, title });
  return response.data;
};

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  const response = await api.post('/links/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteLink = async (id) => {
  const response = await api.delete(`/links/${id}`);
  return response.data;
};

export const searchLinks = async (query) => {
  const response = await api.post('/search', { query });
  return response.data.results;
};

export const getResurfacedItems = async () => {
  const response = await api.get('/resurface');
  return response.data;
};

export const getCollections = async () => {
  const response = await api.get('/collections');
  return response.data;
};

export const createCollection = async (name) => {
  const response = await api.post('/collections', { name });
  return response.data;
};

export const addToCollection = async (collectionId, linkId) => {
  const response = await api.post(`/collections/${collectionId}/add`, { linkId });
  return response.data;
};

export const getCollectionLinks = async (collectionId) => {
  const response = await api.get(`/collections/${collectionId}/links`);
  return response.data;
};

export const getHighlights = async (itemId) => {
  const response = await api.get(`/links/${itemId}/highlights`);
  return response.data;
};

export const createHighlight = async (itemId, highlightedText, note) => {
  const response = await api.post('/highlights', { itemId, highlightedText, note });
  return response.data;
};

export const deleteHighlight = async (id) => {
  const response = await api.delete(`/highlights/${id}`);
  return response.data;
};

export const rebuildClusters = async () => {
  const response = await api.post('/clusters/rebuild');
  return response.data;
};

export const getClusteredLinks = async () => {
  const response = await api.get('/links/clustered');
  return response.data;
};

export const getRelatedItems = async (itemId) => {
  const response = await api.get(`/links/${itemId}/related`);
  return response.data;
};
