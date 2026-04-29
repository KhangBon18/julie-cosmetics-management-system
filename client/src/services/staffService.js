import api from './api';

// Staff self-service APIs
const staffService = {
  getDashboard: () => api.get('/staff/dashboard'),
  getProfile: () => api.get('/staff/profile'),
  updateProfile: (data) => api.put('/staff/profile', data),
  getMySalaries: (params) => api.get('/staff/salaries', { params }),
  getMySalaryAlias: (params) => api.get('/staff/my-salary', { params }),
  getMonthlySalarySlip: (month, year) => api.get(`/staff/salary-slip/${month}/${year}`),
  getAnnualSalarySlip: (year) => api.get(`/staff/salary-slip/annual/${year}`),
  getSalaryFormula: () => api.get('/staff/salary-formula'),
  getMyLeaves: (params) => api.get('/staff/leaves', { params }),
  getMyLeavesAlias: (params) => api.get('/staff/my-leaves', { params }),
  createLeave: (data) => api.post('/staff/leaves', data),
  getTodayAttendance: () => api.get('/staff/attendance/today'),
  getMyAttendances: (params) => api.get('/staff/attendance', { params }),
  checkIn: (data) => api.post('/staff/attendance/check-in', data || {}),
  checkOut: (data) => api.post('/staff/attendance/check-out', data || {}),
  createAttendanceAdjustment: (data) => api.post('/staff/attendance/adjustments', data),
  getMyAttendanceAdjustments: (params) => api.get('/staff/attendance/adjustments', { params }),
};

export default staffService;
