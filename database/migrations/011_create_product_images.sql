-- ============================================================
-- Migration 011: Create product_images table
-- Priority: P2-02 — Phase 2
-- Risk: LOW (new table, no existing data affected)
-- Downtime: NO
-- Backup: Not required
-- Backend sync: OPTIONAL — productModel can use existing image_url
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE product_images (
  image_id     INT            AUTO_INCREMENT PRIMARY KEY,
  product_id   INT            NOT NULL,
  image_url    VARCHAR(500)   NOT NULL,
  alt_text     VARCHAR(200)   NULL,
  sort_order   INT            NOT NULL DEFAULT 0,
  is_primary   BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_pi_product (product_id, sort_order)
) ENGINE=InnoDB COMMENT='Gallery ảnh sản phẩm (N ảnh / sản phẩm)';

-- Migrate existing image_url from products table into product_images
INSERT INTO product_images (product_id, image_url, is_primary, sort_order)
SELECT product_id, image_url, TRUE, 0
FROM products
WHERE image_url IS NOT NULL AND image_url != '';

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS product_images;

-- ── NOTES ──────────────────────────────────────────────────────
-- • products.image_url is kept for backward compat (quick access
--   to primary image without JOIN). Treat as a denormalized cache.
-- • Frontend can query product_images for gallery view.
-- • is_primary = TRUE should have at most 1 row per product_id.
--   Consider a partial unique index or application logic enforcement.
