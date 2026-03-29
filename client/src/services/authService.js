import api from './api';

const authService = {
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  changePassword: (data) => api.put('/auth/change-password', data),

  // Customer auth
  customerLogin: (data) => api.post('/customer-auth/login', data),
  customerRegister: (data) => api.post('/customer-auth/register', data),
  customerProfile: () => api.get('/customer-auth/profile')
};

export default authService;
