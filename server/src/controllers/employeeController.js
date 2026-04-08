const Employee = require('../models/employeeModel');
const { logAudit } = require('../utils/auditLogger');

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

      // IDOR protection: Ngăn staff xem hồ sơ người khác (trừ khi là admin/manager)
      const role = req.user.role;
      if (role !== 'admin' && role !== 'manager' && item.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: 'Không có quyền xem hồ sơ của nhân viên này' });
      }

      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Employee.create(req.body);
      const employee = await Employee.findById(id);
      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'employee', entityId: id, newValues: employee, req });
      res.status(201).json({ message: 'Thêm nhân viên thành công', employee });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      const oldEmp = await Employee.findById(req.params.id);
      await Employee.update(req.params.id, req.body);
      const employee = await Employee.findById(req.params.id);
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'employee', entityId: req.params.id, oldValues: oldEmp, newValues: employee, req });
      res.json({ message: 'Cập nhật nhân viên thành công', employee });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      const oldEmp = await Employee.findById(req.params.id);
      await Employee.delete(req.params.id);
      await logAudit({ userId: req.user.user_id, action: 'DELETE', entityType: 'employee', entityId: req.params.id, oldValues: oldEmp, req });
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
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'employee_position', entityId: req.params.id, newValues: req.body, req });
      res.json({ message: 'Gán chức vụ thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = employeeController;
