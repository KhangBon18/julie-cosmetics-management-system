import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

const refreshClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

let pendingRefreshPromise = null;

const clearStaffSession = () => {
  localStorage.removeItem('staff_token');
  localStorage.removeItem('staff_refresh_token');
};

const refreshStaffToken = async () => {
  const refreshToken = localStorage.getItem('staff_refresh_token');
  if (!refreshToken) {
    throw new Error('Không có refresh token');
  }

  if (!pendingRefreshPromise) {
    pendingRefreshPromise = refreshClient.post('/auth/refresh', { refreshToken })
      .then((response) => {
        const nextToken = response?.data?.token;
        if (!nextToken) {
          throw new Error('Refresh token không trả về access token mới');
        }
        localStorage.setItem('staff_token', nextToken);
        return nextToken;
      })
      .catch((error) => {
        clearStaffSession();
        throw error;
      })
      .finally(() => {
        pendingRefreshPromise = null;
      });
  }

  return pendingRefreshPromise;
};

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
  async (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        const originalRequest = error.config || {};
        const url = originalRequest.url || '';
        const path = window.location.pathname;

        const isCustomerAuth = url.includes('/customer-auth');
        const isStaffAuthRequest = url.includes('/auth/login') || url.includes('/auth/refresh') || url.includes('/auth/logout');
        const isOnShop = path.startsWith('/shop');
        const isOnShopAuth = path.startsWith('/shop/auth');
        const isOnLogin = path.startsWith('/admin/login');

        if (!isCustomerAuth && !isStaffAuthRequest && !originalRequest._retry) {
          const hasRefreshToken = Boolean(localStorage.getItem('staff_refresh_token'));
          if (hasRefreshToken) {
            try {
              originalRequest._retry = true;
              const nextToken = await refreshStaffToken();
              originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${nextToken}`
              };
              return api(originalRequest);
            } catch {
              // fall through to redirect logic below
            }
          }
        }

        if (!isCustomerAuth && !isOnShopAuth && !isOnLogin) {
          if (isOnShop) {
            // Customer session expired on shop pages
            localStorage.removeItem('customer_token');
            window.location.href = '/shop/auth';
          } else {
            // Staff session expired on admin pages
            clearStaffSession();
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
