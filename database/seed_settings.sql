USE julie_cosmetics;
SET NAMES utf8mb4;
DELETE FROM settings WHERE setting_key = 'crm.points_per_1000';
-- ── SETTINGS ──────────────────────────────────────────────────
INSERT IGNORE INTO settings (setting_key, setting_value, data_type, category, description, is_public) VALUES
('work_days_standard', '22', 'number', 'hr', 'Số ngày công chuẩn trong tháng để tính lương', FALSE),
('crm.silver_discount', '2', 'number', 'crm', 'Phần trăm giảm giá cho hạng Bạc (%)', TRUE),
('crm.gold_discount', '5', 'number', 'crm', 'Phần trăm giảm giá cho hạng Vàng (%)', TRUE),
('crm.points_per_10000', '1', 'number', 'crm', 'Số điểm tích lũy trên mỗi 10.000đ chi tiêu', TRUE);
