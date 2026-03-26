const { pool } = require('../config/db');

const Leave = {
  findAll: async ({ page = 1, limit = 10, employee_id, status }) => {
    let query = `SELECT lr.*, e.full_name as employee_name, u.username as approved_by_name
                 FROM leave_requests lr
                 JOIN employees e ON lr.employee_id = e.employee_id
                 LEFT JOIN users u ON lr.approved_by = u.user_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM leave_requests WHERE 1=1';
    const params = [];
    const countParams = [];

    if (employee_id) {
      query += ' AND lr.employee_id = ?';
      countQuery += ' AND employee_id = ?';
      params.push(employee_id);
      countParams.push(employee_id);
    }

    if (status) {
      query += ' AND lr.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY lr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { leaves: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT lr.*, e.full_name as employee_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.employee_id
       WHERE lr.request_id = ?`,
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const { employee_id, leave_type, start_date, end_date, total_days, reason } = data;
    const [result] = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, leave_type || 'annual', start_date, end_date, total_days || 1, reason]
    );
    return result.insertId;
  },

  approve: async (id, userId) => {
    const [result] = await pool.query(
      `UPDATE leave_requests SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE request_id = ?`,
      [userId, id]
    );
    return result.affectedRows;
  },

  reject: async (id, userId, rejectReason) => {
    const [result] = await pool.query(
      `UPDATE leave_requests SET status = 'rejected', approved_by = ?, approved_at = NOW(), reject_reason = ? WHERE request_id = ?`,
      [userId, rejectReason, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM leave_requests WHERE request_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Leave;
