const Promotion = require('../models/promotionModel');

const promotionController = {
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 10, is_active, search } = req.query;
      const result = await Promotion.findAll({
        page: Number(page),
        limit: Number(limit),
        is_active: is_active !== undefined ? is_active === 'true' : undefined,
        search
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách khuyến mãi', error: error.message });
    }
  },

  getById: async (req, res) => {
    try {
      const promotion = await Promotion.findById(req.params.id);
      if (!promotion) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy khuyến mãi', error: error.message });
    }
  },

  // POST /api/public/promotions/validate — validate coupon code
  validateCode: async (req, res) => {
    try {
      const { code, order_total } = req.body;
      if (!code) return res.status(400).json({ message: 'Thiếu mã khuyến mãi' });

      const promo = await Promotion.findByCode(code);
      if (!promo) return res.status(404).json({ message: 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn' });

      if (order_total && order_total < promo.min_order) {
        return res.status(400).json({
          message: `Đơn hàng tối thiểu ${promo.min_order.toLocaleString()}₫ để sử dụng mã này`
        });
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_type === 'percent') {
        discount = (order_total || 0) * promo.discount_value / 100;
        if (promo.max_discount && discount > promo.max_discount) {
          discount = promo.max_discount;
        }
      } else {
        discount = promo.discount_value;
      }

      res.json({ promotion: promo, calculated_discount: discount });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi kiểm tra mã khuyến mãi', error: error.message });
    }
  },

  create: async (req, res) => {
    try {
      const id = await Promotion.create({ ...req.body, created_by: req.user?.user_id });
      const promotion = await Promotion.findById(id);
      res.status(201).json(promotion);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Mã khuyến mãi đã tồn tại' });
      }
      res.status(500).json({ message: 'Lỗi khi tạo khuyến mãi', error: error.message });
    }
  },

  update: async (req, res) => {
    try {
      const result = await Promotion.update(req.params.id, req.body);
      if (!result) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
      const promotion = await Promotion.findById(req.params.id);
      res.json(promotion);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật khuyến mãi', error: error.message });
    }
  },

  delete: async (req, res) => {
    try {
      const result = await Promotion.delete(req.params.id);
      if (!result) return res.status(404).json({ message: 'Không tìm thấy khuyến mãi' });
      res.json({ message: 'Xóa khuyến mãi thành công' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi xóa khuyến mãi', error: error.message });
    }
  }
};

module.exports = promotionController;
