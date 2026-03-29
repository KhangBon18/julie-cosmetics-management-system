-- ============================================================
-- Migration 008: Create audit_logs table
-- Priority: HIGH (H-04) — Phase 1
-- Risk: LOW (new table, no existing data affected)
-- Downtime: NO
-- Backup: Not required
-- Backend sync: REQUIRED — add audit logging middleware/utility
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE audit_logs (
  log_id       BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id      INT            NULL COMMENT 'Staff user_id or NULL for system actions',
  user_type    ENUM('staff','customer','system') NOT NULL DEFAULT 'staff',
  action       VARCHAR(50)    NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT',
  entity_type  VARCHAR(50)    NOT NULL COMMENT 'invoice, product, employee, customer, etc.',
  entity_id    INT            NULL COMMENT 'PK of affected record',
  old_values   JSON           NULL COMMENT 'State before change (for UPDATE/DELETE)',
  new_values   JSON           NULL COMMENT 'State after change (for CREATE/UPDATE)',
  ip_address   VARCHAR(45)    NULL COMMENT 'Client IP (supports IPv6)',
  user_agent   VARCHAR(500)   NULL COMMENT 'Browser/client user agent',
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  -- Indexes for common query patterns
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_user (user_id, created_at),
  INDEX idx_audit_action (action, created_at),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB COMMENT='System-wide audit trail for all data changes';

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS audit_logs;

-- ── NOTES ──────────────────────────────────────────────────────
-- • This table will grow fast. Plan for partitioning by month
--   or archival strategy after 6-12 months of production use.
-- • No FK on user_id intentionally — audit logs must survive
--   even if the user account is deleted.
-- • JSON columns store serialized snapshots for forensic analysis.
-- • Backend needs a utility function:
--   async function logAudit({ userId, userType, action, entityType, entityId, oldValues, newValues, req })
--   that inserts into this table on every CUD operation.
-- • Recommended: create an Express middleware that captures IP
--   and user agent from req object.
