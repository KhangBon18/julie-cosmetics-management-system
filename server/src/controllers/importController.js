const Import = require('../models/importModel');
const { logAudit } = require('../utils/auditLogger');

const importController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, supplier_id } = req.query;
      const result = await Import.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, supplier_id });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Import.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy phiếu nhập' });
      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Import.create({ ...req.body, created_by: req.user.user_id });
      const receipt = await Import.findById(id);
      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'import_receipt', entityId: id, newValues: receipt, req });
      res.status(201).json({ message: 'Tạo phiếu nhập thành công', import_receipt: receipt });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      const oldImport = await Import.findById(req.params.id);
      await Import.delete(req.params.id, req.user.user_id);
      const updatedImport = await Import.findById(req.params.id);
      await logAudit({ userId: req.user.user_id, action: 'DELETE', entityType: 'import_receipt', entityId: req.params.id, oldValues: oldImport, newValues: updatedImport, req });
      res.json({ message: 'Hủy phiếu nhập thành công', import_receipt: updatedImport });
    } catch (error) { next(error); }
  }
};

module.exports = importController;
