const Customer = require('../models/customerModel');

const customerController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, search, membership_tier } = req.query;
      const result = await Customer.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, search, membership_tier });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Customer.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      res.json(item);
    } catch (error) { next(error); }
  },
  findByPhone: async (req, res, next) => {
    try {
      const item = await Customer.findByPhone(req.params.phone);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Customer.create(req.body);
      res.status(201).json({ message: 'Tạo khách hàng thành công', customer: await Customer.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Customer.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật khách hàng thành công', customer: await Customer.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Customer.delete(req.params.id);
      res.json({ message: 'Xóa khách hàng thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = customerController;
