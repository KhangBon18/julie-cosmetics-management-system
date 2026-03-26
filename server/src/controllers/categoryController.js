const Category = require('../models/categoryModel');

const categoryController = {
  getAll: async (req, res, next) => {
    try { res.json(await Category.findAll()); } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Category.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy danh mục' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Category.create(req.body);
      res.status(201).json({ message: 'Tạo danh mục thành công', category: await Category.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Category.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật danh mục thành công', category: await Category.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Category.delete(req.params.id);
      res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = categoryController;
