-- ============================================================
-- Migration 021: Add CHECK constraints on critical tables
-- Phase 3A — Reliability & Data Integrity
-- Risk: LOW (additive, existing data should comply)
-- ============================================================

USE julie_cosmetics;

-- Product prices must be non-negative
ALTER TABLE products ADD CONSTRAINT chk_products_sell_price
  CHECK (sell_price >= 0);
ALTER TABLE products ADD CONSTRAINT chk_products_import_price
  CHECK (import_price >= 0);

-- Invoice totals must be non-negative
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_subtotal
  CHECK (subtotal >= 0);
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_final_total
  CHECK (final_total >= 0);
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_discount
  CHECK (discount_percent >= 0 AND discount_percent <= 100);

-- Promotion constraints
ALTER TABLE promotions ADD CONSTRAINT chk_promo_discount_value
  CHECK (discount_value > 0);
ALTER TABLE promotions ADD CONSTRAINT chk_promo_dates
  CHECK (end_date > start_date);

-- Payment amount must be positive
ALTER TABLE payment_transactions ADD CONSTRAINT chk_pt_amount
  CHECK (amount > 0);

-- Shipping fee must be non-negative
ALTER TABLE shipping_orders ADD CONSTRAINT chk_so_fee
  CHECK (shipping_fee >= 0);

-- Return refund must be non-negative
ALTER TABLE returns ADD CONSTRAINT chk_ret_refund
  CHECK (total_refund >= 0);
