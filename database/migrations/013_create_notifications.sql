-- ============================================================
-- Migration 013: Create notifications table
-- Priority: P2-04 — Phase 2
-- Risk: LOW (new table)
-- Downtime: NO
-- Backup: Not required
-- Backend sync: New model/routes/controller needed
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE notifications (
  notification_id  BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id          INT            NULL COMMENT 'Target user. NULL = system broadcast',
  user_type        ENUM('staff','customer') NOT NULL DEFAULT 'staff',
  title            VARCHAR(200)   NOT NULL,
  message          TEXT           NOT NULL,
  type             ENUM('info','warning','success','error') NOT NULL DEFAULT 'info',
  is_read          BOOLEAN        NOT NULL DEFAULT FALSE,
  link             VARCHAR(500)   NULL COMMENT 'Deep link tới trang liên quan',
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notif_user (user_id, user_type, is_read),
  INDEX idx_notif_created (created_at),
  INDEX idx_notif_unread (user_id, is_read, created_at)
) ENGINE=InnoDB COMMENT='Thông báo cho staff và customer';

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS notifications;

-- ── NOTES ──────────────────────────────────────────────────────
-- • No FK on user_id intentionally — notifications should survive
--   even if the user is soft-deleted.
-- • user_type separates staff vs customer notification channels.
-- • link field enables click-to-navigate from notification panel.
-- • Cleanup: DELETE old notifications periodically (> 90 days).
