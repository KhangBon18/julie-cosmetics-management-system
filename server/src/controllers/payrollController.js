const PayrollModel = require('../models/payrollModel');
const { calculateSalary, calculateAllSalaries } = require('../utils/salaryCalculation');
const Salary = require('../models/salaryModel');
const Setting = require('../models/settingModel');
const { pool } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

const payrollController = {
  /* ── Attendance Periods ──────────────────────────────────── */

  getAttendancePeriods: async (req, res, next) => {
    try {
      const periods = await PayrollModel.findAllPeriods();
      res.json({ periods });
    } catch (error) { next(error); }
  },

  createAttendancePeriod: async (req, res, next) => {
    try {
      const { month, year, note } = req.body;
      if (!month || !year) return res.status(400).json({ message: 'Vui lòng cung cấp month và year' });

      const existing = await PayrollModel.findPeriodByMonth(month, year);
      if (existing) return res.status(409).json({ message: `Kỳ công tháng ${month}/${year} đã tồn tại` });

      const period = await PayrollModel.createAttendancePeriod({ month, year, note });
      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'attendance_period', entityId: period.period_id, newValues: period, req });
      res.status(201).json({ message: 'Tạo kỳ công thành công', period });
    } catch (error) { next(error); }
  },

  lockAttendancePeriod: async (req, res, next) => {
    try {
      const period = await PayrollModel.lockAttendancePeriod(Number(req.params.id), req.user.user_id);
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'attendance_period', entityId: period.period_id, newValues: { action: 'lock', period }, req });
      res.json({ message: 'Đã chốt kỳ công', period });
    } catch (error) { next(error); }
  },

  unlockAttendancePeriod: async (req, res, next) => {
    try {
      const period = await PayrollModel.unlockAttendancePeriod(Number(req.params.id));
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'attendance_period', entityId: period.period_id, newValues: { action: 'unlock', period }, req });
      res.json({ message: 'Đã mở chốt kỳ công', period });
    } catch (error) { next(error); }
  },

  /* ── Payroll Periods ─────────────────────────────────────── */

  getPayrollPeriods: async (req, res, next) => {
    try {
      const periods = await PayrollModel.findAllPayrollPeriods();
      res.json({ periods });
    } catch (error) { next(error); }
  },

  createPayrollPeriod: async (req, res, next) => {
    try {
      const { month, year, note } = req.body;
      if (!month || !year) return res.status(400).json({ message: 'Vui lòng cung cấp month và year' });

      const existing = await PayrollModel.findPayrollPeriodByMonth(month, year);
      if (existing) return res.status(409).json({ message: `Kỳ lương tháng ${month}/${year} đã tồn tại` });

      const period = await PayrollModel.createPayrollPeriod({ month, year, note });
      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'payroll_period', entityId: period.period_id, newValues: period, req });
      res.status(201).json({ message: 'Tạo kỳ lương thành công', period });
    } catch (error) { next(error); }
  },

  calculatePayroll: async (req, res, next) => {
    try {
      const periodId = Number(req.params.id);
      const period = await PayrollModel.findPayrollPeriodById(periodId);
      if (!period) return res.status(404).json({ message: 'Không tìm thấy kỳ lương' });

      if (['approved', 'paid', 'locked'].includes(period.status)) {
        return res.status(409).json({ message: `Không thể tính lại lương khi kỳ đang ở trạng thái "${period.status}"` });
      }

      // Delete existing draft/calculated records for this period (safe: never touch paid/locked)
      await pool.query(
        "DELETE FROM salaries WHERE payroll_period_id = ? AND status IN ('draft','approved')",
        [periodId]
      );
      // Legacy orphan records (no period_id) are from old system — safe to replace
      await pool.query(
        "DELETE FROM salaries WHERE month = ? AND year = ? AND payroll_period_id IS NULL",
        [period.month, period.year]
      );

      // Check attendance period
      const attPeriod = await PayrollModel.findPeriodByMonth(period.month, period.year);
      const warnings = [];
      if (!attPeriod) {
        warnings.push('Chưa tạo kỳ công cho tháng này. Lương sẽ tính từ dữ liệu chấm công chưa chốt.');
      } else if (attPeriod.status === 'open') {
        warnings.push('Kỳ công chưa chốt. Dữ liệu chấm công có thể thay đổi sau khi tính lương.');
      }

      // Calculate salaries for all active employees using new comprehensive engine
      const salaries = await calculateAllSalaries(period.month, period.year);
      let created = 0;
      let errors = [];

      for (const s of salaries) {
        try {
          await Salary.create({
            payroll_period_id: periodId,
            employee_id: s.employee_id,
            month: period.month,
            year: period.year,
            work_days_standard: s.work_days_standard,
            work_days_actual: s.work_days_actual,
            paid_leave_days: s.paid_leave_days,
            absent_days: s.absent_days,
            unpaid_leave_days: s.unpaid_leave_days,
            total_late_minutes: s.total_late_minutes,
            total_early_leave_minutes: s.total_early_leave_minutes,
            total_overtime_minutes: s.total_overtime_minutes,
            overtime_amount: s.overtime_amount,
            allowance_amount: 0,
            late_penalty_amount: s.late_penalty_amount,
            early_leave_penalty_amount: s.early_leave_penalty_amount,
            daily_rate: s.daily_rate,
            hourly_rate: s.hourly_rate,
            minute_rate: s.minute_rate,
            unpaid_leave_deduction: s.unpaid_leave_deduction,
            absence_deduction: s.absence_deduction,
            other_deduction_amount: s.other_deduction_amount,
            calculation_details: s.calculation_details,
            base_salary: s.base_salary,
            gross_salary: s.gross_salary,
            bonus: s.bonus,
            deductions: s.deductions,
            net_salary: s.net_salary,
            status: 'draft',
            notes: s.notes,
            generated_by: req.user.user_id,
          });
          created++;
        } catch (err) {
          errors.push({ employee_id: s.employee_id, employee_name: s.employee_name, error: err.message });
        }
      }

      // Transition to calculated
      await PayrollModel.transitionPayrollPeriod(periodId, 'calculated', req.user.user_id);
      await PayrollModel.updatePayrollPeriodTotals(periodId);

      await logAudit({
        userId: req.user.user_id, action: 'CREATE', entityType: 'payroll_calculation',
        entityId: periodId, newValues: { created, errors: errors.length, warnings }, req,
      });

      const updatedPeriod = await PayrollModel.findPayrollPeriodById(periodId);
      res.json({
        message: `Đã tính lương cho ${created} nhân viên`,
        period: updatedPeriod, created, errors, warnings,
      });
    } catch (error) { next(error); }
  },

  approvePayroll: async (req, res, next) => {
    try {
      const period = await PayrollModel.transitionPayrollPeriod(Number(req.params.id), 'approved', req.user.user_id);
      // Update all salary records status
      await pool.query('UPDATE salaries SET status = ? WHERE payroll_period_id = ?', ['approved', period.period_id]);
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'payroll_period', entityId: period.period_id, newValues: { action: 'approve' }, req });
      res.json({ message: 'Đã duyệt bảng lương', period });
    } catch (error) { next(error); }
  },

  markPaid: async (req, res, next) => {
    try {
      const period = await PayrollModel.transitionPayrollPeriod(Number(req.params.id), 'paid', req.user.user_id);
      await pool.query('UPDATE salaries SET status = ? WHERE payroll_period_id = ?', ['paid', period.period_id]);
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'payroll_period', entityId: period.period_id, newValues: { action: 'mark_paid' }, req });
      res.json({ message: 'Đã đánh dấu thanh toán', period });
    } catch (error) { next(error); }
  },

  lockPayroll: async (req, res, next) => {
    try {
      const period = await PayrollModel.transitionPayrollPeriod(Number(req.params.id), 'locked', req.user.user_id);
      await pool.query('UPDATE salaries SET status = ? WHERE payroll_period_id = ?', ['locked', period.period_id]);
      await logAudit({ userId: req.user.user_id, action: 'UPDATE', entityType: 'payroll_period', entityId: period.period_id, newValues: { action: 'lock' }, req });
      res.json({ message: 'Đã khóa kỳ lương', period });
    } catch (error) { next(error); }
  },

  /* ── Payroll Records ─────────────────────────────────────── */

  getRecords: async (req, res, next) => {
    try {
      const records = await PayrollModel.findPayrollRecords(Number(req.params.id));
      const period = await PayrollModel.findPayrollPeriodById(Number(req.params.id));
      res.json({ records, period });
    } catch (error) { next(error); }
  },

  getRecordById: async (req, res, next) => {
    try {
      const record = await PayrollModel.findPayrollRecordById(Number(req.params.id));
      if (!record) return res.status(404).json({ message: 'Không tìm thấy phiếu lương' });

      // IDOR protection
      const role = req.user.role;
      if (role !== 'admin' && role !== 'manager' && record.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: 'Không có quyền xem phiếu lương của người này' });
      }

      const adjustments = await PayrollModel.findAdjustmentsBySalary(record.salary_id);
      res.json({ record, adjustments });
    } catch (error) { next(error); }
  },

  /* ── Payroll Adjustments ─────────────────────────────────── */

  createAdjustment: async (req, res, next) => {
    try {
      const salaryId = Number(req.params.id);
      const record = await PayrollModel.findPayrollRecordById(salaryId);
      if (!record) return res.status(404).json({ message: 'Không tìm thấy phiếu lương' });

      if (record.status !== 'draft') {
        return res.status(409).json({ message: `Không thể thêm khoản cộng/trừ khi phiếu lương ở trạng thái "${record.status}"` });
      }

      const { type, title, amount, note } = req.body;
      if (!type || !title || amount === undefined) {
        return res.status(400).json({ message: 'Vui lòng cung cấp type, title và amount' });
      }

      const adjustment = await PayrollModel.createAdjustment({
        salary_id: salaryId, type, title, amount: Number(amount), note, created_by: req.user.user_id,
      });

      await logAudit({ userId: req.user.user_id, action: 'CREATE', entityType: 'payroll_adjustment', entityId: adjustment.adjustment_id, newValues: adjustment, req });

      // Update period totals
      if (record.payroll_period_id) await PayrollModel.updatePayrollPeriodTotals(record.payroll_period_id);

      res.status(201).json({ message: 'Đã thêm khoản cộng/trừ', adjustment });
    } catch (error) { next(error); }
  },

  deleteAdjustment: async (req, res, next) => {
    try {
      const adjustment = await PayrollModel.deleteAdjustment(Number(req.params.id));
      if (!adjustment) return res.status(404).json({ message: 'Không tìm thấy khoản cộng/trừ' });

      await logAudit({ userId: req.user.user_id, action: 'DELETE', entityType: 'payroll_adjustment', entityId: req.params.id, oldValues: adjustment, req });
      res.json({ message: 'Đã xóa khoản cộng/trừ' });
    } catch (error) { next(error); }
  },

  exportPayroll: async (req, res, next) => {
    try {
      const periodId = Number(req.params.id);
      const period = await PayrollModel.findPayrollPeriodById(periodId);
      if (!period) return res.status(404).json({ message: 'Không tìm thấy kỳ lương' });

      const records = await PayrollModel.findRecordsByPeriod(periodId);
      const headers = [
        'Mã Lương', 'Nhân viên', 'Lương cơ bản', 'Ngày công chuẩn', 'Ngày công thực tế',
        'Nghỉ có lương', 'Nghỉ không lương', 'Vắng', 'Trễ (phút)', 'Về sớm (phút)',
        'Tăng ca (phút)', 'Tiền tăng ca', 'Thưởng', 'Khấu trừ', 'Gross', 'Net', 'Trạng thái'
      ];

      const csvRows = records.map(r => [
        r.salary_id, r.employee_name, r.base_salary, r.work_days_standard, r.work_days_actual,
        r.paid_leave_days || 0, r.unpaid_leave_days || 0, r.absent_days || 0, r.total_late_minutes || 0, r.total_early_leave_minutes || 0,
        r.total_overtime_minutes || 0, r.overtime_amount || 0, r.bonus || 0, r.deductions || 0, r.gross_salary, r.net_salary, r.status
      ]);

      const csv = '\uFEFF' + [headers, ...csvRows].map(row => row.map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=BangLuong_T${period.month}_${period.year}.csv`);
      res.send(csv);
    } catch (error) { next(error); }
  },
};

module.exports = payrollController;
