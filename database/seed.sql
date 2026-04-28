-- ============================================================
-- JulieCosmetics — Seed Data (Demo)
-- Chạy sau schema.sql
-- ============================================================

USE julie_cosmetics;
SET NAMES utf8mb4;

-- ── POSITIONS ─────────────────────────────────────────────────
INSERT INTO positions (position_name, base_salary, description) VALUES
('Quản lý cửa hàng',    15000000, 'Điều hành hoạt động cửa hàng, phê duyệt đơn từ nội bộ và theo dõi báo cáo quản trị.'),
('Nhân viên Bán hàng',   8000000, 'Tư vấn sản phẩm, hỗ trợ bán hàng trực tiếp và lập hóa đơn cho khách hàng.'),
('Thủ kho',              7500000, 'Quản lý nhập - xuất - tồn kho, lập phiếu nhập và kiểm soát số liệu hàng hóa.'),
('Kế toán',              9000000, 'Theo dõi tài chính, đối soát chứng từ và kiểm tra báo cáo doanh thu.');

-- ── ATTENDANCE SHIFTS (seed mặc định cho module chấm công) ────
INSERT INTO attendance_shifts (shift_code, shift_name, start_time, end_time, break_minutes, grace_minutes, standard_work_minutes, is_active)
VALUES ('HC', 'Ca hành chính', '08:00:00', '17:00:00', 60, 10, 480, TRUE)
ON DUPLICATE KEY UPDATE
  shift_name = VALUES(shift_name),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  break_minutes = VALUES(break_minutes),
  grace_minutes = VALUES(grace_minutes),
  standard_work_minutes = VALUES(standard_work_minutes),
  is_active = VALUES(is_active);

-- ── EMPLOYEES ─────────────────────────────────────────────────
INSERT INTO employees (full_name, email, phone, address, gender, date_of_birth, hire_date, base_salary, status) VALUES
('Nguyễn Thị Julie',   'julie@juliecosmetics.vn',   '0901234567', '123 Nguyễn Huệ, Q1, TP.HCM',         'Nữ', '1990-05-15', '2022-01-01', 15000000, 'active'),
('Trần Văn Nam',        'nam.tran@juliecosmetics.vn', '0912345678', '456 Lê Lợi, Q1, TP.HCM',             'Nam', '1995-08-20', '2022-03-15', 8000000,  'active'),
('Lê Thị Hương',        'huong.le@juliecosmetics.vn', '0923456789', '789 Điện Biên Phủ, Q3, TP.HCM',     'Nữ', '1998-02-10', '2022-06-01', 8000000,  'active'),
('Phạm Văn Kho',        'kho.pham@juliecosmetics.vn', '0934567890', '321 Cách Mạng Tháng 8, Q10, TP.HCM','Nam', '1996-11-25', '2022-04-01', 7500000,  'active'),
('Vũ Thị Mai',          'mai.vu@juliecosmetics.vn',   '0945678901', '654 Nguyễn Thị Minh Khai, Q3',      'Nữ', '1997-07-18', '2023-01-10', 8000000,  'active'),
('Đặng Hữu Phúc',       'phuc.dang@juliecosmetics.vn','0956789012', '147 Võ Văn Tần, Q3, TP.HCM',        'Nam', '1993-04-30', '2021-09-01', 15000000, 'inactive');

-- ── EMPLOYEE POSITIONS ────────────────────────────────────────
INSERT INTO employee_positions (employee_id, position_id, effective_date, end_date, salary_at_time, note) VALUES
(1, 1, '2022-01-01', NULL,         15000000, 'Đảm nhiệm vai trò quản lý cửa hàng kể từ ngày thành lập.'),
(2, 2, '2022-03-15', '2023-06-30', 7500000,  'Tiếp nhận ở vị trí nhân viên bán hàng trong giai đoạn thử việc.'),
(2, 2, '2023-07-01', NULL,         8000000,  'Điều chỉnh mức lương sau khi hoàn thành thử việc và ký hợp đồng chính thức.'),
(3, 2, '2022-06-01', NULL,         8000000,  'Phụ trách công tác bán hàng tại cửa hàng.'),
(4, 3, '2022-04-01', NULL,         7500000,  'Phụ trách quản lý kho và điều phối nhập - xuất hàng hóa.'),
(5, 2, '2023-01-10', NULL,         8000000,  'Phụ trách công tác bán hàng tại cửa hàng.'),
(6, 1, '2021-09-01', '2023-12-31', 14000000, 'Kết thúc hợp đồng lao động vào cuối năm 2023.');

-- ── USERS ─────────────────────────────────────────────────────
-- Password hash cho 'admin123', 'manager123', 'staff123', 'sales123', 'warehouse123'
-- Các hash được generate bởi bcryptjs (rounds=10) — ĐÃ VERIFY ĐÚNG
INSERT INTO users (username, password_hash, role, employee_id, is_active) VALUES
('admin',        '$2a$10$rxik/AurZ4RtBxuwB6K2eOKxhuOzU1oT/qNqymIykEoSvPD3Wx2jC', 'admin',     NULL, TRUE),
('manager01',    '$2a$10$C1ZWe0OszlFZd7GUK2m1ae6bn9F4Ox7LA.R.YnHs3RLGrPsErnU3C', 'manager',   1,    TRUE),
('staff01',      '$2a$10$102u8BDnzPvddN.TErjNNe89gtGZGCaZqyUrh20XPNaTsQyVvhf62', 'staff',     2,    TRUE),
('staff02',      '$2a$10$XdTW7K.YPLrzY5H16hYaaO8HPLWUNxC5PWmZv4iviw6T4CoF71OE6', 'staff',     3,    TRUE),
('sales01',      '$2a$10$AYOnKExz6y1i/nwfJMUrguL/FNyhorXpbOZag8smiEG82uXPCLgFa', 'staff',     NULL, TRUE),
('warehouse01',  '$2a$10$R99s632OA5DWlSdzJIckkOyJ3kWjbLUAmY9mymYCcqu.oz4WltdI2', 'warehouse', 4,    TRUE),
('staff03',      '$2a$10$jvO2ApKOX/5dUxPLT6YrLOAMwURCLCFmYJ3YfAJrpJAf694JQ7jXi', 'staff',     5,    TRUE);

-- ── BRANDS ────────────────────────────────────────────────────
INSERT INTO brands (brand_name, origin_country, description) VALUES
("L'Oréal",       'Pháp',     'Tập đoàn mỹ phẩm hàng đầu thế giới'),
('Maybelline',    'Mỹ',       'Thương hiệu makeup phổ biến toàn cầu'),
('Innisfree',     'Hàn Quốc', 'Thương hiệu skincare thuần chay từ thiên nhiên Jeju'),
('The Ordinary',  'Canada',   'Skincare hiệu quả cao với giá cả phải chăng'),
('Laneige',       'Hàn Quốc', 'Chuyên gia về độ ẩm và chăm sóc da căng mọng'),
('CeraVe',        'Mỹ',       'Được khuyên dùng bởi bác sĩ da liễu'),
('Bioderma',      'Pháp',     'Dược mỹ phẩm nổi tiếng với nước tẩy trang'),
('Sulwhasoo',     'Hàn Quốc', 'Luxury skincare kết hợp thảo dược Đông y');

-- ── CATEGORIES ────────────────────────────────────────────────
INSERT INTO categories (category_name, description) VALUES
('Skincare',   'Các sản phẩm chăm sóc da: serum, kem dưỡng, toner, mặt nạ'),
('Makeup',     'Sản phẩm trang điểm: son môi, phấn mắt, kem nền, mascara'),
('Perfume',    'Nước hoa và xịt thơm toàn thân'),
('Haircare',   'Chăm sóc tóc: dầu gội, dầu xả, serum tóc'),
('Body Care',  'Chăm sóc cơ thể: sữa tắm, kem dưỡng thể, tẩy tế bào chết');

-- ── SUPPLIERS ─────────────────────────────────────────────────
INSERT INTO suppliers (supplier_name, contact_person, phone, email, address) VALUES
('Công ty TNHH Mỹ Phẩm Châu Âu',         'Nguyễn Hoàng Anh', '0281234567', 'supply@chauau.vn',    '10 Đinh Tiên Hoàng, Q1, TP.HCM'),
('Phân phối Mỹ Phẩm Hàn Quốc K-Beauty',  'Trần Mỹ Linh',    '0282345678', 'kbeauty@kpham.vn',   '25 Lý Tự Trọng, Q1, TP.HCM'),
('Beauty World Distribution',            'Lê Quang Minh',   '0283456789', 'bwd@beautyworld.vn', '50 Nguyễn Đình Chiểu, Q3, TP.HCM');

-- ── PRODUCTS ──────────────────────────────────────────────────
INSERT INTO products (product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity) VALUES
-- Skincare
('Kem dưỡng ẩm Moisturizing Cream',          6, 1, 'Kem dưỡng ẩm phù hợp mọi loại da, không gây kích ứng',                 'Mọi loại da',    '52ml',  120000, 195000,  45),
('Serum Retinol 0.2% in Squalane',            4, 1, 'Serum chống lão hóa với Retinol nồng độ 0.2%, dạng nhẹ cho người mới', 'Da khô/Da dầu',  '30ml',   90000, 160000,  38),
('Toner Jeju Green Tea',                       3, 1, 'Toner dưỡng ẩm chiết xuất trà xanh Jeju, cân bằng da',               'Mọi loại da',    '200ml',  85000, 145000,  60),
('Water Sleeping Mask',                        5, 1, 'Mặt nạ ngủ dưỡng ẩm sâu, thức dậy với làn da căng mọng',            'Da khô/Da thường','70ml', 130000, 230000,  32),
('Micellar Water 3 in 1',                      7, 1, 'Nước tẩy trang 3 trong 1, làm sạch dịu nhẹ không cần rửa lại',       'Mọi loại da',    '250ml',  75000, 129000,  80),
('First Care Activating Serum VI',             8, 1, 'Serum đầu bước chuẩn bị da, dưỡng chất từ thảo dược',               'Da thường/khô',  '90ml',  350000, 620000,  15),

-- Makeup
('Mascara Lash Sensational Washable',          2, 2, 'Mascara làm dày và dài mi tức thì, dễ tẩy',                          NULL,             '9.5ml',  80000, 145000,  55),
('Kem nền True Match Foundation',              1, 2, 'Kem nền mỏng nhẹ tự nhiên, 40 tông màu',                             NULL,             '30ml',   95000, 175000,  42),
('Son kem Superstay Matte Ink',                2, 2, 'Son kem lì siêu bền, không bay màu suốt 16 giờ',                    NULL,             '5ml',    75000, 139000,  70),

-- Perfume
("Nước hoa L'Eau D'Issey",                    1, 3, 'Hương thơm tươi mát, nhẹ nhàng, phù hợp đi làm',                    NULL,             '50ml',  550000, 950000,  12),

-- Haircare
('Dầu gội trị gàu Elseve',                    1, 4, 'Dầu gội trị gàu chuyên sâu, làm sạch da đầu',                       NULL,             '175ml',  55000,  95000,  65),
('Dầu xả dưỡng tóc Extraordinary Oil',        1, 4, 'Dầu xả với tinh dầu quý phục hồi tóc hư tổn',                      NULL,             '180ml',  65000, 110000,  48),

-- Body Care
('Sữa tắm dưỡng ẩm Lipikar Baume AP+M',       7, 5, 'Sữa tắm cho da khô và nhạy cảm, dưỡng ẩm 48 giờ',                  'Da khô',         '200ml',  95000, 165000,  35),
('Kem dưỡng thể hương nước hoa Elseve',        1, 5, 'Kem dưỡng thể mềm mịn với hương thơm dịu nhẹ',                     'Mọi loại da',    '200ml',  60000, 105000,  50);

-- ── SUPPLIER ↔ PRODUCT MAPPING (demo-safe) ───────────────────
-- NCC 1 và 2 được cấu hình danh mục riêng để demo lọc theo NCC.
-- NCC 3 cố ý chưa cấu hình để hệ thống fallback toàn bộ sản phẩm.
INSERT IGNORE INTO supplier_products (supplier_id, product_id, is_active) VALUES
(1, 1, TRUE),   -- CeraVe Moisturizing
(1, 5, TRUE),   -- Bioderma Micellar
(2, 3, TRUE),   -- Toner Jeju Green Tea
(2, 4, TRUE),   -- Water Sleeping Mask
(2, 6, TRUE);   -- Sulwhasoo Serum

-- ── CUSTOMERS (CRM) ───────────────────────────────────────────
INSERT INTO customers (full_name, phone, email, address, gender, date_of_birth, membership_tier, total_points, total_spent) VALUES
('Nguyễn Thị Lan',    '0961111111', 'lan.nguyen@gmail.com',  '12 Bà Triệu, Q1, TP.HCM',         'Nữ', '1995-03-12', 'gold',     625, 8750000),
('Trần Thị Bình',     '0962222222', 'binh.tran@gmail.com',   '45 Ngô Đức Kế, Q1, TP.HCM',       'Nữ', '1998-07-25', 'silver',   210, 3200000),
('Lê Văn Hùng',       '0963333333', 'hung.le@gmail.com',     '78 Phan Bội Châu, Q1, TP.HCM',    'Nam', '1992-11-08', 'silver',   145, 1980000),
('Phạm Thị Thu',      '0964444444', 'thu.pham@gmail.com',    '90 Hai Bà Trưng, Q3, TP.HCM',     'Nữ', '2000-01-15', 'standard',  55,  780000),
('Vũ Minh Châu',      '0965555555', 'chau.vu@gmail.com',     '33 Điện Biên Phủ, BT, TP.HCM',    'Nữ', '1997-09-20', 'standard',  30,  450000),
('Đoàn Thị Hoa',      '0966666666', 'hoa.doan@gmail.com',    '56 Trần Hưng Đạo, Q5, TP.HCM',    'Nữ', '1990-06-14', 'gold',     720, 9800000),
('Ngô Thanh Long',    '0967777777', 'long.ngo@gmail.com',    '102 Lý Thường Kiệt, Q10, TP.HCM', 'Nam', '1988-12-03', 'silver',   185, 2600000),
('Hoàng Thị Ngọc',   '0968888888', 'ngoc.hoang@gmail.com', '25 Nguyễn Văn Cừ, Q5, TP.HCM',    'Nữ', '1999-04-28', 'standard',  70,  950000);

-- ── IMPORT RECEIPTS ───────────────────────────────────────────
INSERT INTO import_receipts (supplier_id, created_by, total_amount, note, created_at) VALUES
(2, 5, 4850000,  'Nhập hàng định kỳ từ nhà cung cấp Hàn Quốc - kỳ tháng 3/2026.', '2026-03-01 09:00:00'),
(1, 5, 2750000,  'Nhập hàng định kỳ từ nhà cung cấp Châu Âu - kỳ tháng 3/2026.',   '2026-03-10 10:30:00'),
(3, 5, 3600000,  'Nhập bổ sung nhóm hàng trang điểm - kỳ tháng 3/2026.',            '2026-03-20 14:00:00');

INSERT INTO import_receipt_items (receipt_id, product_id, quantity, unit_price) VALUES
(1, 3,  20, 85000),   -- Toner Innisfree
(1, 4,  15, 130000),  -- Water Sleeping Mask Laneige
(1, 6,   5, 350000),  -- Sulwhasoo Serum
(2, 1,  15, 120000),  -- CeraVe Moisturizing
(2, 5,  20,  75000),  -- Bioderma Micellar
(3, 7,  20,  80000),  -- Mascara Maybelline
(3, 8,  10,  95000),  -- Foundation L'Oreal
(3, 9,  20,  75000);  -- Son kem Maybelline

-- ── INVOICES (demo giao dịch) ─────────────────────────────────
INSERT INTO invoices (customer_id, created_by, subtotal, discount_percent, discount_amount, final_total, points_earned, payment_method, created_at) VALUES
(1, 2, 690000,  5, 34500,  655500,  65, 'cash',     '2026-03-05 10:15:00'),  -- KH Vàng giảm 5%
(2, 2, 324000,  0, 0,       324000,  32, 'card',     '2026-03-06 14:30:00'),
(6, 3, 890000,  5, 44500,  845500,  84, 'transfer', '2026-03-07 11:00:00'),  -- KH Vàng giảm 5%
(3, 2, 465000,  0, 0,       465000,  46, 'cash',     '2026-03-10 09:45:00'),
(NULL,2,230000, 0, 0,       230000,   0, 'cash',     '2026-03-12 16:00:00'), -- Khách vãng lai
(4, 3, 519000,  0, 0,       519000,  51, 'cash',     '2026-03-15 13:20:00'),
(1, 2, 1175000, 5, 58750, 1116250, 111, 'card',     '2026-03-18 10:00:00'), -- KH Vàng
(5, 3, 294000,  0, 0,       294000,  29, 'cash',     '2026-03-20 15:45:00');

INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal) VALUES
(1, 2, 1, 160000, 160000),  -- Serum Retinol
(1, 3, 2, 145000, 290000),  -- Toner Innisfree x2
(1, 5, 1, 129000, 129000),  -- Micellar
(1, 9, 1, 139000, 139000),  -- Son kem thêm
(2, 7, 1, 145000, 145000),  -- Mascara
(2, 9, 1, 139000, 139000),  -- Son kem
(3, 1, 2, 195000, 390000),  -- CeraVe x2
(3, 4, 1, 230000, 230000),  -- Sleeping Mask
(3, 9, 1, 139000, 139000),  -- Son
(3, 7, 1, 145000, 145000),  -- Mascara
(4, 3, 1, 145000, 145000),  -- Toner
(4, 1, 1, 195000, 195000),  -- CeraVe
(4, 5, 1, 129000, 129000),  -- Micellar
(5, 9, 1, 139000, 139000),  -- Son kem khách vãng lai
(5, 7, 1,  95000,  95000),  -- Dầu gội
(6, 4, 1, 230000, 230000),  -- Sleeping Mask
(6, 2, 1, 160000, 160000),  -- Serum Retinol
(6, 5, 1, 129000, 129000),  -- Micellar
(7, 6, 1, 620000, 620000),  -- Sulwhasoo Serum
(7, 4, 1, 230000, 230000),  -- Sleeping Mask
(7, 2, 1, 160000, 160000),  -- Retinol
(7, 7, 1, 145000, 145000),  -- Mascara
(8, 3, 1, 145000, 145000),  -- Toner
(8, 5, 1, 129000, 129000);  -- Micellar

-- ── REVIEWS ───────────────────────────────────────────────────
INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES
(1, 1, 5, 'Khả năng dưỡng ẩm tốt, da cải thiện rõ sau khoảng một tuần sử dụng.'),
(2, 6, 4, 'Sản phẩm cho hiệu quả tích cực sau khoảng hai tuần sử dụng.'),
(3, 2, 5, 'Toner dịu nhẹ, mùi trà xanh dễ chịu và phù hợp dùng hằng ngày.'),
(4, 1, 5, 'Mặt nạ ngủ cấp ẩm tốt, sáng hôm sau da mềm và căng hơn.'),
(9, 3, 4, 'Màu son đẹp, độ bám ổn và phù hợp dùng hằng ngày.'),
(7, 4, 3, 'Hiệu quả làm dài mi khá tốt, tuy nhiên cần tẩy trang kỹ.');

-- ── LEAVE REQUESTS ────────────────────────────────────────────
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status, approved_by, approved_at) VALUES
(2, 'annual',  '2026-03-10', '2026-03-11', 2, 'Nghỉ phép năm theo kế hoạch đã đăng ký từ đầu năm.',              'approved', 1, '2026-03-05 09:00:00'),
(3, 'sick',    '2026-03-15', '2026-03-15', 1, 'Nghỉ ốm để theo dõi sức khỏe, có xác nhận khám bệnh.',             'approved', 1, '2026-03-15 08:00:00'),
(5, 'annual',  '2026-04-05', '2026-04-07', 3, 'Nghỉ phép để giải quyết việc gia đình theo kế hoạch đã sắp xếp trước.', 'pending',  NULL, NULL),
(4, 'unpaid',  '2026-03-28', '2026-03-28', 1, 'Xin nghỉ không lương do phát sinh việc gia đình cần trực tiếp xử lý.', 'rejected', 1, '2026-03-25 10:00:00');

-- ── SALARIES (tháng 2/2026) ───────────────────────────────────
INSERT INTO salaries (employee_id, month, year, work_days_standard, work_days_actual, unpaid_leave_days, base_salary, gross_salary, bonus, deductions, net_salary, notes, generated_by) VALUES
(1, 2, 2026, 22, 22, 0, 15000000, 15000000, 2000000, 0, 17000000, 'Thưởng doanh số theo kết quả bán hàng tháng 2.', 1),
(2, 2, 2026, 22, 22, 0,  8000000,  8000000,        0, 0,  8000000, '', 1),
(3, 2, 2026, 22, 21, 0,  8000000,  7636364,        0, 0,  7636364, 'Phát sinh 1 ngày nghỉ phép năm trong tháng.', 1),
(4, 2, 2026, 22, 22, 0,  7500000,  7500000,        0, 0,  7500000, '', 1),
(5, 2, 2026, 22, 20, 1,  8000000,  7272727,        0, 0,  7272727, 'Phát sinh 2 ngày nghỉ trong tháng, gồm 1 ngày phép năm và 1 ngày nghỉ không lương.', 1);

INSERT INTO salary_bonus_adjustments (employee_id, month, year, amount, reason, created_by, updated_by) VALUES
(1, 2, 2026, 2000000, 'Thưởng doanh số theo kết quả bán hàng tháng 2.', 1, 1);

-- ── SETTINGS ──────────────────────────────────────────────────
INSERT INTO settings (setting_key, setting_value, data_type, category, description, is_public) VALUES
('work_days_standard', '22', 'number', 'hr', 'Số ngày công chuẩn trong tháng để tính lương', FALSE),
('crm.silver_discount', '2', 'number', 'crm', 'Phần trăm giảm giá cho hạng Bạc (%)', TRUE),
('crm.gold_discount', '5', 'number', 'crm', 'Phần trăm giảm giá cho hạng Vàng (%)', TRUE),
('crm.points_per_10000', '1', 'number', 'crm', 'Số điểm tích lũy trên mỗi 10.000đ chi tiêu', TRUE);
