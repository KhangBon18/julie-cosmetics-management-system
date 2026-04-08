const Leave = require('../models/leaveModel');
const Notification = require('../models/notificationModel');
const { logAudit } = require('../utils/auditLogger');
const { pool } = require('../config/db');

const leaveController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, employee_id, status } = req.query;
      const result = await Leave.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, employee_id, status });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Leave.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy đơn nghỉ phép' });

      // IDOR protection: staff chỉ xem được đơn của mình
      const role = req.user.role;
      if (role !== 'admin' && role !== 'manager' && item.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: 'Không có quyền xem đơn nghỉ phép này' });
      }

      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Leave.create(req.body);
      const leave = await Leave.findById(id);
      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'leave_request', entityId: id, newValues: leave, req });
      res.status(201).json({ message: 'Tạo đơn nghỉ phép thành công', leave });
    } catch (error) { next(error); }
  },
  approve: async (req, res, next) => {
    try {
      await Leave.approve(req.params.id, req.user.user_id);
      const leave = await Leave.findById(req.params.id);
      
      // Gửi Notification
      if (leave && leave.employee_id) {
        const [uRows] = await pool.query('SELECT user_id FROM users WHERE employee_id = ? AND is_active = 1', [leave.employee_id]);
        if (uRows.length) {
          await Notification.create({
            userId: uRows[0].user_id,
            userType: 'staff',
            title: 'Đơn nghỉ phép đã được duyệt',
            message: `Quản lý đã duyệt đơn xin nghỉ phép của bạn (từ ${new Date(leave.start_date).toLocaleDateString()} đến ${new Date(leave.end_date).toLocaleDateString()}).`,
            type: 'success',
            link: '/staff/leaves'
          });
        }
      }
      
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'leave_request', entityId: req.params.id, newValues: { status: 'approved' }, req });
      res.json({ message: 'Đã phê duyệt đơn nghỉ phép' });
    } catch (error) { next(error); }
  },
  reject: async (req, res, next) => {
    try {
      const { reject_reason } = req.body;
      await Leave.reject(req.params.id, req.user.user_id, reject_reason);
      const leave = await Leave.findById(req.params.id);

      // Gửi Notification
      if (leave && leave.employee_id) {
        const [uRows] = await pool.query('SELECT user_id FROM users WHERE employee_id = ? AND is_active = 1', [leave.employee_id]);
        if (uRows.length) {
          await Notification.create({
            userId: uRows[0].user_id,
            userType: 'staff',
            title: 'Đơn nghỉ phép bị từ chối',
            message: `Đơn xin nghỉ phép của bạn (từ ${new Date(leave.start_date).toLocaleDateString()}) đã bị từ chối. Lý do: ${reject_reason || 'Không có'}`,
            type: 'error',
            link: '/staff/leaves'
          });
        }
      }
      
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'leave_request', entityId: req.params.id, newValues: { status: 'rejected', reject_reason }, req });
      res.json({ message: 'Đã từ chối đơn nghỉ phép' });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      const oldLeave = await Leave.findById(req.params.id);
      await Leave.delete(req.params.id);
      await logAudit({ userId: req.user.user_id, action: 'DELETE', entityType: 'leave_request', entityId: req.params.id, oldValues: oldLeave, req });
      res.json({ message: 'Xóa đơn nghỉ phép thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = leaveController;
