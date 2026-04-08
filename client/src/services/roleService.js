import api from './api';

const roleService = {
  getAll: () => api.get('/roles'),
  getById: (id) => api.get(`/roles/${id}`),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  delete: (id) => api.delete(`/roles/${id}`),
  getAllPermissions: () => api.get('/roles/permissions/all'),
  getModules: () => api.get('/roles/modules'),
};

export default roleService;
