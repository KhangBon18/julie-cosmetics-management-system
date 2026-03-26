const Salary = require('../models/salaryModel');

const salaryController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, month, year, employee_id } = req.query;
      const result = await Salary.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, month, year, employee_id });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Salary.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy bảng lương' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Salary.create({ ...req.body, generated_by: req.user.user_id });
      res.status(201).json({ message: 'Tạo bảng lương thành công', salary: await Salary.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Salary.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật bảng lương thành công', salary: await Salary.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Salary.delete(req.params.id);
      res.json({ message: 'Xóa bảng lương thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = salaryController;
