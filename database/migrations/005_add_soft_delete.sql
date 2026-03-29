-- ============================================================
-- Migration 005: Add soft delete (deleted_at) to main tables
-- Priority: HIGH (H-05) — Phase 1
-- Risk: MEDIUM (requires backend query changes)
-- Downtime: NO
-- Backup: Recommended
-- Backend sync: REQUIRED — all findAll/findById queries must add
--   WHERE deleted_at IS NULL
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────
-- employees.deleted_at already added in migration 003, skip here.

ALTER TABLE customers
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE users
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE products
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE suppliers
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

ALTER TABLE brands
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

-- Add index for soft delete filter performance
CREATE INDEX idx_employees_deleted ON employees(deleted_at);
CREATE INDEX idx_customers_deleted ON customers(deleted_at);
CREATE INDEX idx_users_deleted ON users(deleted_at);
CREATE INDEX idx_products_deleted ON products(deleted_at);
CREATE INDEX idx_suppliers_deleted ON suppliers(deleted_at);
CREATE INDEX idx_brands_deleted ON brands(deleted_at);

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP INDEX idx_employees_deleted ON employees;
-- DROP INDEX idx_customers_deleted ON customers;
-- DROP INDEX idx_users_deleted ON users;
-- DROP INDEX idx_products_deleted ON products;
-- DROP INDEX idx_suppliers_deleted ON suppliers;
-- DROP INDEX idx_brands_deleted ON brands;
-- ALTER TABLE customers DROP COLUMN deleted_at;
-- ALTER TABLE users DROP COLUMN deleted_at;
-- ALTER TABLE products DROP COLUMN deleted_at;
-- ALTER TABLE suppliers DROP COLUMN deleted_at;
-- ALTER TABLE brands DROP COLUMN deleted_at;

-- ── NOTES ──────────────────────────────────────────────────────
-- • CRITICAL: After this migration, all backend queries MUST add
--   WHERE deleted_at IS NULL to exclude soft-deleted records.
-- • All delete() model methods must be changed from:
--     DELETE FROM table WHERE id = ?
--   to:
--     UPDATE table SET deleted_at = NOW() WHERE id = ?
-- • Hard delete should only be available to admin via separate endpoint.
-- • Existing data: all deleted_at values will be NULL (no records
--   are soft-deleted yet).
