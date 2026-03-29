-- ============================================================
-- Migration 004: Add updated_at to all main tables
-- Priority: HIGH (H-02) — Phase 1
-- Risk: LOW (additive columns, auto-populated)
-- Downtime: NO
-- Backup: Recommended
-- Backend sync: No code changes required (ON UPDATE CURRENT_TIMESTAMP
--   fires automatically on any UPDATE query)
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────
-- Only products currently has updated_at.
-- employees gets it in migration 003, so skip here.

ALTER TABLE customers
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE users
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE positions
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE brands
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE categories
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE suppliers
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE invoices
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

ALTER TABLE reviews
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- ── DOWN ───────────────────────────────────────────────────────
-- ALTER TABLE customers DROP COLUMN updated_at;
-- ALTER TABLE users DROP COLUMN updated_at;
-- ALTER TABLE positions DROP COLUMN updated_at;
-- ALTER TABLE brands DROP COLUMN updated_at;
-- ALTER TABLE categories DROP COLUMN updated_at;
-- ALTER TABLE suppliers DROP COLUMN updated_at;
-- ALTER TABLE invoices DROP COLUMN updated_at;
-- ALTER TABLE reviews DROP COLUMN updated_at;

-- ── NOTES ──────────────────────────────────────────────────────
-- • All existing rows will get current timestamp as updated_at value.
-- • No backend changes needed — MySQL handles ON UPDATE automatically.
-- • If API returns these columns, frontend will see them immediately.
