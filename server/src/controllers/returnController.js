const Return = require('../models/returnModel');
const { logAudit } = require('../utils/auditLogger');

const returnController = {
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await Return.findAll({ page: Number(page), limit: Number(limit), status });
      res.json(result);
    } catch (error) { next(error); }
  },

  getById: async (req, res, next) => {
    try {
      const ret = await Return.findById(req.params.id);
      if (!ret) return res.status(404).json({ message: 'Không tìm thấy yêu cầu đổi trả' });
      res.json(ret);
    } catch (error) { next(error); }
  },

  create: async (req, res, next) => {
    try {
      const { invoice_id, customer_id, return_type, reason, items } = req.body;
      if (!invoice_id || !items?.length || !reason) {
        return res.status(400).json({ message: 'Thiếu thông tin: invoice_id, reason, items' });
      }
      const returnId = await Return.create({ invoice_id, customer_id, return_type, reason, items });
      const ret = await Return.findById(returnId);
      await logAudit({ userId: req.user?.user_id, action: 'CREATE', entityType: 'return', entityId: returnId, newValues: { invoice_id, items: items.length }, req });
      res.status(201).json(ret);
    } catch (error) { next(error); }
  },

  approve: async (req, res, next) => {
    try {
      const result = await Return.approve(req.params.id, req.user.user_id);
      if (!result) return res.status(400).json({ message: 'Yêu cầu không ở trạng thái requested' });
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'return', entityId: Number(req.params.id), newValues: { status: 'approved' }, req });
      res.json({ message: 'Đã duyệt yêu cầu đổi trả' });
    } catch (error) { next(error); }
  },

  complete: async (req, res, next) => {
    try {
      await Return.complete(req.params.id, req.user.user_id);
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'return', entityId: Number(req.params.id), newValues: { status: 'completed' }, req });
      res.json({ message: 'Hoàn tất đổi trả — đã hoàn kho' });
    } catch (error) { next(error); }
  },

  reject: async (req, res, next) => {
    try {
      const result = await Return.reject(req.params.id, req.user.user_id, req.body.note);
      if (!result) return res.status(400).json({ message: 'Yêu cầu không ở trạng thái requested' });
      res.json({ message: 'Đã từ chối yêu cầu đổi trả' });
    } catch (error) { next(error); }
  }
};

module.exports = returnController;
