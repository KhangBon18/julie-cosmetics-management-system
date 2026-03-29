-- ============================================================
-- Migration 007: Add invoice status workflow
-- Priority: HIGH (M-01) — Phase 1
-- Risk: LOW (additive column with safe default)
-- Downtime: NO
-- Backup: Recommended
-- Backend sync: REQUIRED — invoiceModel.js queries, create/update
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

ALTER TABLE invoices
  ADD COLUMN status ENUM('draft','confirmed','paid','completed','refunded','cancelled')
  NOT NULL DEFAULT 'paid'
  COMMENT 'Invoice workflow status'
  AFTER payment_method;

-- All existing invoices are considered 'completed' (already paid & delivered)
UPDATE invoices SET status = 'completed' WHERE status = 'paid';

-- Change default for new invoices to 'paid' (preserves current behavior)
-- New flow will be: draft → confirmed → paid → completed

-- Index for status filtering
CREATE INDEX idx_invoices_status ON invoices(status);

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP INDEX idx_invoices_status ON invoices;
-- ALTER TABLE invoices DROP COLUMN status;

-- ── NOTES ──────────────────────────────────────────────────────
-- • Default 'paid' preserves backward compatibility — existing
--   create invoice flow produces paid invoices immediately.
-- • Existing historical invoices are set to 'completed' since
--   they were already processed.
-- • Backend invoiceModel.js should be updated to:
--   1. Include status in SELECT queries
--   2. Support status filter in findAll
--   3. Add updateStatus() method
-- • Future: refund/cancel flows can update status + trigger
--   stock restoration and CRM points reversal.
