const { pool } = require('../config/db');

const Employee = {
  findAll: async (page = 1, limit = 10, status) => {
    let query = `SELECT e.*, p.position_name, p.position_id
                 FROM employees e
                 LEFT JOIN employee_positions ep ON e.employee_id = ep.employee_id AND ep.end_date IS NULL
                 LEFT JOIN positions p ON ep.position_id = p.position_id`;
    let countQuery = 'SELECT COUNT(*) as total FROM employees';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' WHERE e.status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
      countParams.push(status);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY e.full_name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { employees: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT e.*, p.position_name, p.position_id
       FROM employees e
       LEFT JOIN employee_positions ep ON e.employee_id = ep.employee_id AND ep.end_date IS NULL
       LEFT JOIN positions p ON ep.position_id = p.position_id
       WHERE e.employee_id = ?`,
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const { full_name, email, phone, address, gender, date_of_birth, hire_date, base_salary } = data;
    const [result] = await pool.query(
      `INSERT INTO employees (full_name, email, phone, address, gender, date_of_birth, hire_date, base_salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone || null, address || null, gender || 'Nam', date_of_birth || null, hire_date, base_salary || 0]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const { full_name, email, phone, address, gender, date_of_birth, hire_date, base_salary, status } = data;
    const [result] = await pool.query(
      `UPDATE employees SET full_name = ?, email = ?, phone = ?, address = ?, gender = ?, date_of_birth = ?, hire_date = ?, base_salary = ?, status = ?
       WHERE employee_id = ?`,
      [full_name, email, phone, address, gender, date_of_birth, hire_date, base_salary, status, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM employees WHERE employee_id = ?', [id]);
    return result.affectedRows;
  },

  // Lịch sử chức vụ
  getPositionHistory: async (employeeId) => {
    const [rows] = await pool.query(
      `SELECT ep.*, p.position_name
       FROM employee_positions ep
       JOIN positions p ON ep.position_id = p.position_id
       WHERE ep.employee_id = ?
       ORDER BY ep.effective_date DESC`,
      [employeeId]
    );
    return rows;
  },

  // Gán chức vụ mới
  assignPosition: async ({ employee_id, position_id, effective_date, salary_at_time, note }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Kết thúc chức vụ hiện tại
      await connection.query(
        `UPDATE employee_positions SET end_date = ? WHERE employee_id = ? AND end_date IS NULL`,
        [effective_date, employee_id]
      );

      // Gán chức vụ mới
      await connection.query(
        `INSERT INTO employee_positions (employee_id, position_id, effective_date, salary_at_time, note) VALUES (?, ?, ?, ?, ?)`,
        [employee_id, position_id, effective_date, salary_at_time, note || null]
      );

      // Cập nhật base_salary cho employee
      await connection.query(
        'UPDATE employees SET base_salary = ? WHERE employee_id = ?',
        [salary_at_time, employee_id]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = Employee;
