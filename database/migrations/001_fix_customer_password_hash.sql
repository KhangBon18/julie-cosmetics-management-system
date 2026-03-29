-- ============================================================
-- Migration 001: Fix Critical Schema Sync — customers.password_hash
-- Priority: CRITICAL (C-01) — Phase 0
-- Risk: LOW (additive column, no data loss)
-- Downtime: NO
-- Backup: Recommended but not mandatory
-- Backend sync: customerAuthModel.js already uses this column
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────
-- Application code inserts password_hash into customers table
-- but the DDL never defined this column. This fixes the mismatch.

ALTER TABLE customers
  ADD COLUMN password_hash VARCHAR(255) NULL
  COMMENT 'Bcrypt hash. NULL = KH chưa đăng ký tài khoản online'
  AFTER email;

-- ── DOWN ───────────────────────────────────────────────────────
-- ALTER TABLE customers DROP COLUMN password_hash;

-- ── NOTES ──────────────────────────────────────────────────────
-- • NULL default is intentional: existing customers without accounts
--   should not be forced to have a password.
-- • customerAuthModel.js register() already handles this correctly.
-- • If running on a database that already has this column added manually,
--   this migration will fail. Check first:
--   SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'password_hash';
