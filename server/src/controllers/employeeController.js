const Employee = require('../models/employeeModel');

const employeeController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, status } = req.query;
      const result = await Employee.findAll(parseInt(page) || 1, parseInt(limit) || 10, status);
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Employee.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy nhân viên' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Employee.create(req.body);
      res.status(201).json({ message: 'Thêm nhân viên thành công', employee: await Employee.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Employee.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật nhân viên thành công', employee: await Employee.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Employee.delete(req.params.id);
      res.json({ message: 'Xóa nhân viên thành công' });
    } catch (error) { next(error); }
  },
  getPositionHistory: async (req, res, next) => {
    try {
      const history = await Employee.getPositionHistory(req.params.id);
      res.json(history);
    } catch (error) { next(error); }
  },
  assignPosition: async (req, res, next) => {
    try {
      await Employee.assignPosition({ employee_id: req.params.id, ...req.body });
      res.json({ message: 'Gán chức vụ thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = employeeController;
