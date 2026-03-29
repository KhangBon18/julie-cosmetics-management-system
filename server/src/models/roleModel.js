const { pool } = require('../config/db');

const Role = {
  findAll: async () => {
    const [rows] = await pool.query(
      'SELECT r.*, (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.role_id) as permission_count FROM roles r ORDER BY r.role_id'
    );
    return rows;
  },

  findById: async (id) => {
    const [roles] = await pool.query('SELECT * FROM roles WHERE role_id = ?', [id]);
    if (!roles[0]) return null;

    // Get permissions for this role
    const [permissions] = await pool.query(
      `SELECT p.* FROM permissions p
       JOIN role_permissions rp ON p.permission_id = rp.permission_id
       WHERE rp.role_id = ?
       ORDER BY p.module, p.action`,
      [id]
    );

    return { ...roles[0], permissions };
  },

  create: async ({ role_name, description }) => {
    const [result] = await pool.query(
      'INSERT INTO roles (role_name, description) VALUES (?, ?)',
      [role_name, description || null]
    );
    return result.insertId;
  },

  update: async (id, { role_name, description }) => {
    const [result] = await pool.query(
      'UPDATE roles SET role_name = ?, description = ? WHERE role_id = ? AND is_system = FALSE',
      [role_name, description, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    // System roles cannot be deleted
    const [result] = await pool.query(
      'DELETE FROM roles WHERE role_id = ? AND is_system = FALSE',
      [id]
    );
    return result.affectedRows;
  },

  // Set permissions for a role (replace all)
  setPermissions: async (roleId, permissionIds) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      if (permissionIds.length > 0) {
        const values = permissionIds.map(pid => [roleId, pid]);
        await connection.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get all permissions (for admin UI)
  getAllPermissions: async () => {
    const [rows] = await pool.query('SELECT * FROM permissions ORDER BY module, action');
    return rows;
  },

  // Check if a user has a specific permission
  userHasPermission: async (userId, permissionName) => {
    const [rows] = await pool.query(
      `SELECT 1 FROM users u
       JOIN role_permissions rp ON u.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE u.user_id = ? AND p.permission_name = ?
       LIMIT 1`,
      [userId, permissionName]
    );
    return rows.length > 0;
  },

  // Get all permissions for a user
  getUserPermissions: async (userId) => {
    const [rows] = await pool.query(
      `SELECT p.permission_name, p.module, p.action
       FROM users u
       JOIN role_permissions rp ON u.role_id = rp.role_id
       JOIN permissions p ON rp.permission_id = p.permission_id
       WHERE u.user_id = ?
       ORDER BY p.module, p.action`,
      [userId]
    );
    return rows;
  }
};

module.exports = Role;
