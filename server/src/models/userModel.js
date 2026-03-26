const { pool } = require('../config/db');

const User = {
  // Tìm user theo username
  findByUsername: async (username) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  },

  // Tìm user theo ID
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.role, u.employee_id, u.is_active, u.last_login, u.created_at,
              e.full_name, e.email, e.phone
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.employee_id
       WHERE u.user_id = ?`,
      [id]
    );
    return rows[0];
  },

  // Tạo user mới
  create: async (userData) => {
    const { username, password_hash, role, employee_id } = userData;
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)',
      [username, password_hash, role || 'staff', employee_id || null]
    );
    return result.insertId;
  },

  // Cập nhật user
  update: async (id, userData) => {
    const { username, role, employee_id, is_active } = userData;
    const [result] = await pool.query(
      'UPDATE users SET username = ?, role = ?, employee_id = ?, is_active = ? WHERE user_id = ?',
      [username, role, employee_id, is_active, id]
    );
    return result.affectedRows;
  },

  // Cập nhật password
  updatePassword: async (id, hashedPassword) => {
    const [result] = await pool.query(
      'UPDATE users SET password_hash = ? WHERE user_id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows;
  },

  // Cập nhật last_login
  updateLastLogin: async (id) => {
    await pool.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [id]);
  },

  // Lấy tất cả users (admin)
  findAll: async (page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.role, u.employee_id, u.is_active, u.last_login, u.created_at,
              e.full_name, e.email
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.employee_id
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users');
    return { users: rows, total: countResult[0].total };
  },

  // Xóa user
  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [id]);
    return result.affectedRows;
  },

  // Toggle active status
  toggleActive: async (id, isActive) => {
    const [result] = await pool.query('UPDATE users SET is_active = ? WHERE user_id = ?', [isActive, id]);
    return result.affectedRows;
  }
};

module.exports = User;
