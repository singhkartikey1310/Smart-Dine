import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  // ⚠️ Do NOT set a default Content-Type here.
  // For JSON requests axios sets it automatically.
  // For FormData (file uploads) axios must set multipart/form-data with boundary.
  // A hardcoded default breaks multipart uploads.
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is stored in sessionStorage (auto-clears on tab close)
    const token = sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Set JSON content-type only when NOT sending FormData
    // (axios auto-sets multipart/form-data + boundary for FormData)
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token');
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
