import axios from 'axios';

// API URL Configuration
// CRITICAL: In Vercel, frontend and backend are on the same domain
// So we use relative paths in production
const getApiUrl = () => {
  // In production (Vercel), always use relative path
  if (import.meta.env.PROD) {
    return '/api';
  }

  // In development, use localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

console.log('🔗 API Base URL:', API_URL);
console.log('🌍 Environment:', import.meta.env.PROD ? 'Production' : 'Development');

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
  // Public registration - no auth required, with retry logic
  register: async (id, data) => {
    const publicApi = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Registration attempt ${attempt}/${maxRetries} for event: ${id}`);
        const response = await publicApi.post(`/events/${id}/register`, data);
        console.log(`✅ Registration successful on attempt ${attempt}`);
        return response;
      } catch (error) {
        lastError = error;
        console.error(`❌ Registration attempt ${attempt} failed:`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
          url: error.config?.url,
          data: error.response?.data
        });

        if (error.response?.status >= 400 && error.response?.status < 500) {
          if (error.response.status !== 408 && error.response.status !== 429) {
            console.log(`⚠️ Client error detected, not retrying`);
            throw error;
          }
        }

        if (attempt < maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.error(`❌ All ${maxRetries} registration attempts failed`);
    throw lastError;
  },
  checkRegistration: (id) => api.get(`/events/${id}/check-registration`),
  getMyRegistrations: () => api.get('/events/user/registrations'),
  getRegistrations: (id) => api.get(`/events/${id}/registrations`),
  exportRegistrations: (id) => api.get(`/events/${id}/registrations/export`, { responseType: 'blob' }),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  addGalleryImage: (id, data) => api.post(`/events/${id}/gallery`, data),
  deleteGalleryImage: (id, imageId) => api.delete(`/events/${id}/gallery/${imageId}`),
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
  delete: (id) => api.delete(`/submissions/${id}`),
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
