const Leave = require('../models/leaveModel');

const leaveController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, employee_id, status } = req.query;
      const result = await Leave.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, employee_id, status });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Leave.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy đơn nghỉ phép' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Leave.create(req.body);
      res.status(201).json({ message: 'Tạo đơn nghỉ phép thành công', leave: await Leave.findById(id) });
    } catch (error) { next(error); }
  },
  approve: async (req, res, next) => {
    try {
      await Leave.approve(req.params.id, req.user.user_id);
      res.json({ message: 'Đã phê duyệt đơn nghỉ phép' });
    } catch (error) { next(error); }
  },
  reject: async (req, res, next) => {
    try {
      const { reject_reason } = req.body;
      await Leave.reject(req.params.id, req.user.user_id, reject_reason);
      res.json({ message: 'Đã từ chối đơn nghỉ phép' });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Leave.delete(req.params.id);
      res.json({ message: 'Xóa đơn nghỉ phép thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = leaveController;
