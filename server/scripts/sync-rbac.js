const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { pool } = require('../src/config/db');
const { syncSystemRolePermissions } = require('../src/utils/rbacSync');

async function main() {
  const connection = await pool.getConnection();

  try {
    const summary = await syncSystemRolePermissions(connection, { replaceExisting: true });
    console.log('✅ RBAC system roles synchronized.');
    summary.forEach((item) => {
      console.log(`- ${item.roleName}: ${item.permissionCount} permissions`);
    });
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('❌ Failed to synchronize RBAC:', error.message);
  process.exit(1);
});
