import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

/**
 * Request interceptor — chọn đúng token theo context:
 *  - API customer-auth hoặc public/checkout → customer_token
 *  - API admin/staff → staff_token
 */
api.interceptors.request.use(
  (config) => {
    const url = config.url || '';
    const isCustomerAPI = url.includes('/customer-auth/')
      || url.includes('/customer-auth')
      || (url.includes('/public/checkout'));

    const token = isCustomerAPI
      ? localStorage.getItem('customer_token')
      : localStorage.getItem('staff_token');

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

        const isCustomerAuth = url.includes('/customer-auth');
        const isOnShop = path.startsWith('/shop');
        const isOnShopAuth = path.startsWith('/shop/auth');
        const isOnLogin = path.startsWith('/admin/login');

        if (!isCustomerAuth && !isOnShopAuth && !isOnLogin) {
          if (isOnShop) {
            // Customer session expired on shop pages
            localStorage.removeItem('customer_token');
            window.location.href = '/shop/auth';
          } else {
            // Staff session expired on admin pages
            localStorage.removeItem('staff_token');
            window.location.href = '/admin/login';
          }
        }
      }
      throw error.response.data;
    }
    throw { message: 'Lỗi kết nối máy chủ' };
  }
);

export default api;
