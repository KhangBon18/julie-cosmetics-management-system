const {
  SYSTEM_ROLE_NAMES,
  getSystemRoleDescription,
  getDefaultPermissionNamesForRole
} = require('../config/defaultRolePermissions');
const { MODULES, ACTION_LABELS } = require('../config/moduleRegistry');

const ensureRoleIdColumn = async (connection) => {
  const [columns] = await connection.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'role_id'
     LIMIT 1`
  );

  if (!columns.length) {
    await connection.query(
      "ALTER TABLE users ADD COLUMN role_id INT NULL COMMENT 'FK to roles table (RBAC)' AFTER role"
    );
  }
};

const ensureSystemRoles = async (connection) => {
  for (const roleName of SYSTEM_ROLE_NAMES) {
    await connection.query(
      `INSERT INTO roles (role_name, description, is_system)
       VALUES (?, ?, TRUE)
       ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         is_system = VALUES(is_system)`,
      [roleName, getSystemRoleDescription(roleName)]
    );
  }
};

const ensureRegistryPermissions = async (connection) => {
  const permissions = [];

  for (const mod of MODULES) {
    for (const action of mod.actions || []) {
      permissions.push([
        `${mod.key}.${action}`,
        mod.key,
        action,
        `${ACTION_LABELS[action] || action} ${mod.name}`,
      ]);
    }
  }

  if (!permissions.length) return;

  await connection.query(
    `INSERT INTO permissions (permission_name, module, action, description)
     VALUES ?
     ON DUPLICATE KEY UPDATE
       module = VALUES(module),
       action = VALUES(action),
       description = VALUES(description)`,
    [permissions]
  );
};

const getRoleIdsByName = async (connection) => {
  const [rows] = await connection.query(
    'SELECT role_id, role_name FROM roles WHERE role_name IN (?)',
    [SYSTEM_ROLE_NAMES]
  );

  return rows.reduce((accumulator, row) => {
    accumulator[row.role_name] = row.role_id;
    return accumulator;
  }, {});
};

const syncSystemRolePermissions = async (connection, options = {}) => {
  const { replaceExisting = true } = options;

  await ensureRoleIdColumn(connection);
  await ensureSystemRoles(connection);
  await ensureRegistryPermissions(connection);

  const [permissions] = await connection.query(
    'SELECT permission_id, permission_name FROM permissions ORDER BY permission_name'
  );
  const permissionIdByName = new Map(
    permissions.map(permission => [permission.permission_name, permission.permission_id])
  );
  const allPermissionNames = permissions.map(permission => permission.permission_name);
  const roleIdsByName = await getRoleIdsByName(connection);

  const summary = [];

  for (const roleName of SYSTEM_ROLE_NAMES) {
    const roleId = roleIdsByName[roleName];
    if (!roleId) {
      continue;
    }

    const expectedPermissionNames = getDefaultPermissionNamesForRole(roleName, allPermissionNames);
    const permissionIds = expectedPermissionNames
      .map(permissionName => permissionIdByName.get(permissionName))
      .filter(Boolean);

    if (replaceExisting) {
      await connection.query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    }

    if (permissionIds.length > 0) {
      await connection.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
        [permissionIds.map(permissionId => [roleId, permissionId])]
      );
    }

    summary.push({
      roleName,
      roleId,
      permissionCount: permissionIds.length
    });
  }

  return summary;
};

module.exports = {
  ensureRoleIdColumn,
  ensureSystemRoles,
  ensureRegistryPermissions,
  syncSystemRolePermissions
};
