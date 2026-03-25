import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export const getLinks = async () => {
  const response = await axios.get(`${API_URL}/links`);
  return response.data;
};

export const saveLink = async (url, title) => {
  const response = await axios.post(`${API_URL}/links`, { url, title });
  return response.data;
};

export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  const response = await axios.post(`${API_URL}/links/upload-pdf`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteLink = async (id) => {
  const response = await axios.delete(`${API_URL}/links/${id}`);
  return response.data;
};

export const searchLinks = async (query) => {
  const response = await axios.post(`${API_URL}/search`, { query });
  return response.data.results;
};

export const getGraphData = async () => {
  const response = await axios.get(`${API_URL}/graph`);
  return response.data;
};

export const getResurfacedItems = async () => {
  const response = await axios.get(`${API_URL}/resurface`);
  return response.data;
};

export const getCollections = async () => {
  const response = await axios.get(`${API_URL}/collections`);
  return response.data;
};

export const createCollection = async (name) => {
  const response = await axios.post(`${API_URL}/collections`, { name });
  return response.data;
};

export const addToCollection = async (collectionId, linkId) => {
  const response = await axios.post(`${API_URL}/collections/${collectionId}/add`, { linkId });
  return response.data;
};

export const getCollectionLinks = async (collectionId) => {
  const response = await axios.get(`${API_URL}/collections/${collectionId}/links`);
  return response.data;
};

export const getHighlights = async (itemId) => {
  const response = await axios.get(`${API_URL}/links/${itemId}/highlights`);
  return response.data;
};

export const createHighlight = async (itemId, highlightedText, note) => {
  const response = await axios.post(`${API_URL}/highlights`, { itemId, highlightedText, note });
  return response.data;
};

export const deleteHighlight = async (id) => {
  const response = await axios.delete(`${API_URL}/highlights/${id}`);
  return response.data;
};

export const rebuildClusters = async () => {
  const response = await axios.post(`${API_URL}/clusters/rebuild`);
  return response.data;
};

export const getClusteredLinks = async () => {
  const response = await axios.get(`${API_URL}/links/clustered`);
  return response.data;
};

export const askQuestion = async (question) => {
  const response = await axios.post(`${API_URL}/ask`, { question });
  return response.data;
};

export const getRelatedItems = async (itemId) => {
  const response = await axios.get(`${API_URL}/links/${itemId}/related`);
  return response.data;
};
