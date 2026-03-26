const Position = require('../models/positionModel');

const positionController = {
  getAll: async (req, res, next) => {
    try { res.json(await Position.findAll()); } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Position.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy chức vụ' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Position.create(req.body);
      res.status(201).json({ message: 'Tạo chức vụ thành công', position: await Position.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Position.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật chức vụ thành công', position: await Position.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Position.delete(req.params.id);
      res.json({ message: 'Xóa chức vụ thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = positionController;
