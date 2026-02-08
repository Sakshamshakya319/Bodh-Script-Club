import axios from 'axios';

// API URL Configuration
// Development: Uses localhost
// Production: Uses relative path (/api) - same domain as Vercel deployment
const getApiUrl = () => {
  // Check if we're in production (Vercel)
  if (import.meta.env.PROD) {
    // In production, use relative path
    return '/api';
  }
  
  // In development, use environment variable or localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // If token is invalid or expired, redirect to login (but not for logout request)
    const isLogoutRequest = error.config?.url?.includes?.('logout');
    if (!isLogoutRequest && (error.response?.status === 401 || error.response?.status === 403)) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        console.log('Token expired or invalid, redirecting to login...');
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// Events API
export const eventsAPI = {
  getAll: () => api.get('/events'),
  getOne: (id) => api.get(`/events/${id}`),
  register: (id, data) => api.post(`/events/${id}/register`, data),
  checkRegistration: (id) => api.get(`/events/${id}/check-registration`),
  getMyRegistrations: () => api.get('/events/user/registrations'),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  exportRegistrations: (id) => api.get(`/events/${id}/registrations/export`, { responseType: 'blob' }),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

// Members API
export const membersAPI = {
  getAll: () => api.get('/members'),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.put(`/members/${id}`, data),
  delete: (id) => api.delete(`/members/${id}`),
};

// Submissions API
export const submissionsAPI = {
  create: (data) => api.post('/submissions', data),
  checkRegistration: (registrationNumber) => api.get(`/submissions/check/${encodeURIComponent(registrationNumber)}`),
  getAll: () => api.get('/submissions'),
  export: () => api.get('/submissions/export', { responseType: 'blob' }),
  updateStatus: (id, status) => api.put(`/submissions/${id}`, { status }),
};

// About API
export const aboutAPI = {
  get: () => api.get('/about'),
  update: (data) => api.put('/about', data),
};

// Gallery API
export const galleryAPI = {
  getAll: (params) => api.get('/gallery', { params }),
  getOne: (id) => api.get(`/gallery/${id}`),
  create: (data) => api.post('/gallery', data),
  update: (id, data) => api.put(`/gallery/${id}`, data),
  delete: (id) => api.delete(`/gallery/${id}`),
};

// Testimonials API
export const testimonialsAPI = {
  getApproved: () => api.get('/testimonials'),
  submit: (data) => api.post('/testimonials/submit', data),
  getAll: () => api.get('/testimonials/all'),
  update: (id, data) => api.put(`/testimonials/${id}`, data),
  delete: (id) => api.delete(`/testimonials/${id}`),
};

export default api;
