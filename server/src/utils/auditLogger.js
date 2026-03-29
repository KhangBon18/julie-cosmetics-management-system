const { pool } = require('../config/db');

/**
 * Log an audit trail entry for any data change in the system.
 * Audit failures are caught and logged but never crash the main operation.
 *
 * @param {Object} params
 * @param {number|null} params.userId - Staff user_id or null for system actions
 * @param {string} params.userType - 'staff' | 'customer' | 'system'
 * @param {string} params.action - 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT'
 * @param {string} params.entityType - 'invoice', 'product', 'employee', etc.
 * @param {number|null} params.entityId - PK of affected record
 * @param {Object|null} params.oldValues - State before change
 * @param {Object|null} params.newValues - State after change
 * @param {Object|null} params.req - Express request object (for IP/UA)
 */
const logAudit = async ({ userId, userType = 'staff', action, entityType, entityId, oldValues, newValues, req }) => {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, user_type, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        userType,
        action,
        entityType,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req?.ip || req?.connection?.remoteAddress || null,
        req?.get?.('User-Agent')?.substring(0, 500) || null
      ]
    );
  } catch (error) {
    // Audit failure must never crash the main operation
    console.error('[AuditLog] Failed to write audit log:', error.message);
  }
};

module.exports = { logAudit };
