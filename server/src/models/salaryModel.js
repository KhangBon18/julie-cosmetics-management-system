const { pool } = require('../config/db');
const SalaryBonus = require('./salaryBonusModel');

const Salary = {
  findAll: async ({ page = 1, limit = 10, month, year, employee_id, status }) => {
    const bonusTableReady = await SalaryBonus.hasTable();
    let query = bonusTableReady
      ? `SELECT s.*, e.full_name as employee_name, sba.reason as bonus_reason
         FROM salaries s
         JOIN employees e ON s.employee_id = e.employee_id
         LEFT JOIN salary_bonus_adjustments sba
           ON sba.employee_id = s.employee_id
          AND sba.month = s.month
          AND sba.year = s.year
         WHERE 1=1`
      : `SELECT s.*, e.full_name as employee_name, NULL as bonus_reason
         FROM salaries s
         JOIN employees e ON s.employee_id = e.employee_id
         WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM salaries WHERE 1=1';
    const params = [];
    const countParams = [];

    if (month) {
      query += ' AND s.month = ?';
      countQuery += ' AND month = ?';
      params.push(month);
      countParams.push(month);
    }
    if (year) {
      query += ' AND s.year = ?';
      countQuery += ' AND year = ?';
      params.push(year);
      countParams.push(year);
    }
    if (employee_id) {
      query += ' AND s.employee_id = ?';
      countQuery += ' AND employee_id = ?';
      params.push(employee_id);
      countParams.push(employee_id);
    }
    if (status) {
      if (Array.isArray(status)) {
        const placeholders = status.map(() => '?').join(',');
        query += ` AND s.status IN (${placeholders})`;
        countQuery += ` AND status IN (${placeholders})`;
        params.push(...status);
        countParams.push(...status);
      } else {
        query += ' AND s.status = ?';
        countQuery += ' AND status = ?';
        params.push(status);
        countParams.push(status);
      }
    }

    query += ' ORDER BY s.year DESC, s.month DESC, e.full_name ASC';

    if (limit !== 'all') {
      const numericLimit = Number(limit) || 10;
      const offset = (page - 1) * numericLimit;
      query += ' LIMIT ? OFFSET ?';
      params.push(numericLimit, offset);
    }

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { salaries: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const bonusTableReady = await SalaryBonus.hasTable();
    const [rows] = await pool.query(
      bonusTableReady
        ? `SELECT s.*, e.full_name as employee_name, sba.reason as bonus_reason
           FROM salaries s
           JOIN employees e ON s.employee_id = e.employee_id
           LEFT JOIN salary_bonus_adjustments sba
             ON sba.employee_id = s.employee_id
            AND sba.month = s.month
            AND sba.year = s.year
           WHERE s.salary_id = ?`
        : `SELECT s.*, e.full_name as employee_name, NULL as bonus_reason
           FROM salaries s
           JOIN employees e ON s.employee_id = e.employee_id
           WHERE s.salary_id = ?`,
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const {
      payroll_period_id, employee_id, month, year,
      work_days_standard, work_days_actual, paid_leave_days, absent_days, unpaid_leave_days,
      total_late_minutes, total_early_leave_minutes, total_overtime_minutes,
      overtime_amount, allowance_amount, late_penalty_amount, early_leave_penalty_amount,
      daily_rate, hourly_rate, minute_rate, unpaid_leave_deduction, absence_deduction, other_deduction_amount, calculation_details,
      base_salary, gross_salary, bonus, deductions, net_salary,
      status, notes, generated_by
    } = data;
    const [result] = await pool.query(
      `INSERT INTO salaries (
        payroll_period_id, employee_id, month, year,
        work_days_standard, work_days_actual, paid_leave_days, absent_days, unpaid_leave_days,
        total_late_minutes, total_early_leave_minutes, total_overtime_minutes,
        overtime_amount, allowance_amount, late_penalty_amount, early_leave_penalty_amount,
        daily_rate, hourly_rate, minute_rate, unpaid_leave_deduction, absence_deduction, other_deduction_amount, calculation_details,
        base_salary, gross_salary, bonus, deductions, net_salary,
        status, notes, generated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payroll_period_id || null, employee_id, month, year,
        work_days_standard || 22, work_days_actual, paid_leave_days || 0, absent_days || 0, unpaid_leave_days || 0,
        total_late_minutes || 0, total_early_leave_minutes || 0, total_overtime_minutes || 0,
        overtime_amount || 0, allowance_amount || 0, late_penalty_amount || 0, early_leave_penalty_amount || 0,
        daily_rate || 0, hourly_rate || 0, minute_rate || 0, unpaid_leave_deduction || 0, absence_deduction || 0, other_deduction_amount || 0, calculation_details ? JSON.stringify(calculation_details) : null,
        base_salary, gross_salary, bonus || 0, deductions || 0, net_salary,
        status || 'draft', notes || null, generated_by || null
      ]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const { work_days_actual, unpaid_leave_days, base_salary, gross_salary, bonus, deductions, net_salary, notes } = data;
    const [result] = await pool.query(
      `UPDATE salaries SET work_days_actual = ?, unpaid_leave_days = ?, base_salary = ?, gross_salary = ?, bonus = ?, deductions = ?, net_salary = ?, notes = ?
       WHERE salary_id = ?`,
      [work_days_actual, unpaid_leave_days, base_salary, gross_salary, bonus, deductions, net_salary, notes, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM salaries WHERE salary_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Salary;
