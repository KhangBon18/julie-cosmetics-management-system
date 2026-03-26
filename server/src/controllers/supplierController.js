const Supplier = require('../models/supplierModel');

const supplierController = {
  getAll: async (req, res, next) => {
    try { res.json(await Supplier.findAll()); } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Supplier.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy nhà cung cấp' });
      res.json(item);
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
