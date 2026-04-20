const Product = require('../models/productModel');
const { logAudit } = require('../utils/auditLogger');
const { normalizePriceRange } = require('../utils/priceRange');

const productController = {
  // GET /api/products
  getAll: async (req, res, next) => {
    try {
      const { page, limit, supplier_id, category_id, brand_id, search, sort, min_price, max_price, is_active, stock_status } = req.query;
      const { min, max } = normalizePriceRange(min_price, max_price);
      const result = await Product.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 12,
        supplier_id,
        category_id,
        brand_id,
        search,
        sort,
        min_price: min,
        max_price: max,
        is_active,
        stock_status
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
      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'product', entityId: id, newValues: product, req });
      res.status(201).json({ message: 'Tạo sản phẩm thành công', product });
    } catch (error) { next(error); }
  },

  // PUT /api/products/:id
  update: async (req, res, next) => {
    try {
      const oldProduct = await Product.findById(req.params.id);
      await Product.update(req.params.id, req.body);
      const product = await Product.findById(req.params.id);
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'product', entityId: req.params.id, oldValues: oldProduct, newValues: product, req });
      res.json({ message: 'Cập nhật sản phẩm thành công', product });
    } catch (error) { next(error); }
  },

  // DELETE /api/products/:id
  delete: async (req, res, next) => {
    try {
      const oldProduct = await Product.findById(req.params.id);
      await Product.delete(req.params.id);
      await logAudit({ userId: req.user.user_id, action: 'DELETE', entityType: 'product', entityId: req.params.id, oldValues: oldProduct, req });
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
