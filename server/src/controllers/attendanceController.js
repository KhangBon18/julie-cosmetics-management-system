const Attendance = require('../models/attendanceModel');
const { logAudit } = require('../utils/auditLogger');

const csvEscape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const normalizeFilters = async (query = {}) => {
  const normalized = {
    page: Math.max(1, Number(query.page) || 1),
    limit: Math.min(200, Math.max(1, Number(query.limit) || 50)),
    employee_id: query.employee_id ? Number(query.employee_id) : undefined,
    status: query.status || undefined,
    from_date: query.from_date || undefined,
    to_date: query.to_date || undefined,
  };

  if (!normalized.from_date && !normalized.to_date) {
    const currentMoment = await Attendance.getCurrentDbMoment();
    normalized.from_date = currentMoment.work_date;
    normalized.to_date = currentMoment.work_date;
  }

  return normalized;
};

const attendanceController = {
  getAll: async (req, res, next) => {
    try {
      const filters = await normalizeFilters(req.query);
      const result = await Attendance.findAll(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getSummary: async (req, res, next) => {
    try {
      const filters = await normalizeFilters(req.query);
      const summary = await Attendance.getSummary(filters);
      res.json({ summary, filters });
    } catch (error) {
      next(error);
    }
  },

  exportAttendances: async (req, res, next) => {
    try {
      const filters = await normalizeFilters({ ...req.query, limit: 200 });
      const rows = await Attendance.exportRows(filters);
      const headers = [
        'Nhân viên',
        'Ngày công',
        'Ca làm',
        'Giờ vào',
        'Giờ ra',
        'Đi trễ (phút)',
        'Về sớm (phút)',
        'Phút làm thực tế',
        'Tăng ca (phút)',
        'Trạng thái',
        'Nguồn',
        'Ghi chú',
      ];
      const csvRows = rows.map((row) => [
        row.employee_name,
        row.work_date,
        row.shift_name || row.shift_code || '—',
        row.check_in_at || '',
        row.check_out_at || '',
        row.minutes_late,
        row.minutes_early_leave,
        row.work_minutes,
        row.overtime_minutes,
        row.status,
        row.source,
        row.note || '',
      ]);

      await logAudit({
        userId: req.user.user_id,
        action: 'EXPORT',
        entityType: 'attendance_record',
        newValues: { filters, total_rows: rows.length },
        req,
      });

      const csv = '\uFEFF' + [headers, ...csvRows].map((row) => row.map(csvEscape).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=cham-cong.csv');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  },

  getAdjustmentRequests: async (req, res, next) => {
    try {
      const result = await Attendance.getAdjustmentRequests({
        page: Math.max(1, Number(req.query.page) || 1),
        limit: Math.min(200, Math.max(1, Number(req.query.limit) || 20)),
        employee_id: req.query.employee_id ? Number(req.query.employee_id) : undefined,
        status: req.query.status || undefined,
        from_date: req.query.from_date || undefined,
        to_date: req.query.to_date || undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const attendance = await Attendance.findById(req.params.id);
      if (!attendance) {
        return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
      }
      res.json({ attendance });
    } catch (error) {
      next(error);
    }
  },

  createManual: async (req, res, next) => {
    try {
      const attendance = await Attendance.upsertManual(req.body, req.user.user_id);
      await logAudit({
        userId: req.user.user_id,
        action: 'CREATE',
        entityType: 'attendance_record',
        entityId: attendance.attendance_id,
        newValues: attendance,
        req,
      });
      res.status(201).json({ message: 'Tạo bản ghi chấm công thành công', attendance });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const oldAttendance = await Attendance.findById(req.params.id);
      if (!oldAttendance) {
        return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
      }

      const attendance = await Attendance.updateById(req.params.id, req.body, req.user.user_id);
      await logAudit({
        userId: req.user.user_id,
        action: 'UPDATE',
        entityType: 'attendance_record',
        entityId: attendance.attendance_id,
        oldValues: oldAttendance,
        newValues: attendance,
        req,
      });
      res.json({ message: 'Cập nhật chấm công thành công', attendance });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const attendance = await Attendance.findById(req.params.id);
      if (!attendance) {
        return res.status(404).json({ message: 'Không tìm thấy bản ghi chấm công' });
      }

      await Attendance.delete(req.params.id);
      await logAudit({
        userId: req.user.user_id,
        action: 'DELETE',
        entityType: 'attendance_record',
        entityId: req.params.id,
        oldValues: attendance,
        req,
      });
      res.json({ message: 'Xóa bản ghi chấm công thành công' });
    } catch (error) {
      next(error);
    }
  },

  approveAdjustment: async (req, res, next) => {
    try {
      const beforeRequest = await Attendance.getAdjustmentRequestById(req.params.id);
      if (!beforeRequest) {
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu điều chỉnh công' });
      }

      const result = await Attendance.approveAdjustmentRequest(req.params.id, req.user.user_id);
      await logAudit({
        userId: req.user.user_id,
        action: 'UPDATE',
        entityType: 'attendance_adjustment_request',
        entityId: req.params.id,
        oldValues: beforeRequest,
        newValues: result.request,
        req,
      });
      res.json({ message: 'Đã duyệt yêu cầu điều chỉnh công', ...result });
    } catch (error) {
      next(error);
    }
  },

  rejectAdjustment: async (req, res, next) => {
    try {
      const beforeRequest = await Attendance.getAdjustmentRequestById(req.params.id);
      if (!beforeRequest) {
        return res.status(404).json({ message: 'Không tìm thấy yêu cầu điều chỉnh công' });
      }

      const request = await Attendance.rejectAdjustmentRequest(
        req.params.id,
        req.user.user_id,
        req.body.reject_reason
      );
      await logAudit({
        userId: req.user.user_id,
        action: 'UPDATE',
        entityType: 'attendance_adjustment_request',
        entityId: req.params.id,
        oldValues: beforeRequest,
        newValues: request,
        req,
      });
      res.json({ message: 'Đã từ chối yêu cầu điều chỉnh công', request });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = attendanceController;
