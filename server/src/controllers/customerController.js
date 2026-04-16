const Customer = require('../models/customerModel');
const bcrypt = require('bcryptjs');

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
  // Get full customer detail with order history (admin detail view)
  getDetail: async (req, res, next) => {
    try {
      const item = await Customer.findByIdWithOrders(req.params.id);
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
  },
  // Admin: Reset customer password
  resetPassword: async (req, res, next) => {
    try {
      const { password } = req.body;
      if (!password || password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
      }
      const customer = await Customer.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      await Customer.resetPassword(req.params.id, hashedPassword);
      res.json({ message: `Đã đặt lại mật khẩu cho khách hàng "${customer.full_name}"` });
    } catch (error) { next(error); }
  },
  // Admin: Lock/unlock customer account (remove or restore password)
  toggleAccountLock: async (req, res, next) => {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) return res.status(404).json({ message: 'Không tìm thấy khách hàng' });

      if (customer.has_account) {
        // Lock account by removing password
        await Customer.removePassword(req.params.id);
        res.json({ message: `Đã khóa tài khoản online của "${customer.full_name}"`, has_account: false });
      } else {
        return res.status(400).json({ message: 'Khách hàng chưa có tài khoản online. Không thể khóa.' });
      }
    } catch (error) { next(error); }
  }
};

module.exports = customerController;
