const Payment = require('../models/paymentModel');
const { logAudit } = require('../utils/auditLogger');

const paymentController = {
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status, payment_method } = req.query;
      const result = await Payment.findAll({ page: Number(page), limit: Number(limit), status, payment_method });
      res.json(result);
    } catch (error) { next(error); }
  },

  getById: async (req, res, next) => {
    try {
      const tx = await Payment.findById(req.params.id);
      if (!tx) return res.status(404).json({ message: 'Không tìm thấy giao dịch' });
      res.json(tx);
    } catch (error) { next(error); }
  },

  getByInvoice: async (req, res, next) => {
    try {
      const txs = await Payment.findByInvoice(req.params.invoiceId);
      res.json(txs);
    } catch (error) { next(error); }
  },

  confirm: async (req, res, next) => {
    try {
      const result = await Payment.confirm(req.params.id, req.user.user_id);
      if (!result) return res.status(400).json({ message: 'Giao dịch không ở trạng thái pending' });
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'payment_transaction', entityId: Number(req.params.id), newValues: { status: 'confirmed' }, req });
      res.json({ message: 'Xác nhận thanh toán thành công' });
    } catch (error) { next(error); }
  },

  markFailed: async (req, res, next) => {
    try {
      const result = await Payment.markFailed(req.params.id, req.body.note);
      if (!result) return res.status(400).json({ message: 'Giao dịch không ở trạng thái pending' });
      res.json({ message: 'Đã đánh dấu thanh toán thất bại' });
    } catch (error) { next(error); }
  },

  refund: async (req, res, next) => {
    try {
      const result = await Payment.refund(req.params.id, req.user.user_id);
      if (!result) return res.status(400).json({ message: 'Giao dịch không ở trạng thái confirmed' });
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'payment_transaction', entityId: Number(req.params.id), newValues: { status: 'refunded' }, req });
      res.json({ message: 'Hoàn tiền thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = paymentController;
