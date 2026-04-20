const Supplier = require('../models/supplierModel');

const supplierController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, search, is_active, sort } = req.query;
      res.json(await Supplier.findAll({
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        search,
        is_active,
        sort
      }));
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Supplier.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
      res.json(item);
    } catch (error) { next(error); }
  },
  getProductMappings: async (req, res, next) => {
    try {
      const data = await Supplier.getProductMappings(Number(req.params.id));
      if (!data) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
      res.json(data);
    } catch (error) { next(error); }
  },
  addProductMapping: async (req, res, next) => {
    try {
      const productId = Number(req.body?.product_id);
      if (!productId) {
        return res.status(400).json({ message: 'product_id là bắt buộc' });
      }

      const data = await Supplier.addProductMapping(Number(req.params.id), productId);
      res.status(201).json({
        message: 'Đã thêm sản phẩm vào danh mục của nhà cung cấp',
        ...data
      });
    } catch (error) { next(error); }
  },
  removeProductMapping: async (req, res, next) => {
    try {
      const data = await Supplier.removeProductMapping(Number(req.params.id), Number(req.params.productId));
      res.json({
        message: 'Đã gỡ sản phẩm khỏi danh mục của nhà cung cấp',
        ...data
      });
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Supplier.create(req.body);
      res.status(201).json({ message: 'Tạo NCC thành công', supplier: await Supplier.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Supplier.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật NCC thành công', supplier: await Supplier.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Supplier.delete(req.params.id);
      res.json({ message: 'Xóa NCC thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = supplierController;
