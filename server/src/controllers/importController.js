const Import = require('../models/importModel');

const importController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, supplier_id } = req.query;
      const result = await Import.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, supplier_id });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Import.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy phiếu nhập' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Import.create({ ...req.body, created_by: req.user.user_id });
      const receipt = await Import.findById(id);
      res.status(201).json({ message: 'Tạo phiếu nhập thành công', import_receipt: receipt });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Import.delete(req.params.id);
      res.json({ message: 'Xóa phiếu nhập thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = importController;
