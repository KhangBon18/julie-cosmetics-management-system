import api from './api';

const publicService = {
  getProducts: (params) => api.get('/public/products', { params }),
  getProduct: (id) => api.get(`/public/products/${id}`),
  getCategories: () => api.get('/public/categories'),
  getCategoriesTree: () => api.get('/public/categories-tree'),
  getBrands: () => api.get('/public/brands'),
  getFeatured: (params) => api.get('/public/featured', { params }),
  getNewArrivals: (params) => api.get('/public/new-arrivals', { params }),
  getRelatedProducts: (id, params) => api.get(`/public/products/${id}/related`, { params }),
  getProductReviews: (id, params) => api.get(`/public/products/${id}/reviews`, { params }),
  validateCart: (data) => api.post('/public/cart/validate', data),
  checkout: (data) => api.post('/public/checkout', data)
};

export default publicService;
