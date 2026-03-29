-- ============================================================
-- Migration 017: Create login_attempts table
-- Phase 3A — Security & Auth Hardening
-- Risk: LOW (new table, additive)
-- ============================================================

USE julie_cosmetics;

CREATE TABLE login_attempts (
  attempt_id     BIGINT         AUTO_INCREMENT PRIMARY KEY,
  identifier     VARCHAR(100)   NOT NULL COMMENT 'username, phone, or email',
  ip_address     VARCHAR(45)    NOT NULL,
  user_agent     VARCHAR(500)   NULL,
  success        BOOLEAN        NOT NULL DEFAULT FALSE,
  failure_reason VARCHAR(100)   NULL COMMENT 'wrong_password, user_not_found, account_locked, throttled',
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_la_identifier (identifier, created_at),
  INDEX idx_la_ip (ip_address, created_at),
  INDEX idx_la_created (created_at)
) ENGINE=InnoDB COMMENT='Login attempt tracking for brute-force protection';
