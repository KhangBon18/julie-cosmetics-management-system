const { pool } = require('../config/db');

// ─── Check if RBAC columns exist (cached) ───
let _rbacReady = null;
const checkRbacReady = async () => {
  if (_rbacReady !== null) return _rbacReady;
  try {
    await pool.query('SELECT role_id FROM users LIMIT 0');
    await pool.query('SELECT role_id FROM roles LIMIT 0');
    _rbacReady = true;
  } catch {
    _rbacReady = false;
  }
  return _rbacReady;
};

const User = {
  // Tìm user theo username
  findByUsername: async (username) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL', [username]);
    return rows[0];
  },

  // Tìm user theo ID (kèm role info nếu RBAC tables tồn tại)
  findById: async (id) => {
    const rbac = await checkRbacReady();
    if (rbac) {
      const [rows] = await pool.query(
        `SELECT u.user_id, u.username, u.role, u.role_id, u.employee_id, u.is_active, u.last_login, u.created_at,
                e.full_name, e.email, e.phone,
                r.role_name, r.is_system AS role_is_system
         FROM users u
         LEFT JOIN employees e ON u.employee_id = e.employee_id
         LEFT JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = ? AND u.deleted_at IS NULL`,
        [id]
      );
      return rows[0];
    }
    // Fallback: no RBAC columns yet
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.role, u.employee_id, u.is_active, u.last_login, u.created_at,
              e.full_name, e.email, e.phone
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.employee_id
       WHERE u.user_id = ? AND u.deleted_at IS NULL`,
      [id]
    );
    return rows[0];
  },

  // Tạo user mới
  create: async (userData) => {
    const rbac = await checkRbacReady();
    const { username, password_hash, role, role_id, employee_id } = userData;
    if (rbac) {
      const [result] = await pool.query(
        'INSERT INTO users (username, password_hash, role, role_id, employee_id) VALUES (?, ?, ?, ?, ?)',
        [username, password_hash, role || 'staff', role_id || null, employee_id || null]
      );
      return result.insertId;
    }
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, role, employee_id) VALUES (?, ?, ?, ?)',
      [username, password_hash, role || 'staff', employee_id || null]
    );
    return result.insertId;
  },

  // Cập nhật user
  update: async (id, userData) => {
    const rbac = await checkRbacReady();
    const { username, role, role_id, employee_id, is_active } = userData;
    if (rbac) {
      const [result] = await pool.query(
        'UPDATE users SET username = ?, role = ?, role_id = ?, employee_id = ?, is_active = ? WHERE user_id = ?',
        [username, role, role_id || null, employee_id, is_active, id]
      );
      return result.affectedRows;
    }
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
    const rbac = await checkRbacReady();
    const offset = (page - 1) * limit;
    if (rbac) {
      const [rows] = await pool.query(
        `SELECT u.user_id, u.username, u.role, u.role_id, u.employee_id, u.is_active, u.last_login, u.created_at,
                e.full_name, e.email,
                r.role_name
         FROM users u
         LEFT JOIN employees e ON u.employee_id = e.employee_id
         LEFT JOIN roles r ON u.role_id = r.role_id
         WHERE u.deleted_at IS NULL
         ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL');
      return { users: rows, total: countResult[0].total };
    }
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.role, u.employee_id, u.is_active, u.last_login, u.created_at,
              e.full_name, e.email
       FROM users u
       LEFT JOIN employees e ON u.employee_id = e.employee_id
       WHERE u.deleted_at IS NULL
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL');
    return { users: rows, total: countResult[0].total };
  },

  // Xóa user (soft delete)
  delete: async (id) => {
    const [result] = await pool.query(
      'UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE user_id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows;
  },

  // Toggle active status
  toggleActive: async (id, isActive) => {
    const [result] = await pool.query('UPDATE users SET is_active = ? WHERE user_id = ?', [isActive, id]);
    return result.affectedRows;
  },

  // Reset RBAC ready cache (called after migrations)
  resetRbacCache: () => { _rbacReady = null; },
};

module.exports = User;
