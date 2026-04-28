import api from './api';

const authService = {
  login: (data) => api.post('/auth/login', data),
  refresh: (data) => api.post('/auth/refresh', data),
  logout: (data) => api.post('/auth/logout', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),

  // Customer auth
  customerLogin: (data) => api.post('/customer-auth/login', data),
  customerRegister: (data) => api.post('/customer-auth/register', data),
  customerProfile: () => api.get('/customer-auth/profile'),
  customerOrders: () => api.get('/customer-auth/orders')
};

export default authService;
