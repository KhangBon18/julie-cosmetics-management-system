const { pool } = require('../config/db');
const SalaryBonus = require('./salaryBonusModel');

const Salary = {
  findAll: async ({ page = 1, limit = 10, month, year, employee_id }) => {
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
    const { employee_id, month, year, work_days_standard, work_days_actual, unpaid_leave_days, base_salary, gross_salary, bonus, deductions, net_salary, notes, generated_by } = data;
    const [result] = await pool.query(
      `INSERT INTO salaries (employee_id, month, year, work_days_standard, work_days_actual, unpaid_leave_days, base_salary, gross_salary, bonus, deductions, net_salary, notes, generated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, month, year, work_days_standard || 22, work_days_actual, unpaid_leave_days || 0, base_salary, gross_salary, bonus || 0, deductions || 0, net_salary, notes || null, generated_by || null]
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
