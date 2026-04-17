const { pool } = require('../config/db');

let _bonusTableReady = null;

const SELECT_FIELDS = `
  SELECT sb.bonus_id, sb.employee_id, sb.month, sb.year, sb.amount, sb.reason,
         sb.created_by, sb.updated_by, sb.created_at, sb.updated_at,
         e.full_name AS employee_name
  FROM salary_bonus_adjustments sb
  JOIN employees e ON sb.employee_id = e.employee_id
`;

const runQuery = (executor, sql, params) => executor.query(sql, params);

const SalaryBonus = {
  hasTable: async (executor = pool) => {
    if (executor === pool && _bonusTableReady !== null) return _bonusTableReady;

    try {
      await runQuery(executor, 'SELECT bonus_id FROM salary_bonus_adjustments LIMIT 0', []);
      if (executor === pool) _bonusTableReady = true;
      return true;
    } catch {
      if (executor === pool) _bonusTableReady = false;
      return false;
    }
  },

  findAll: async ({ month, year, employee_id } = {}) => {
    if (!(await SalaryBonus.hasTable())) return [];

    let query = `${SELECT_FIELDS} WHERE 1=1`;
    const params = [];

    if (month) {
      query += ' AND sb.month = ?';
      params.push(month);
    }
    if (year) {
      query += ' AND sb.year = ?';
      params.push(year);
    }
    if (employee_id) {
      query += ' AND sb.employee_id = ?';
      params.push(employee_id);
    }

    query += ' ORDER BY sb.year DESC, sb.month DESC, e.full_name ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  findById: async (id, executor = pool) => {
    if (!(await SalaryBonus.hasTable(executor))) return null;
    const [rows] = await runQuery(executor, `${SELECT_FIELDS} WHERE sb.bonus_id = ?`, [id]);
    return rows[0] || null;
  },

  findByPeriod: async (employeeId, month, year, executor = pool) => {
    if (!(await SalaryBonus.hasTable(executor))) return null;
    const [rows] = await runQuery(
      executor,
      `${SELECT_FIELDS} WHERE sb.employee_id = ? AND sb.month = ? AND sb.year = ?`,
      [employeeId, month, year]
    );
    return rows[0] || null;
  },

  syncSalaryRow: async (executor, employeeId, month, year, amount) => {
    await runQuery(
      executor,
      `UPDATE salaries
       SET bonus = ?, net_salary = ROUND(gross_salary + ? - deductions, 0)
       WHERE employee_id = ? AND month = ? AND year = ?`,
      [amount, amount, employeeId, month, year]
    );
  },

  upsert: async ({ employee_id, month, year, amount, reason, user_id }) => {
    if (!(await SalaryBonus.hasTable())) {
      const error = new Error('Chức năng thưởng chưa sẵn sàng vì CSDL chưa chạy migration bonus. Hãy chạy migration 032 trước khi cấu hình thưởng.');
      error.status = 503;
      throw error;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `INSERT INTO salary_bonus_adjustments (employee_id, month, year, amount, reason, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           amount = VALUES(amount),
           reason = VALUES(reason),
           updated_by = VALUES(updated_by),
           updated_at = CURRENT_TIMESTAMP`,
        [employee_id, month, year, amount, reason, user_id || null, user_id || null]
      );

      const bonus = await SalaryBonus.findByPeriod(employee_id, month, year, connection);
      await SalaryBonus.syncSalaryRow(connection, employee_id, month, year, amount);

      await connection.commit();
      return bonus;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  delete: async (id) => {
    if (!(await SalaryBonus.hasTable())) return null;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const bonus = await SalaryBonus.findById(id, connection);
      if (!bonus) {
        await connection.rollback();
        return null;
      }

      await connection.query('DELETE FROM salary_bonus_adjustments WHERE bonus_id = ?', [id]);
      await SalaryBonus.syncSalaryRow(connection, bonus.employee_id, bonus.month, bonus.year, 0);

      await connection.commit();
      return bonus;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = SalaryBonus;
