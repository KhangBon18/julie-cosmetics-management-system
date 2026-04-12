const { pool } = require('../config/db');

const Role = {
  // Lấy tất cả roles kèm số user
  findAll: async () => {
    try {
      const [rows] = await pool.query(
        `SELECT r.*,
                (SELECT COUNT(*) FROM users WHERE role_id = r.role_id AND deleted_at IS NULL) AS user_count
         FROM roles r
         ORDER BY r.role_id`
      );
      return rows;
    } catch {
      return [];
    }
  },

  // Tìm role theo tên (phục vụ map legacy role -> role_id)
  findByName: async (roleName) => {
    const [rows] = await pool.query(
      'SELECT * FROM roles WHERE role_name = ? LIMIT 1',
      [roleName]
    );
    return rows[0] || null;
  },

  // Tìm role theo ID kèm permissions
  findById: async (id) => {
    const [roles] = await pool.query(
      `SELECT r.*,
              (SELECT COUNT(*) FROM users WHERE role_id = r.role_id AND deleted_at IS NULL) AS user_count
       FROM roles r WHERE r.role_id = ?`,
      [id]
    );
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

  // Tạo role mới
  create: async ({ role_name, description }) => {
    const [result] = await pool.query(
      'INSERT INTO roles (role_name, description) VALUES (?, ?)',
      [role_name, description || null]
    );
    return result.insertId;
  },

  // Cập nhật role (chỉ role không phải system)
  update: async (id, { role_name, description }) => {
    const [result] = await pool.query(
      'UPDATE roles SET role_name = ?, description = ? WHERE role_id = ?',
      [role_name, description, id]
    );
    return result.affectedRows;
  },

  // Xóa role (chỉ role không phải system và không có user)
  delete: async (id) => {
    // System roles cannot be deleted
    const [result] = await pool.query(
      'DELETE FROM roles WHERE role_id = ? AND is_system = FALSE',
      [id]
    );
    return result.affectedRows;
  },

  // Đếm số user thuộc role
  getUserCount: async (roleId) => {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS count FROM users WHERE role_id = ? AND deleted_at IS NULL',
      [roleId]
    );
    return rows[0].count;
  },

  // Kiểm tra role có phải system role không
  isSystemRole: async (roleId) => {
    const [rows] = await pool.query(
      'SELECT is_system FROM roles WHERE role_id = ?',
      [roleId]
    );
    return rows[0]?.is_system === 1;
  },

  // Set permissions for a role (replace all)
  setPermissions: async (roleId, permissionIds) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
      if (permissionIds && permissionIds.length > 0) {
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
    try {
      const [rows] = await pool.query(
        `SELECT 1 FROM users u
         JOIN role_permissions rp ON u.role_id = rp.role_id
         JOIN permissions p ON rp.permission_id = p.permission_id
         WHERE u.user_id = ? AND p.permission_name = ?
         LIMIT 1`,
        [userId, permissionName]
      );
      return rows.length > 0;
    } catch {
      return false;
    }
  },

  // Get all permissions for a user
  getUserPermissions: async (userId) => {
    try {
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
    } catch {
      // RBAC tables not yet created — return empty permissions
      return [];
    }
  },

  // Kiểm tra nhóm admin có quyền roles management
  checkAdminSafety: async (roleId, newPermissionIds) => {
    // Nếu đây là role admin system, đảm bảo vẫn giữ quyền roles.read + roles.update
    const [rows] = await pool.query(
      'SELECT role_name, is_system FROM roles WHERE role_id = ?',
      [roleId]
    );
    if (!rows[0]) return { safe: false, reason: 'Role không tồn tại' };

    if (rows[0].role_name === 'admin' && rows[0].is_system) {
      // Check nếu newPermissionIds có bao gồm roles.read & roles.update
      const [requiredPerms] = await pool.query(
        `SELECT permission_id FROM permissions
         WHERE permission_name IN ('roles.read', 'roles.update', 'roles.create', 'roles.delete', 'users.read', 'users.update')`,
      );
      const requiredIds = new Set(requiredPerms.map(p => p.permission_id));
      const hasAll = [...requiredIds].every(id => newPermissionIds.includes(id));
      if (!hasAll) {
        return { safe: false, reason: 'Không thể bỏ quyền quản trị hệ thống khỏi nhóm Admin' };
      }
    }
    return { safe: true };
  }
};

module.exports = Role;
