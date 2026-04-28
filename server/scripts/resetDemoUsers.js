const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { ensureRoleIdColumn, ensureSystemRoles, syncSystemRolePermissions } = require('../src/utils/rbacSync');

const serverDir = path.join(__dirname, '..');
const projectRoot = path.join(serverDir, '..');

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    Object.assign(process.env, dotenv.parse(fs.readFileSync(filePath)));
  }
};

loadEnv(path.join(projectRoot, '.env'));
loadEnv(path.join(serverDir, '.env'));

if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_RESET) {
  console.error('ERROR: resetDemoUsers is blocked on NODE_ENV=production.');
  console.error('Set ALLOW_DEMO_RESET=1 explicitly to override (demo envs only).');
  process.exit(1);
}

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role_name: 'admin', legacy_role: 'admin', employee_id: null },
  { username: 'manager01', password: 'manager123', role_name: 'manager', legacy_role: 'manager', employee_id: 1 },
  { username: 'staff01', password: 'staff123', role_name: 'staff_portal', legacy_role: 'staff', employee_id: 2 },
  { username: 'sales01', password: 'sales123', role_name: 'sales', legacy_role: 'staff', employee_id: null },
  { username: 'warehouse01', password: 'warehouse123', role_name: 'warehouse', legacy_role: 'warehouse', employee_id: 4 }
];

async function findRoleId(connection, roleName) {
  await ensureSystemRoles(connection);
  const [rows] = await connection.query(
    'SELECT role_id FROM roles WHERE role_name = ? LIMIT 1',
    [roleName]
  );
  return rows[0]?.role_id || null;
}

async function findUserByUsername(connection, username) {
  const [rows] = await connection.query(
    'SELECT user_id, username, employee_id, deleted_at FROM users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

async function findUserByEmployee(connection, employeeId) {
  if (!employeeId) return null;

  const [rows] = await connection.query(
    `SELECT user_id, username, employee_id, deleted_at
     FROM users
     WHERE employee_id = ?
     ORDER BY deleted_at IS NOT NULL, user_id ASC
     LIMIT 1`,
    [employeeId]
  );
  return rows[0] || null;
}

async function releaseEmployeeAssignment(connection, employeeId, keepUserId = null) {
  if (!employeeId) return;

  const params = [employeeId];
  let query = `
    UPDATE users
    SET employee_id = NULL,
        is_active = 0
    WHERE employee_id = ?`;

  if (keepUserId) {
    query += ' AND user_id != ?';
    params.push(keepUserId);
  }

  await connection.query(query, params);
}

async function upsertDemoAccount(connection, account) {
  const passwordHash = await bcrypt.hash(account.password, 10);
  const roleId = await findRoleId(connection, account.role_name);

  const byUsername = await findUserByUsername(connection, account.username);
  if (byUsername) {
    await releaseEmployeeAssignment(connection, account.employee_id, byUsername.user_id);
    await connection.query(
      `UPDATE users
       SET password_hash = ?,
           role = ?,
           role_id = ?,
           employee_id = ?,
           is_active = 1,
           deleted_at = NULL
       WHERE user_id = ?`,
      [passwordHash, account.legacy_role, roleId, account.employee_id, byUsername.user_id]
    );
    return { action: 'updated', target: account.username };
  }

  const byEmployee = await findUserByEmployee(connection, account.employee_id);
  if (byEmployee) {
    await releaseEmployeeAssignment(connection, account.employee_id, byEmployee.user_id);
    await connection.query(
      `UPDATE users
       SET username = ?,
           password_hash = ?,
           role = ?,
           role_id = ?,
           employee_id = ?,
           is_active = 1,
           deleted_at = NULL
       WHERE user_id = ?`,
      [account.username, passwordHash, account.legacy_role, roleId, account.employee_id, byEmployee.user_id]
    );
    return { action: 'renamed', target: `${byEmployee.username} -> ${account.username}` };
  }

  await connection.query(
    `INSERT INTO users (username, password_hash, role, role_id, employee_id, is_active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [account.username, passwordHash, account.legacy_role, roleId, account.employee_id]
  );
  return { action: 'created', target: account.username };
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'julie_cosmetics',
    charset: 'utf8mb4'
  });

  try {
    await connection.beginTransaction();
    console.log('🔐 Resetting demo accounts...\n');
    await ensureRoleIdColumn(connection);
    await ensureSystemRoles(connection);

    for (const account of DEMO_ACCOUNTS) {
      const result = await upsertDemoAccount(connection, account);
      console.log(`- ${account.username}: ${result.action} (${result.target})`);
    }

    const syncedRoles = await syncSystemRolePermissions(connection, { replaceExisting: true });
    syncedRoles.forEach(roleInfo => {
      console.log(`- role ${roleInfo.roleName}: synced ${roleInfo.permissionCount} permissions`);
    });

    const loginAttemptPlaceholders = DEMO_ACCOUNTS.map(() => '?').join(', ');
    await connection.query(
      `DELETE FROM login_attempts WHERE identifier IN (${loginAttemptPlaceholders})`,
      DEMO_ACCOUNTS.map(account => account.username)
    );

    await connection.commit();
    console.log('\n✅ Demo accounts are now synced with README credentials.');
    console.log('   admin / admin123');
    console.log('   manager01 / manager123');
    console.log('   staff01 / staff123');
    console.log('   sales01 / sales123');
    console.log('   warehouse01 / warehouse123');
    console.log('   Core demo permissions have been replaced with the clean system defaults.');
  } catch (error) {
    await connection.rollback();
    console.error('❌ Failed to reset demo accounts:', error.message);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
