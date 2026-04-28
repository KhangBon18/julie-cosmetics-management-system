import api from './api';
import { downloadCSV } from './exportService';

/**
 * Strip empty/null/undefined values from params before sending to backend.
 * Prevents empty strings (e.g. employee_id='') from reaching validation.
 */
const cleanParams = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) =>
      value !== undefined && value !== null && value !== ''
    )
  );

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
export const salaryService = {
  ...createService('/salaries'),
  getBonuses: (params) => api.get('/salaries/bonuses', { params }),
  upsertBonus: (data) => api.post('/salaries/bonuses', data),
  deleteBonus: (id) => api.delete(`/salaries/bonuses/${id}`)
};
export const attendanceService = {
  getAll: (params) => api.get('/attendances', { params: cleanParams(params) }),
  getSummary: (params) => api.get('/attendances/summary', { params: cleanParams(params) }),
  getById: (id) => api.get(`/attendances/${id}`),
  manual: (data) => api.post('/attendances/manual', data),
  update: (id, data) => api.put(`/attendances/${id}`, data),
  delete: (id) => api.delete(`/attendances/${id}`),
  export: async (params = {}) => {
    const safeParams = cleanParams(params);
    const search = new URLSearchParams();
    Object.entries(safeParams).forEach(([key, value]) => {
      search.set(key, value);
    });
    const suffix = search.toString() ? `?${search.toString()}` : '';
    return downloadCSV(`/attendances/export${suffix}`, 'cham-cong.csv');
  },
  getAdjustments: (params) => api.get('/attendances/adjustments', { params: cleanParams(params) }),
  approveAdjustment: (id) => api.put(`/attendances/adjustments/${id}/approve`),
  rejectAdjustment: (id, data) => api.put(`/attendances/adjustments/${id}/reject`, data)
};
export const brandService = createService('/brands');
export const categoryService = createService('/categories');
export const supplierService = {
  ...createService('/suppliers'),
  getProductMappings: (id) => api.get(`/suppliers/${id}/product-mappings`),
  addProductMapping: (id, product_id) => api.post(`/suppliers/${id}/product-mappings`, { product_id }),
  removeProductMapping: (id, productId) => api.delete(`/suppliers/${id}/product-mappings/${productId}`)
};
export const importService = createService('/imports');
export const customerService = {
  ...createService('/customers'),
  findByPhone: (phone) => api.get(`/customers/phone/${phone}`),
  getDetail: (id) => api.get(`/customers/${id}/detail`),
  resetPassword: (id, password) => api.put(`/customers/${id}/reset-password`, { password }),
  toggleLock: (id) => api.put(`/customers/${id}/toggle-lock`)
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
  getPermissions: (id) => api.get(`/users/${id}/permissions`),
  updatePermissions: (id, data) => api.put(`/users/${id}/permissions`, data),
  resetPassword: (id, data) => api.put(`/users/${id}/reset-password`, data),
  toggleActive: (id, data) => api.put(`/users/${id}/toggle-active`, data)
};
export const payrollService = {
  // Attendance Periods
  getAttendancePeriods: () => api.get('/payroll/attendance-periods'),
  createAttendancePeriod: (data) => api.post('/payroll/attendance-periods', data),
  lockAttendancePeriod: (id) => api.post(`/payroll/attendance-periods/${id}/lock`),
  unlockAttendancePeriod: (id) => api.post(`/payroll/attendance-periods/${id}/unlock`),
  // Payroll Periods
  getPayrollPeriods: () => api.get('/payroll/periods'),
  createPayrollPeriod: (data) => api.post('/payroll/periods', data),
  calculatePayroll: (id) => api.post(`/payroll/periods/${id}/calculate`),
  approvePayroll: (id) => api.post(`/payroll/periods/${id}/approve`),
  markPaid: (id) => api.post(`/payroll/periods/${id}/mark-paid`),
  lockPayroll: (id) => api.post(`/payroll/periods/${id}/lock`),
  getRecords: (id) => api.get(`/payroll/periods/${id}/records`),
  export: (id) => downloadCSV(`/payroll/periods/${id}/export`, `bang-luong-${id}.csv`),
  // Payroll Records
  getRecordById: (id) => api.get(`/payroll/records/${id}`),
  // Payroll Adjustments
  createAdjustment: (salaryId, data) => api.post(`/payroll/records/${salaryId}/adjustments`, data),
  deleteAdjustment: (id) => api.delete(`/payroll/adjustments/${id}`),
};
