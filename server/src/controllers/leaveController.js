const Leave = require('../models/leaveModel');
const Notification = require('../models/notificationModel');
const { logAudit } = require('../utils/auditLogger');
const { pool } = require('../config/db');

const leaveTypeLabel = {
  annual: 'đơn nghỉ phép',
  sick: 'đơn nghỉ ốm',
  maternity: 'đơn nghỉ thai sản',
  unpaid: 'đơn nghỉ không lương',
  resignation: 'đơn nghỉ việc'
};

const toSentenceCase = (value = '') => value.charAt(0).toUpperCase() + value.slice(1);
const normalizeRejectReason = (value = '') => value.trim().replace(/\.+$/, '') || 'Không có ghi chú bổ sung';
const formatLeaveRange = (leave) => {
  const start = new Date(leave.start_date).toLocaleDateString('vi-VN');
  const end = new Date(leave.end_date).toLocaleDateString('vi-VN');
  return start === end ? `ngày ${start}` : `từ ${start} đến ${end}`;
};

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
      if (!item) return res.status(404).json({ message: 'Không tìm thấy đơn nghỉ' });

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
      const isManagerUp = req.user.role === 'admin' || req.user.role === 'manager';
      const requestedEmployeeId = req.body.employee_id ? Number(req.body.employee_id) : null;
      let employeeId = requestedEmployeeId;

      if (req.user.role === 'staff') {
        if (!req.user.employee_id) {
          return res.status(400).json({ message: 'Tài khoản không liên kết với nhân viên nào' });
        }
        employeeId = req.user.employee_id;
      } else if (!employeeId) {
        employeeId = req.user.employee_id || null;
      }

      if (!employeeId) {
        return res.status(400).json({ message: isManagerUp ? 'Vui lòng chọn nhân viên cho đơn nghỉ' : 'Không xác định được nhân viên' });
      }

      if (req.user.role === 'staff' && requestedEmployeeId && requestedEmployeeId !== req.user.employee_id) {
        return res.status(403).json({ message: 'Nhân viên chỉ được tạo đơn nghỉ cho chính mình' });
      }

      const id = await Leave.create({
        employee_id: employeeId,
        leave_type: req.body.leave_type,
        start_date: req.body.start_date,
        end_date: req.body.end_date,
        reason: req.body.reason
      });
      const leave = await Leave.findById(id);
      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'leave_request', entityId: id, newValues: leave, req });
      res.status(201).json({ message: leave.leave_type === 'resignation' ? 'Tạo đơn nghỉ việc thành công' : 'Tạo đơn nghỉ phép thành công', leave });
    } catch (error) { next(error); }
  },
  approve: async (req, res, next) => {
    try {
      const leave = await Leave.findById(req.params.id);
      if (!leave) return res.status(404).json({ message: 'Không tìm thấy đơn nghỉ' });

      await Leave.approve(req.params.id, req.user.user_id);
      
      // Gửi Notification
      if (leave && leave.employee_id) {
        const [uRows] = await pool.query('SELECT user_id FROM users WHERE employee_id = ? AND is_active = 1', [leave.employee_id]);
        if (uRows.length) {
          const leaveLabel = leaveTypeLabel[leave.leave_type] || 'đơn nghỉ';
          await Notification.create({
            userId: uRows[0].user_id,
            userType: 'staff',
            title: `${toSentenceCase(leaveLabel)} đã được duyệt`,
            message: leave.leave_type === 'resignation'
              ? `Quản lý đã duyệt đơn nghỉ việc của bạn. Ngày làm việc cuối cùng: ${new Date(leave.end_date).toLocaleDateString('vi-VN')}.`
              : `${toSentenceCase(leaveLabel)} của bạn ${formatLeaveRange(leave)} đã được phê duyệt.`,
            type: 'success',
            link: '/admin/my-leaves'
          });
        }
      }
      
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'leave_request', entityId: req.params.id, newValues: { status: 'approved' }, req });
      res.json({ message: leave.leave_type === 'resignation' ? 'Đã phê duyệt đơn nghỉ việc' : 'Đã phê duyệt đơn nghỉ phép' });
    } catch (error) { next(error); }
  },
  reject: async (req, res, next) => {
    try {
      const { reject_reason } = req.body;
      const leave = await Leave.findById(req.params.id);
      if (!leave) return res.status(404).json({ message: 'Không tìm thấy đơn nghỉ' });

      await Leave.reject(req.params.id, req.user.user_id, reject_reason);

      // Gửi Notification
      if (leave && leave.employee_id) {
        const [uRows] = await pool.query('SELECT user_id FROM users WHERE employee_id = ? AND is_active = 1', [leave.employee_id]);
        if (uRows.length) {
          const leaveLabel = leaveTypeLabel[leave.leave_type] || 'đơn nghỉ';
          const normalizedReason = normalizeRejectReason(reject_reason || '');
          await Notification.create({
            userId: uRows[0].user_id,
            userType: 'staff',
            title: `${toSentenceCase(leaveLabel)} chưa được phê duyệt`,
            message: leave.leave_type === 'resignation'
              ? `Đơn nghỉ việc của bạn chưa được phê duyệt. Lý do: ${normalizedReason}.`
              : `${toSentenceCase(leaveLabel)} của bạn ${formatLeaveRange(leave)} chưa được phê duyệt. Lý do: ${normalizedReason}.`,
            type: 'error',
            link: '/admin/my-leaves'
          });
        }
      }
      
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'leave_request', entityId: req.params.id, newValues: { status: 'rejected', reject_reason }, req });
      res.json({ message: leave.leave_type === 'resignation' ? 'Đã từ chối đơn nghỉ việc' : 'Đã từ chối đơn nghỉ phép' });
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
