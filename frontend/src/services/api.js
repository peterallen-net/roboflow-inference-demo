import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:8000', // Adjust this to match your Python backend URL
  timeout: 30000, // 30 seconds timeout for image processing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    }
    return Promise.reject(error);
  }
);

// API methods for image analysis
export const imageAPI = {
  // Upload and analyze image
  analyzeImage: async (imageFile, userId = null, metadata = null) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    if (userId) {
      formData.append('user_id', userId);
    }
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    
    const response = await api.post('/api/v1/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Get analysis results by ID
  getAnalysisResult: async (resultId) => {
    const response = await api.get(`/api/v1/results/${resultId}`);
    return response.data;
  },
  
  // Get analysis history with pagination
  getAnalysisHistory: async (userId = null, limit = 20, offset = 0) => {
    const params = { limit, offset };
    if (userId) {
      params.user_id = userId;
    }
    
    const response = await api.get('/api/v1/results', { params });
    return response.data;
  },
  
  // Delete analysis result
  deleteAnalysisResult: async (resultId) => {
    const response = await api.delete(`/api/v1/results/${resultId}`);
    return response.data;
  },
  
  // Get annotated image URL
  getImageUrl: (resultId) => {
    return `${api.defaults.baseURL}/api/v1/results/${resultId}/image`;
  },
};

export default api;
