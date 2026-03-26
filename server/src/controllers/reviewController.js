const Review = require('../models/reviewModel');

const reviewController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, product_id } = req.query;
      const result = await Review.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, product_id });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Review.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Review.create(req.body);
      res.status(201).json({ message: 'Tạo đánh giá thành công', review: await Review.findById(id) });
    } catch (error) { next(error); }
  },
  toggleVisibility: async (req, res, next) => {
    try {
      const { is_visible } = req.body;
      await Review.toggleVisibility(req.params.id, is_visible);
      res.json({ message: is_visible ? 'Đã hiện đánh giá' : 'Đã ẩn đánh giá' });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Review.delete(req.params.id);
      res.json({ message: 'Xóa đánh giá thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = reviewController;
