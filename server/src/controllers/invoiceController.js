const Invoice = require('../models/invoiceModel');

const invoiceController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, customer_id, payment_method } = req.query;
      const result = await Invoice.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, customer_id, payment_method });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Invoice.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy hóa đơn' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Invoice.create({ ...req.body, created_by: req.user.user_id });
      const invoice = await Invoice.findById(id);
      res.status(201).json({ message: 'Tạo hóa đơn thành công', invoice });
    } catch (error) { next(error); }
  },
  getRevenueStats: async (req, res, next) => {
    try {
      const { start_date, end_date } = req.query;
      const stats = await Invoice.getRevenueStats(start_date, end_date);
      res.json(stats);
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Invoice.delete(req.params.id);
      res.json({ message: 'Xóa hóa đơn thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = invoiceController;
