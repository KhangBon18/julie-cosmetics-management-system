const { pool } = require('../config/db');

const ACTION_SORT_ORDER = {
  read: 1,
  create: 2,
  update: 3,
  delete: 4,
  export: 5,
};

const isMissingOverrideTableError = (error) => (
  error?.code === 'ER_NO_SUCH_TABLE' || error?.code === 'ER_BAD_TABLE_ERROR'
);

const sortPermissionRows = (rows = []) => [...rows].sort((a, b) => {
  const moduleCompare = String(a.module || '').localeCompare(String(b.module || ''));
  if (moduleCompare !== 0) return moduleCompare;
  const actionCompare = (ACTION_SORT_ORDER[a.action] || 99) - (ACTION_SORT_ORDER[b.action] || 99);
  if (actionCompare !== 0) return actionCompare;
  return String(a.permission_name || '').localeCompare(String(b.permission_name || ''));
});

const getRolePermissionRowsForUser = async (executor, userId) => {
  const [rows] = await executor.query(
    `SELECT p.permission_id, p.permission_name, p.module, p.action, p.description
     FROM users u
     JOIN role_permissions rp ON u.role_id = rp.role_id
     JOIN permissions p ON rp.permission_id = p.permission_id
     WHERE u.user_id = ?
     ORDER BY p.module, p.action`,
    [userId]
  );
  return rows;
};

const getOverridePermissionRowsForUser = async (executor, userId) => {
  try {
    const [rows] = await executor.query(
      `SELECT p.permission_id, p.permission_name, p.module, p.action, p.description, upo.effect
       FROM user_permission_overrides upo
       JOIN permissions p ON upo.permission_id = p.permission_id
       WHERE upo.user_id = ?
       ORDER BY p.module, p.action`,
      [userId]
    );
    return rows;
  } catch (error) {
    if (isMissingOverrideTableError(error)) return [];
    throw error;
  }
};

const mergePermissionRows = (inheritedRows = [], overrideRows = []) => {
  const byId = new Map(inheritedRows.map(row => [row.permission_id, { ...row }]));

  for (const row of overrideRows) {
    if (row.effect === 'deny') {
      byId.delete(row.permission_id);
      continue;
    }

    if (row.effect === 'grant') {
      const { effect, ...permission } = row;
      byId.set(row.permission_id, permission);
    }
  }

  return sortPermissionRows([...byId.values()]);
};

const getPermissionIdsWithRequiredRead = async (executor, permissionIds = []) => {
  const requestedIds = new Set(
    permissionIds
      .map(id => Number(id))
      .filter(id => Number.isInteger(id) && id > 0)
  );

  if (requestedIds.size === 0) return [];

  const [permissions] = await executor.query(
    'SELECT permission_id, module, action FROM permissions'
  );
  const byId = new Map(permissions.map(permission => [permission.permission_id, permission]));
  const readIdByModule = new Map(
    permissions
      .filter(permission => permission.action === 'read')
      .map(permission => [permission.module, permission.permission_id])
  );

  const invalidIds = [...requestedIds].filter(id => !byId.has(id));
  if (invalidIds.length) {
    const error = new Error('Danh sách quyền chứa permission_id không hợp lệ');
    error.status = 400;
    throw error;
  }

  for (const permissionId of [...requestedIds]) {
    const permission = byId.get(permissionId);
    if (permission?.action !== 'read') {
      const readId = readIdByModule.get(permission.module);
      if (readId) requestedIds.add(readId);
    }
  }

  return [...requestedIds];
};

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
      'INSERT INTO roles (role_name, description, is_system) VALUES (?, ?, FALSE)',
      [role_name, description || null]
    );
    return result.insertId;
  },

  // Cập nhật role
  update: async (id, { role_name, description }) => {
    const [roleRows] = await pool.query(
      'SELECT role_name, is_system FROM roles WHERE role_id = ? LIMIT 1',
      [id]
    );
    if (!roleRows[0]) return 0;

    const currentRole = roleRows[0];
    const nextRoleName = currentRole.is_system ? currentRole.role_name : role_name;

    const [result] = await pool.query(
      'UPDATE roles SET role_name = ?, description = ? WHERE role_id = ?',
      [nextRoleName, description, id]
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
      const permissions = await Role.getUserPermissions(userId);
      return permissions.some(permission => permission.permission_name === permissionName);
    } catch {
      return false;
    }
  },

  // Get all permissions for a user
  getUserPermissions: async (userId) => {
    try {
      const inheritedRows = await getRolePermissionRowsForUser(pool, userId);
      const overrideRows = await getOverridePermissionRowsForUser(pool, userId);
      return mergePermissionRows(inheritedRows, overrideRows);
    } catch {
      // RBAC tables not yet created — return empty permissions
      return [];
    }
  },

  getUserPermissionDetails: async (userId) => {
    const inheritedRows = await getRolePermissionRowsForUser(pool, userId);
    const overrideRows = await getOverridePermissionRowsForUser(pool, userId);
    const grantRows = overrideRows.filter(row => row.effect === 'grant');
    const denyRows = overrideRows.filter(row => row.effect === 'deny');
    const effectiveRows = mergePermissionRows(inheritedRows, overrideRows);

    return {
      inherited_permissions: sortPermissionRows(inheritedRows),
      granted_permissions: sortPermissionRows(grantRows),
      denied_permissions: sortPermissionRows(denyRows),
      effective_permissions: effectiveRows,
      inherited_permission_ids: inheritedRows.map(row => row.permission_id),
      granted_permission_ids: grantRows.map(row => row.permission_id),
      denied_permission_ids: denyRows.map(row => row.permission_id),
      effective_permission_ids: effectiveRows.map(row => row.permission_id),
    };
  },

  setUserEffectivePermissions: async (userId, permissionIds) => {
    const connection = await pool.getConnection();
    let committed = false;
    try {
      await connection.beginTransaction();

      const [userRows] = await connection.query(
        'SELECT user_id FROM users WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
        [userId]
      );
      if (!userRows.length) {
        const error = new Error('Không tìm thấy tài khoản');
        error.status = 404;
        throw error;
      }

      const desiredIds = await getPermissionIdsWithRequiredRead(connection, permissionIds);
      const desiredSet = new Set(desiredIds);
      const inheritedRows = await getRolePermissionRowsForUser(connection, userId);
      const inheritedSet = new Set(inheritedRows.map(row => row.permission_id));

      const grantIds = desiredIds.filter(permissionId => !inheritedSet.has(permissionId));
      const denyIds = [...inheritedSet].filter(permissionId => !desiredSet.has(permissionId));

      await connection.query('DELETE FROM user_permission_overrides WHERE user_id = ?', [userId]);

      const values = [
        ...grantIds.map(permissionId => [userId, permissionId, 'grant']),
        ...denyIds.map(permissionId => [userId, permissionId, 'deny']),
      ];

      if (values.length) {
        await connection.query(
          `INSERT INTO user_permission_overrides (user_id, permission_id, effect)
           VALUES ?`,
          [values]
        );
      }

      await connection.commit();
      committed = true;
    } catch (error) {
      if (!committed) {
        await connection.rollback();
      }
      throw error;
    } finally {
      connection.release();
    }

    return Role.getUserPermissionDetails(userId);
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
