import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - thêm token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - xử lý lỗi
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const url = error.config?.url || '';
        const path = window.location.pathname;

        // Don't redirect for customer auth API calls or when on shop/auth pages
        const isCustomerAuth = url.includes('/customer-auth/');
        const isOnShopAuth = path.startsWith('/shop/auth');
        const isOnLogin = path.startsWith('/admin/login');

        if (!isCustomerAuth && !isOnShopAuth && !isOnLogin) {
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          window.location.href = '/admin/login';
        }
      }
      throw error.response.data;
    }
    throw { message: 'Lỗi kết nối máy chủ' };
  }
);

export default api;
