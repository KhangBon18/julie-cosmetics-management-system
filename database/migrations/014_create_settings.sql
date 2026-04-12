-- ============================================================
-- Migration 014: Create settings table
-- Priority: P2-05 — Phase 2
-- Risk: LOW (new table + seed data)
-- Downtime: NO
-- Backup: Not required
-- Backend sync: New model/routes needed
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE settings (
  setting_id    INT            AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100)   NOT NULL UNIQUE,
  setting_value TEXT           NOT NULL,
  data_type     ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
  category      VARCHAR(50)    NOT NULL DEFAULT 'general' COMMENT 'Nhóm cấu hình',
  description   VARCHAR(255)   NULL,
  is_public     BOOLEAN        NOT NULL DEFAULT FALSE COMMENT 'Hiển thị trên public API',
  updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by    INT            NULL,

  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_settings_category (category),
  INDEX idx_settings_public (is_public)
) ENGINE=InnoDB COMMENT='Cấu hình hệ thống key-value';

-- Seed default settings
INSERT INTO settings (setting_key, setting_value, data_type, category, description, is_public) VALUES
  -- CRM Configuration
  ('crm.points_per_10000',      '1',       'number',  'crm',     'Số điểm tích lũy cho mỗi 10.000đ chi tiêu', FALSE),
  ('crm.silver_threshold',      '100',     'number',  'crm',     'Điểm tối thiểu để lên Silver', FALSE),
  ('crm.gold_threshold',        '500',     'number',  'crm',     'Điểm tối thiểu để lên Gold', FALSE),
  ('crm.silver_discount',       '5',       'number',  'crm',     'Phần trăm giảm giá cho Silver (%)', FALSE),
  ('crm.gold_discount',         '10',      'number',  'crm',     'Phần trăm giảm giá cho Gold (%)', FALSE),

  -- Store Information
  ('store.name',                'Julie Cosmetics', 'string', 'store', 'Tên cửa hàng', TRUE),
  ('store.phone',               '0901234567',      'string', 'store', 'Số điện thoại cửa hàng', TRUE),
  ('store.email',               'info@juliecosmetics.vn', 'string', 'store', 'Email cửa hàng', TRUE),
  ('store.address',             'TP. Hồ Chí Minh',       'string', 'store', 'Địa chỉ cửa hàng', TRUE),

  -- Invoice Configuration
  ('invoice.tax_rate',          '0',       'number',  'invoice', 'Thuế VAT (%)', FALSE),
  ('invoice.prefix',            'INV',     'string',  'invoice', 'Tiền tố mã hóa đơn', FALSE),

  -- Inventory
  ('inventory.low_stock_threshold', '10',  'number',  'inventory', 'Ngưỡng cảnh báo tồn kho thấp', FALSE),

  -- System
  ('system.maintenance_mode',   'false',   'boolean', 'system',  'Chế độ bảo trì', FALSE),
  ('system.pagination_default', '10',      'number',  'system',  'Số bản ghi mặc định mỗi trang', FALSE);

-- ── DOWN ───────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS settings;

-- ── NOTES ──────────────────────────────────────────────────────
-- • is_public=TRUE settings are exposed via GET /api/public/settings
-- • Backend should cache settings in memory to avoid DB query per request.
-- • Use JSON data_type for complex configs:
--   INSERT INTO settings (setting_key, setting_value, data_type, category)
--   VALUES ('email.smtp', '{"host":"smtp.gmail.com","port":587}', 'json', 'email');
