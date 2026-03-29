-- ============================================================
-- Migration 012: Create promotions table
-- Priority: P2-03 — Phase 2
-- Risk: LOW (new table)
-- Downtime: NO
-- Backup: Not required
-- Backend sync: New model/routes needed for promotion management
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE promotions (
  promotion_id   INT            AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(50)    NULL UNIQUE COMMENT 'Mã coupon. NULL = auto-apply promotion',
  title          VARCHAR(200)   NOT NULL,
  description    TEXT           NULL,
  discount_type  ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(12,2)  NOT NULL COMMENT 'Giá trị giảm (% hoặc VND)',
  min_order      DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'Đơn tối thiểu để áp dụng',
  max_discount   DECIMAL(12,2)  NULL COMMENT 'Giới hạn giảm tối đa (cho percent type)',
  usage_limit    INT            NULL COMMENT 'Tổng lượt dùng tối đa. NULL = không giới hạn',
  usage_count    INT            NOT NULL DEFAULT 0,
  start_date     DATETIME       NOT NULL,
  end_date       DATETIME       NOT NULL,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_by     INT            NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_promo_code (code),
  INDEX idx_promo_dates (start_date, end_date, is_active),
  INDEX idx_promo_active (is_active, start_date, end_date)
) ENGINE=InnoDB COMMENT='Chương trình khuyến mãi & mã giảm giá';

-- Link promotions to invoices (which coupon was applied)
ALTER TABLE invoices
  ADD COLUMN promotion_id INT NULL COMMENT 'Mã KM đã áp dụng' AFTER status;

ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_promotion
  FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id) ON DELETE SET NULL;

-- ── DOWN ───────────────────────────────────────────────────────
-- ALTER TABLE invoices DROP FOREIGN KEY fk_invoices_promotion;
-- ALTER TABLE invoices DROP COLUMN promotion_id;
-- DROP TABLE IF EXISTS promotions;

-- ── NOTES ──────────────────────────────────────────────────────
-- • discount_type='percent' + discount_value=10 + max_discount=50000
--   means "10% off, max 50,000 VND reduction"
-- • usage_limit=100 means the coupon can be used 100 times total.
--   usage_count is incremented when applied.
-- • Auto-apply promotions (code IS NULL) are checked automatically
--   at checkout based on start_date/end_date/min_order.
