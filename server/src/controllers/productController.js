const Product = require('../models/productModel');

const productController = {
  // GET /api/products
  getAll: async (req, res, next) => {
    try {
      const { page, limit, category_id, brand_id, search, sort } = req.query;
      const result = await Product.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 12,
        category_id, brand_id, search, sort
      });
      res.json(result);
    } catch (error) { next(error); }
  },

  // GET /api/products/:id
  getById: async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
      res.json(product);
    } catch (error) { next(error); }
  },

  // POST /api/products
  create: async (req, res, next) => {
    try {
      const id = await Product.create(req.body);
      const product = await Product.findById(id);
      res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
    } catch (error) { next(error); }
  },

  // PUT /api/products/:id
  update: async (req, res, next) => {
    try {
      await Product.update(req.params.id, req.body);
      const product = await Product.findById(req.params.id);
      res.json({ message: 'Cập nhật sản phẩm thành công', product });
    } catch (error) { next(error); }
  },

  // DELETE /api/products/:id
  delete: async (req, res, next) => {
    try {
      await Product.delete(req.params.id);
      res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) { next(error); }
  },

  // GET /api/products/low-stock
  getLowStock: async (req, res, next) => {
    try {
      const threshold = parseInt(req.query.threshold) || 10;
      const products = await Product.getLowStock(threshold);
      res.json(products);
    } catch (error) { next(error); }
  }
};

module.exports = productController;
