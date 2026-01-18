import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Upload operations
export const uploadFile = async (file, datasetName) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('datasetName', datasetName);
  
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const getDatasets = () => api.get('/upload/datasets');
export const getDatasetById = (id) => api.get(`/upload/datasets/${id}`);
export const deleteDataset = (id) => api.delete(`/upload/datasets/${id}`);

// KPI operations
export const createKPI = (kpiData) => api.post('/kpis', kpiData);
export const getKPIs = (datasetId) => api.get('/kpis', { params: { datasetId } });
export const calculateKPI = (kpiId) => api.get(`/kpis/${kpiId}/calculate`);
export const calculateAllKPIs = (datasetId) => api.get('/kpis/calculate-all', { params: { datasetId } });
export const deleteKPI = (id) => api.delete(`/kpis/${id}`);
// Recommendation operations (NO API KEY NEEDED)
export const analyzeDataset = (datasetId) => 
  api.get(`/recommendations/analyze/${datasetId}`);

export const getRecommendations = (datasetId, dashboardType) => 
  api.get(`/recommendations/suggest/${datasetId}`, { 
    params: { dashboardType } 
  });

export const applyRecommendations = (datasetId, recommendations) => 
  api.post('/recommendations/apply', { datasetId, recommendations });