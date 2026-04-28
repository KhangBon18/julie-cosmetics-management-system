const Attendance = require('../models/attendanceModel');
const { logAudit } = require('../utils/auditLogger');

const getEmployeeIdOrFail = (req) => {
  if (!req.user?.employee_id) {
    const error = new Error('Tài khoản chưa liên kết nhân viên');
    error.status = 400;
    throw error;
  }

  return Number(req.user.employee_id);
};

const buildTodayLeaveSnapshot = (leave) => ({
  attendance_id: null,
  employee_id: null,
  work_date: leave?.start_date || null,
  shift_name: 'Nghỉ phép',
  check_in_at: null,
  check_out_at: null,
  source: 'system',
  status: 'leave',
  minutes_late: 0,
  minutes_early_leave: 0,
  work_minutes: 0,
  overtime_minutes: 0,
  note: leave?.reason || null,
});

const staffAttendanceController = {
  getToday: async (req, res, next) => {
    try {
      const employeeId = getEmployeeIdOrFail(req);
      const currentMoment = await Attendance.getCurrentDbMoment();
      const attendance = await Attendance.findByEmployeeAndDate(employeeId, currentMoment.work_date);
      const approvedLeave = attendance
        ? null
        : await Attendance.getApprovedLeaveForEmployeeDate(employeeId, currentMoment.work_date);

      const responseAttendance = attendance || (approvedLeave
        ? {
            ...buildTodayLeaveSnapshot(approvedLeave),
            employee_id: employeeId,
            work_date: currentMoment.work_date,
          }
        : null);

      // Check period lock status
      const [yearStr, monthStr] = currentMoment.work_date.split('-');
      const month = Number(monthStr);
      const year = Number(yearStr);
      const PayrollModel = require('../models/payrollModel');
      const period = await PayrollModel.findPeriodByMonth(month, year);
      const isPeriodLocked = period?.status === 'locked';

      res.json({
        employee_linked: true,
        work_date: currentMoment.work_date,
        attendance: responseAttendance,
        approved_leave: approvedLeave,
        can_check_in: !isPeriodLocked && !approvedLeave && !attendance?.check_in_at,
        can_check_out: !isPeriodLocked && Boolean(attendance?.check_in_at && !attendance?.check_out_at),
        is_period_locked: isPeriodLocked
      });
    } catch (error) {
      next(error);
    }
  },

  getMyAttendances: async (req, res, next) => {
    try {
      const employeeId = getEmployeeIdOrFail(req);
      const result = await Attendance.findAll({
        page: Math.max(1, Number(req.query.page) || 1),
        limit: Math.min(200, Math.max(1, Number(req.query.limit) || 20)),
        employee_id: employeeId,
        status: req.query.status || undefined,
        from_date: req.query.from_date || undefined,
        to_date: req.query.to_date || undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  checkIn: async (req, res, next) => {
    try {
      const employeeId = getEmployeeIdOrFail(req);
      const currentMoment = await Attendance.getCurrentDbMoment();
      const approvedLeave = await Attendance.getApprovedLeaveForEmployeeDate(employeeId, currentMoment.work_date);
      if (approvedLeave) {
        return res.status(409).json({ message: 'Hôm nay bạn đang trong thời gian nghỉ phép đã được duyệt' });
      }

      const attendance = await Attendance.checkIn(employeeId, req.user.user_id, req.body.note);
      await logAudit({
        userId: req.user.user_id,
        action: 'UPDATE',
        entityType: 'attendance_record',
        entityId: attendance.attendance_id,
        newValues: { action: 'check_in', attendance },
        req,
      });
      res.json({ message: 'Đã chấm vào', attendance });
    } catch (error) {
      next(error);
    }
  },

  checkOut: async (req, res, next) => {
    try {
      const employeeId = getEmployeeIdOrFail(req);
      const attendance = await Attendance.checkOut(employeeId, req.user.user_id, req.body.note);
      await logAudit({
        userId: req.user.user_id,
        action: 'UPDATE',
        entityType: 'attendance_record',
        entityId: attendance.attendance_id,
        newValues: { action: 'check_out', attendance },
        req,
      });
      res.json({ message: 'Đã chấm ra', attendance });
    } catch (error) {
      next(error);
    }
  },

  createAdjustment: async (req, res, next) => {
    try {
      const employeeId = getEmployeeIdOrFail(req);
      const request = await Attendance.createAdjustmentRequest(employeeId, req.body);
      await logAudit({
        userId: req.user.user_id,
        action: 'CREATE',
        entityType: 'attendance_adjustment_request',
        entityId: request.request_id,
        newValues: request,
        req,
      });
      res.status(201).json({ message: 'Đã gửi yêu cầu điều chỉnh công', request });
    } catch (error) {
      next(error);
    }
  },

  getMyAdjustments: async (req, res, next) => {
    try {
      const employeeId = getEmployeeIdOrFail(req);
      const result = await Attendance.getAdjustmentRequests({
        page: Math.max(1, Number(req.query.page) || 1),
        limit: Math.min(200, Math.max(1, Number(req.query.limit) || 20)),
        employee_id: employeeId,
        status: req.query.status || undefined,
        from_date: req.query.from_date || undefined,
        to_date: req.query.to_date || undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = staffAttendanceController;
