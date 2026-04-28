const { pool } = require('../config/db');

const PayrollModel = {
  /* ── Attendance Periods ─────────────────────────────────── */

  findAllPeriods: async () => {
    const [rows] = await pool.query(
      `SELECT ap.*, u.username AS locked_by_name
       FROM attendance_periods ap
       LEFT JOIN users u ON ap.locked_by = u.user_id
       ORDER BY ap.year DESC, ap.month DESC`
    );
    return rows;
  },

  findPeriodById: async (periodId) => {
    const [rows] = await pool.query(
      `SELECT ap.*, u.username AS locked_by_name
       FROM attendance_periods ap
       LEFT JOIN users u ON ap.locked_by = u.user_id
       WHERE ap.period_id = ?`,
      [periodId]
    );
    return rows[0] || null;
  },

  findPeriodByMonth: async (month, year) => {
    const [rows] = await pool.query(
      'SELECT * FROM attendance_periods WHERE month = ? AND year = ?',
      [month, year]
    );
    return rows[0] || null;
  },

  getPeriodForDate: async (workDate) => {
    const d = new Date(workDate);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return PayrollModel.findPeriodByMonth(month, year);
  },

  createAttendancePeriod: async ({ month, year, note }) => {
    const lastDay = new Date(year, month, 0).getDate();
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const [result] = await pool.query(
      `INSERT INTO attendance_periods (month, year, start_date, end_date, status, note)
       VALUES (?, ?, ?, ?, 'open', ?)`,
      [month, year, startDate, endDate, note || null]
    );
    return PayrollModel.findPeriodById(result.insertId);
  },

  lockAttendancePeriod: async (periodId, userId) => {
    const period = await PayrollModel.findPeriodById(periodId);
    if (!period) throw Object.assign(new Error('Không tìm thấy kỳ công'), { status: 404 });
    if (period.status === 'locked') throw Object.assign(new Error('Kỳ công đã chốt rồi'), { status: 409 });

    await pool.query(
      `UPDATE attendance_periods SET status = 'locked', locked_by = ?, locked_at = NOW() WHERE period_id = ?`,
      [userId, periodId]
    );
    return PayrollModel.findPeriodById(periodId);
  },

  unlockAttendancePeriod: async (periodId) => {
    const period = await PayrollModel.findPeriodById(periodId);
    if (!period) throw Object.assign(new Error('Không tìm thấy kỳ công'), { status: 404 });
    if (period.status === 'open') throw Object.assign(new Error('Kỳ công đang mở, không cần mở chốt'), { status: 409 });

    await pool.query(
      `UPDATE attendance_periods SET status = 'open', locked_by = NULL, locked_at = NULL WHERE period_id = ?`,
      [periodId]
    );
    return PayrollModel.findPeriodById(periodId);
  },

  /* ── Payroll Periods ────────────────────────────────────── */

  findAllPayrollPeriods: async () => {
    const [rows] = await pool.query(
      `SELECT pp.*,
              uc.username AS calculated_by_name,
              ua.username AS approved_by_name,
              up.username AS paid_by_name,
              ul.username AS locked_by_name,
              ap.status AS attendance_period_status
       FROM payroll_periods pp
       LEFT JOIN users uc ON pp.calculated_by = uc.user_id
       LEFT JOIN users ua ON pp.approved_by = ua.user_id
       LEFT JOIN users up ON pp.paid_by = up.user_id
       LEFT JOIN users ul ON pp.locked_by = ul.user_id
       LEFT JOIN attendance_periods ap ON pp.attendance_period_id = ap.period_id
       ORDER BY pp.year DESC, pp.month DESC`
    );
    return rows;
  },

  findPayrollPeriodById: async (periodId) => {
    const [rows] = await pool.query(
      `SELECT pp.*,
              uc.username AS calculated_by_name,
              ua.username AS approved_by_name,
              up.username AS paid_by_name,
              ul.username AS locked_by_name,
              ap.status AS attendance_period_status
       FROM payroll_periods pp
       LEFT JOIN users uc ON pp.calculated_by = uc.user_id
       LEFT JOIN users ua ON pp.approved_by = ua.user_id
       LEFT JOIN users up ON pp.paid_by = up.user_id
       LEFT JOIN users ul ON pp.locked_by = ul.user_id
       LEFT JOIN attendance_periods ap ON pp.attendance_period_id = ap.period_id
       WHERE pp.period_id = ?`,
      [periodId]
    );
    return rows[0] || null;
  },

  findPayrollPeriodByMonth: async (month, year) => {
    const [rows] = await pool.query(
      'SELECT * FROM payroll_periods WHERE month = ? AND year = ?',
      [month, year]
    );
    return rows[0] || null;
  },

  createPayrollPeriod: async ({ month, year, note }) => {
    const attPeriod = await PayrollModel.findPeriodByMonth(month, year);
    const [result] = await pool.query(
      `INSERT INTO payroll_periods (month, year, attendance_period_id, status, note)
       VALUES (?, ?, ?, 'draft', ?)`,
      [month, year, attPeriod?.period_id || null, note || null]
    );
    return PayrollModel.findPayrollPeriodById(result.insertId);
  },

  updatePayrollPeriodTotals: async (periodId) => {
    await pool.query(
      `UPDATE payroll_periods pp SET
        total_employees = (SELECT COUNT(*) FROM salaries WHERE payroll_period_id = ?),
        total_gross = (SELECT COALESCE(SUM(gross_salary), 0) FROM salaries WHERE payroll_period_id = ?),
        total_net = (SELECT COALESCE(SUM(net_salary), 0) FROM salaries WHERE payroll_period_id = ?)
       WHERE pp.period_id = ?`,
      [periodId, periodId, periodId, periodId]
    );
  },

  transitionPayrollPeriod: async (periodId, targetStatus, userId) => {
    const period = await PayrollModel.findPayrollPeriodById(periodId);
    if (!period) throw Object.assign(new Error('Không tìm thấy kỳ lương'), { status: 404 });

    const allowed = {
      draft: ['calculated'],
      calculated: ['draft', 'approved'],
      approved: ['calculated', 'paid'],
      paid: ['approved', 'locked'],
      locked: ['paid'],
    };

    if (!allowed[period.status]?.includes(targetStatus)) {
      throw Object.assign(
        new Error(`Không thể chuyển từ trạng thái "${period.status}" sang "${targetStatus}"`),
        { status: 409 }
      );
    }

    const updates = { status: targetStatus };
    if (targetStatus === 'calculated') { updates.calculated_by = userId; updates.calculated_at = new Date(); }
    if (targetStatus === 'approved') { updates.approved_by = userId; updates.approved_at = new Date(); }
    if (targetStatus === 'paid') { updates.paid_by = userId; updates.paid_at = new Date(); }
    if (targetStatus === 'locked') { updates.locked_by = userId; updates.locked_at = new Date(); }
    // If reverting, clear downstream timestamps
    if (targetStatus === 'draft') {
      updates.calculated_by = null; updates.calculated_at = null;
      updates.approved_by = null; updates.approved_at = null;
    }
    if (targetStatus === 'calculated') {
      updates.approved_by = null; updates.approved_at = null;
      updates.paid_by = null; updates.paid_at = null;
    }

    const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    await pool.query(`UPDATE payroll_periods SET ${setClauses} WHERE period_id = ?`, [...values, periodId]);

    return PayrollModel.findPayrollPeriodById(periodId);
  },

  /* ── Payroll Records (salaries) ─────────────────────────── */

  findPayrollRecords: async (periodId) => {
    const [rows] = await pool.query(
      `SELECT s.*, e.full_name AS employee_name
       FROM salaries s
       JOIN employees e ON s.employee_id = e.employee_id
       WHERE s.payroll_period_id = ?
       ORDER BY e.full_name ASC`,
      [periodId]
    );
    return rows;
  },

  findPayrollRecordById: async (salaryId) => {
    const [rows] = await pool.query(
      `SELECT s.*, e.full_name AS employee_name
       FROM salaries s
       JOIN employees e ON s.employee_id = e.employee_id
       WHERE s.salary_id = ?`,
      [salaryId]
    );
    return rows[0] || null;
  },

  deletePayrollRecordsByPeriod: async (periodId) => {
    // Also deletes payroll_adjustments via CASCADE
    await pool.query('DELETE FROM salaries WHERE payroll_period_id = ?', [periodId]);
  },

  /* ── Payroll Adjustments ────────────────────────────────── */

  findAdjustmentsBySalary: async (salaryId) => {
    const [rows] = await pool.query(
      `SELECT pa.*, u.username AS created_by_name
       FROM payroll_adjustments pa
       LEFT JOIN users u ON pa.created_by = u.user_id
       WHERE pa.salary_id = ?
       ORDER BY pa.created_at ASC`,
      [salaryId]
    );
    return rows;
  },

  createAdjustment: async ({ salary_id, type, title, amount, note, created_by }) => {
    const [result] = await pool.query(
      `INSERT INTO payroll_adjustments (salary_id, type, title, amount, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [salary_id, type, title, amount, note || null, created_by || null]
    );

    // Recalculate salary totals
    await PayrollModel.recalcSalaryFromAdjustments(salary_id);

    const [rows] = await pool.query('SELECT * FROM payroll_adjustments WHERE adjustment_id = ?', [result.insertId]);
    return rows[0];
  },

  deleteAdjustment: async (adjustmentId) => {
    const [rows] = await pool.query('SELECT * FROM payroll_adjustments WHERE adjustment_id = ?', [adjustmentId]);
    if (!rows[0]) return null;

    const salaryId = rows[0].salary_id;
    await pool.query('DELETE FROM payroll_adjustments WHERE adjustment_id = ?', [adjustmentId]);
    await PayrollModel.recalcSalaryFromAdjustments(salaryId);
    return rows[0];
  },

  recalcSalaryFromAdjustments: async (salaryId) => {
    const [adjRows] = await pool.query(
      `SELECT type, COALESCE(SUM(amount), 0) AS total
       FROM payroll_adjustments WHERE salary_id = ? GROUP BY type`,
      [salaryId]
    );

    let allowanceAmount = 0;
    let bonusAmount = 0;
    let deductionAmount = 0;

    for (const row of adjRows) {
      const total = Number(row.total);
      if (row.type === 'allowance') allowanceAmount += total;
      else if (row.type === 'bonus') bonusAmount += total;
      else deductionAmount += total; // deduction, fine, other
    }

    // Re-read salary to get base values
    const [salaryRows] = await pool.query(
      'SELECT base_salary, overtime_amount, late_penalty_amount, early_leave_penalty_amount, work_days_actual, work_days_standard, unpaid_leave_days FROM salaries WHERE salary_id = ?',
      [salaryId]
    );
    if (!salaryRows[0]) return;

    const s = salaryRows[0];
    const dailyRate = Number(s.base_salary) / Math.max(Number(s.work_days_standard), 1);
    const unpaidDeduction = dailyRate * Number(s.unpaid_leave_days);
    const grossSalary = Number(s.base_salary) + Number(s.overtime_amount) + allowanceAmount + bonusAmount;
    const totalDeductions = unpaidDeduction + Number(s.late_penalty_amount) + Number(s.early_leave_penalty_amount) + deductionAmount;
    const netSalary = Math.round(grossSalary - totalDeductions);

    await pool.query(
      `UPDATE salaries SET
        allowance_amount = ?, bonus = ?, deductions = ?,
        gross_salary = ?, net_salary = ?
       WHERE salary_id = ?`,
      [allowanceAmount, bonusAmount, Math.round(totalDeductions), Math.round(grossSalary), netSalary, salaryId]
    );
  },
};

module.exports = PayrollModel;
