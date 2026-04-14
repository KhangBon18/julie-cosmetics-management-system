import api from './api';

// Generic CRUD service factory
const createService = (basePath) => ({
  getAll: (params) => api.get(basePath, { params }),
  getById: (id) => api.get(`${basePath}/${id}`),
  create: (data) => api.post(basePath, data),
  update: (id, data) => api.put(`${basePath}/${id}`, data),
  delete: (id) => api.delete(`${basePath}/${id}`)
});

export const employeeService = {
  ...createService('/employees'),
  getPositionHistory: (id) => api.get(`/employees/${id}/positions`),
  assignPosition: (id, data) => api.post(`/employees/${id}/positions`, data)
};

export const positionService = createService('/positions');
export const leaveService = {
  ...createService('/leaves'),
  approve: (id) => api.put(`/leaves/${id}/approve`),
  reject: (id, data) => api.put(`/leaves/${id}/reject`, data)
};
export const salaryService = createService('/salaries');
export const brandService = createService('/brands');
export const categoryService = createService('/categories');
export const supplierService = createService('/suppliers');
export const importService = createService('/imports');
export const customerService = {
  ...createService('/customers'),
  findByPhone: (phone) => api.get(`/customers/phone/${phone}`)
};
export const invoiceService = {
  ...createService('/invoices'),
  getRevenueStats: (params) => api.get('/invoices/revenue', { params })
};
export const paymentService = {
  ...createService('/payments'),
  getByInvoice: (invoiceId) => api.get(`/payments/invoice/${invoiceId}`),
  confirm: (id) => api.put(`/payments/${id}/confirm`),
  markFailed: (id, data) => api.put(`/payments/${id}/failed`, data),
  refund: (id) => api.put(`/payments/${id}/refund`)
};
export const settingsService = {
  getAll: (params) => api.get('/settings', { params }),
  getByKey: (key) => api.get(`/settings/${key}`),
  update: (key, value) => api.put(`/settings/${key}`, { value }),
  bulkUpdate: (settings) => api.put('/settings/bulk', { settings }),
  backup: () => api.post('/settings/backup')
};
export const publicSettingService = {
  getAll: () => api.get('/public/settings')
};
export const reviewService = {
  ...createService('/reviews'),
  toggleVisibility: (id, isVisible) => api.put(`/reviews/${id}/visibility`, { is_visible: isVisible })
};
export const productService = createService('/products');
export const userService = {
  ...createService('/users'),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  toggleActive: (id, data) => api.put(`/users/${id}/toggle-active`, data)
};
