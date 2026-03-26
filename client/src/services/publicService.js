import api from './api';

const publicService = {
  getProducts: (params) => api.get('/public/products', { params }),
  getProduct: (id) => api.get(`/public/products/${id}`),
  getCategories: () => api.get('/public/categories'),
  getBrands: () => api.get('/public/brands')
};

export default publicService;
