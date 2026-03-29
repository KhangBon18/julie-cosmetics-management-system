-- ============================================================
-- Migration 015: Normalize skin_type into lookup table
-- Priority: P2-06 — Phase 2
-- Risk: MEDIUM (data migration from VARCHAR to FK)
-- Downtime: NO
-- Backup: Recommended
-- Backend sync: Product create/update queries need adjustment
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE skin_types (
  skin_type_id   INT            AUTO_INCREMENT PRIMARY KEY,
  skin_type_name VARCHAR(100)   NOT NULL UNIQUE,
  description    VARCHAR(255)   NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục loại da chuẩn hóa';

-- Seed common skin types
INSERT INTO skin_types (skin_type_name, description) VALUES
  ('Da dầu',       'Oily skin — thường bóng nhờn, lỗ chân lông to'),
  ('Da khô',       'Dry skin — thường khô ráp, bong tróc'),
  ('Da hỗn hợp',   'Combination skin — vùng T dầu, hai bên khô'),
  ('Da thường',    'Normal skin — cân bằng, không quá dầu hay khô'),
  ('Da nhạy cảm',  'Sensitive skin — dễ kích ứng, đỏ rát'),
  ('Mọi loại da',  'All skin types — phù hợp cho mọi loại da');

-- Create junction table for product-skin_type (N:N)
CREATE TABLE product_skin_types (
  product_id    INT NOT NULL,
  skin_type_id  INT NOT NULL,
  PRIMARY KEY (product_id, skin_type_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (skin_type_id) REFERENCES skin_types(skin_type_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Sản phẩm phù hợp loại da nào (N:N)';

-- Migrate existing skin_type data where possible
-- Map common values to the new lookup table
INSERT IGNORE INTO product_skin_types (product_id, skin_type_id)
SELECT p.product_id, st.skin_type_id
FROM products p
JOIN skin_types st ON p.skin_type = st.skin_type_name
WHERE p.skin_type IS NOT NULL AND p.skin_type != '';

-- Products with "Mọi loại da" in their skin_type text
INSERT IGNORE INTO product_skin_types (product_id, skin_type_id)
SELECT p.product_id, st.skin_type_id
FROM products p
JOIN skin_types st ON st.skin_type_name = 'Mọi loại da'
WHERE p.skin_type LIKE '%Mọi loại%' OR p.skin_type LIKE '%mọi loại%';

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS product_skin_types;
-- DROP TABLE IF EXISTS skin_types;

-- ── NOTES ──────────────────────────────────────────────────────
-- • products.skin_type VARCHAR column is KEPT for backward compat.
--   It can be dropped after frontend is updated to use the junction.
-- • The migration does best-effort mapping; manually unmatched
--   products will need to be re-categorized via admin UI.
-- • Check unmapped products:
--   SELECT product_id, skin_type FROM products
--   WHERE skin_type IS NOT NULL
--   AND product_id NOT IN (SELECT product_id FROM product_skin_types);
