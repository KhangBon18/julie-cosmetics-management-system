-- ============================================================
-- Migration 009: Create inventory_movements table
-- Priority: HIGH (M-11) — Phase 1
-- Risk: LOW (new table, no existing data affected)
-- Downtime: NO
-- Backup: Not required
-- Backend sync: REQUIRED — import/invoice models should log movements
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE inventory_movements (
  movement_id    BIGINT         AUTO_INCREMENT PRIMARY KEY,
  product_id     INT            NOT NULL,
  movement_type  ENUM('import','sale','return','adjustment','damage','transfer')
                                NOT NULL,
  quantity       INT            NOT NULL COMMENT 'Positive = in, Negative = out',
  stock_before   INT            NOT NULL COMMENT 'Stock level before this movement',
  stock_after    INT            NOT NULL COMMENT 'Stock level after this movement',
  reference_type VARCHAR(50)    NULL COMMENT 'import_receipt, invoice, manual',
  reference_id   INT            NULL COMMENT 'PK of the source document',
  unit_cost      DECIMAL(12,2)  NULL COMMENT 'Cost per unit at time of movement',
  note           TEXT           NULL,
  created_by     INT            NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,

  INDEX idx_inv_mov_product (product_id, created_at),
  INDEX idx_inv_mov_type (movement_type, created_at),
  INDEX idx_inv_mov_ref (reference_type, reference_id),
  INDEX idx_inv_mov_created (created_at)
) ENGINE=InnoDB COMMENT='Complete inventory movement history for audit and reconciliation';

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS inventory_movements;

-- ── NOTES ──────────────────────────────────────────────────────
-- • This table works ALONGSIDE the existing triggers, not replacing them.
--   Triggers handle the actual stock_quantity update on products.
--   This table provides the audit trail/history.
-- • Backend integration points:
--   1. invoiceModel.create() — after inserting invoice_items, log
--      movement_type='sale', quantity=-N for each item.
--   2. importModel.create() — after inserting import_receipt_items,
--      log movement_type='import', quantity=+N for each item.
--   3. New endpoint for manual adjustments (damage, correction).
-- • stock_before/stock_after enables reconciliation:
--   SELECT * FROM inventory_movements WHERE product_id = ?
--   AND stock_after != (SELECT stock_quantity FROM products WHERE product_id = ?);
-- • This table will grow with every sale/import. Consider monthly
--   partitioning for tables expecting > 100K rows/month.
