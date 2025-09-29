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
  analyzeImage: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post('/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  // Get analysis results by ID
  getAnalysisResult: async (analysisId) => {
    const response = await api.get(`/analysis/${analysisId}`);
    return response.data;
  },
  
  // Get analysis history
  getAnalysisHistory: async () => {
    const response = await api.get('/history');
    return response.data;
  },
};

export default api;
