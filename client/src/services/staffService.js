import api from './api';

// Staff self-service APIs
const staffService = {
  getDashboard: () => api.get('/staff/dashboard'),
  getProfile: () => api.get('/staff/profile'),
  updateProfile: (data) => api.put('/staff/profile', data),
  getMySalaries: (params) => api.get('/staff/salaries', { params }),
  getSalaryFormula: () => api.get('/staff/salary-formula'),
  getMyLeaves: (params) => api.get('/staff/leaves', { params }),
  createLeave: (data) => api.post('/staff/leaves', data),
};

export default staffService;
