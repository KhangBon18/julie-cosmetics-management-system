const Shipping = require('../models/shippingModel');

const shippingController = {
  getAll: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const result = await Shipping.findAll({ page: Number(page), limit: Number(limit), status });
      res.json(result);
    } catch (error) { next(error); }
  },

  getById: async (req, res, next) => {
    try {
      const order = await Shipping.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn giao hàng' });
      res.json(order);
    } catch (error) { next(error); }
  },

  updateStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'failed', 'returned'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
      }
      const result = await Shipping.updateStatus(req.params.id, status);
      if (!result) return res.status(404).json({ message: 'Không tìm thấy đơn giao hàng' });
      res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (error) { next(error); }
  },

  setTrackingCode: async (req, res, next) => {
    try {
      const { tracking_code } = req.body;
      if (!tracking_code) return res.status(400).json({ message: 'Mã vận đơn là bắt buộc' });
      await Shipping.setTrackingCode(req.params.id, tracking_code);
      res.json({ message: 'Cập nhật mã vận đơn thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = shippingController;
