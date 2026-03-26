const Brand = require('../models/brandModel');

const brandController = {
  getAll: async (req, res, next) => {
    try { res.json(await Brand.findAll()); } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Brand.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy thương hiệu' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Brand.create(req.body);
      res.status(201).json({ message: 'Tạo thương hiệu thành công', brand: await Brand.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Brand.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật thương hiệu thành công', brand: await Brand.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Brand.delete(req.params.id);
      res.json({ message: 'Xóa thương hiệu thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = brandController;
