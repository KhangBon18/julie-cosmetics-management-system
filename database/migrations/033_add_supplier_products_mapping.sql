-- ============================================================
-- Migration 033 — Supplier <-> Product mapping for safer import flow
-- ============================================================

USE julie_cosmetics;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS supplier_products (
  supplier_id    INT            NOT NULL,
  product_id     INT            NOT NULL,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id, product_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_supplier_products_product_id (product_id),
  INDEX idx_supplier_products_is_active (is_active)
) ENGINE=InnoDB COMMENT='Danh mục sản phẩm có thể nhập từ từng nhà cung cấp';

-- Demo-safe seed:
-- - Supplier 1 and 2 are explicitly mapped.
-- - Supplier 3 is intentionally left unmapped so the import form can
--   demonstrate backward-compatible fallback to the full catalog.
INSERT IGNORE INTO supplier_products (supplier_id, product_id, is_active) VALUES
  (1, 1, TRUE),
  (1, 5, TRUE),
  (2, 3, TRUE),
  (2, 4, TRUE),
  (2, 6, TRUE);
