-- ============================================================
-- Migration 002: Fix import_price overwrite in trigger
-- Priority: CRITICAL (C-02) — Phase 0
-- Risk: MEDIUM (trigger replacement — test import flow after)
-- Downtime: NO
-- Backup: YES (trigger logic change)
-- Backend sync: importModel.js — no change needed
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────
-- Current trigger overwrites products.import_price with the latest
-- import batch price. This destroys historical pricing data.
-- Fix: only update stock_quantity, leave import_price to be managed
-- by application logic or weighted average calculation.

DROP TRIGGER IF EXISTS trg_import_item_insert;

DELIMITER $$
CREATE TRIGGER trg_import_item_insert
AFTER INSERT ON import_receipt_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity
  WHERE product_id = NEW.product_id;
END$$
DELIMITER ;

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP TRIGGER IF EXISTS trg_import_item_insert;
-- DELIMITER $$
-- CREATE TRIGGER trg_import_item_insert
-- AFTER INSERT ON import_receipt_items
-- FOR EACH ROW
-- BEGIN
--   UPDATE products
--   SET stock_quantity = stock_quantity + NEW.quantity,
--       import_price   = NEW.unit_price
--   WHERE product_id = NEW.product_id;
-- END$$
-- DELIMITER ;

-- ── NOTES ──────────────────────────────────────────────────────
-- • After this migration, products.import_price will NOT auto-update
--   on import. If you need "latest import price" display, query it:
--   SELECT unit_price FROM import_receipt_items
--   WHERE product_id = ? ORDER BY item_id DESC LIMIT 1;
-- • Existing import_price values are preserved (not zeroed out).
-- • Test: create a new import receipt and verify stock_quantity
--   increases but import_price remains unchanged.
