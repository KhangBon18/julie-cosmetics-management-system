-- ============================================================
-- Migration 016: Create refresh_tokens table
-- Phase 3A — Security & Auth Hardening
-- Risk: LOW (new table, additive)
-- ============================================================

USE julie_cosmetics;

CREATE TABLE refresh_tokens (
  token_id    BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id     INT            NOT NULL,
  user_type   ENUM('staff','customer') NOT NULL DEFAULT 'staff',
  token_hash  VARCHAR(255)   NOT NULL UNIQUE COMMENT 'SHA-256 hash of refresh token',
  device_info VARCHAR(255)   NULL COMMENT 'Browser/device fingerprint',
  ip_address  VARCHAR(45)    NULL,
  expires_at  TIMESTAMP      NOT NULL,
  revoked_at  TIMESTAMP      NULL COMMENT 'NULL = active, SET = revoked',
  created_at  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_rt_user (user_id, user_type, revoked_at),
  INDEX idx_rt_expires (expires_at),
  INDEX idx_rt_hash (token_hash)
) ENGINE=InnoDB COMMENT='JWT refresh tokens for token rotation and revocation';

-- Note: No FK on user_id intentionally — tokens should survive
-- even if user is referenced from either users or customers table.
-- user_type discriminates which table the user_id belongs to.
