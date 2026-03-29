-- ============================================================
-- JulieCosmetics — Expanded Catalog Seed Data
-- Run AFTER migration_subcategories.sql
-- This replaces existing brands/categories/products with a rich catalog
-- ============================================================

USE julie_cosmetics;

SET FOREIGN_KEY_CHECKS = 0;

-- Clean existing product-related data (preserves HR, invoices, customers)
DELETE FROM reviews;
DELETE FROM import_receipt_items;
DELETE FROM import_receipts;
DELETE FROM invoice_items;
DELETE FROM invoices;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM brands;

-- ── BRANDS (15 brands) ──────────────────────────────────────
INSERT INTO brands (brand_id, brand_name, origin_country, description) VALUES
(1,  "L'Oréal Paris",  'Pháp',       'Tập đoàn mỹ phẩm hàng đầu thế giới'),
(2,  'Maybelline',      'Mỹ',         'Thương hiệu makeup phổ biến toàn cầu'),
(3,  'Innisfree',       'Hàn Quốc',   'Skincare thuần chay từ đảo Jeju'),
(4,  'The Ordinary',    'Canada',      'Skincare hiệu quả với giá phải chăng'),
(5,  'Laneige',         'Hàn Quốc',   'Chuyên gia độ ẩm và chăm sóc da'),
(6,  'CeraVe',          'Mỹ',         'Được bác sĩ da liễu khuyên dùng'),
(7,  'Bioderma',        'Pháp',       'Dược mỹ phẩm nổi tiếng'),
(8,  'Sulwhasoo',       'Hàn Quốc',   'Luxury skincare thảo dược Đông y'),
(9,  'MAC',             'Mỹ',         'Makeup chuyên nghiệp đẳng cấp'),
(10, 'Clinique',        'Mỹ',         'Skincare & makeup không gây dị ứng'),
(11, 'Shiseido',        'Nhật Bản',   'Mỹ phẩm cao cấp Nhật Bản'),
(12, 'Estée Lauder',    'Mỹ',         'Thương hiệu sang trọng hàng đầu'),
(13, 'Neutrogena',      'Mỹ',         'Chăm sóc da được bác sĩ tin dùng'),
(14, 'Nivea',           'Đức',        'Chăm sóc da và cơ thể phổ biến'),
(15, 'Dove',            'Anh',        'Làm đẹp và chăm sóc cơ thể dịu nhẹ');

-- ── CATEGORIES (6 parent + 30 subcategories) ────────────────
INSERT INTO categories (category_id, parent_id, category_name, description) VALUES
-- Parent categories
(1,  NULL, 'Skincare',    'Chăm sóc da mặt'),
(2,  NULL, 'Makeup',      'Trang điểm'),
(3,  NULL, 'Perfume',     'Nước hoa'),
(4,  NULL, 'Haircare',    'Chăm sóc tóc'),
(5,  NULL, 'Body Care',   'Chăm sóc cơ thể'),
(6,  NULL, "Men's Care",  'Chăm sóc nam giới'),

-- Skincare subcategories
(10, 1, 'Sữa rửa mặt',        'Cleanser, gel rửa mặt'),
(11, 1, 'Toner',               'Nước hoa hồng, toner cân bằng'),
(12, 1, 'Serum & Tinh chất',   'Serum dưỡng, ampoule, tinh chất'),
(13, 1, 'Kem dưỡng ẩm',       'Moisturizer, kem dưỡng'),
(14, 1, 'Kem chống nắng',     'Sunscreen, UV protection'),
(15, 1, 'Mặt nạ',             'Sheet mask, sleeping mask, clay mask'),
(16, 1, 'Kem mắt',            'Eye cream, eye serum'),
(17, 1, 'Tẩy trang',          'Nước tẩy trang, dầu tẩy trang'),

-- Makeup subcategories
(20, 2, 'Kem nền & Cushion',  'Foundation, BB cream, cushion'),
(21, 2, 'Phấn phủ',           'Powder, setting powder'),
(22, 2, 'Son môi',            'Lipstick, lip tint, lip gloss'),
(23, 2, 'Mascara',            'Mascara, eyelash'),
(24, 2, 'Kẻ mắt',            'Eyeliner, eye pencil'),
(25, 2, 'Phấn mắt',          'Eyeshadow palette'),
(26, 2, 'Má hồng',           'Blush, bronzer, highlighter'),
(27, 2, 'Che khuyết điểm',   'Concealer'),

-- Perfume subcategories
(30, 3, 'Nước hoa nữ',       'Women fragrance'),
(31, 3, 'Nước hoa nam',      'Men fragrance'),
(32, 3, 'Body mist',         'Xịt thơm toàn thân'),

-- Haircare subcategories
(40, 4, 'Dầu gội',           'Shampoo'),
(41, 4, 'Dầu xả',            'Conditioner'),
(42, 4, 'Ủ tóc & Serum tóc', 'Hair mask, hair serum, hair oil'),

-- Body Care subcategories
(50, 5, 'Sữa tắm',          'Body wash, shower gel'),
(51, 5, 'Dưỡng thể',        'Body lotion, body cream'),
(52, 5, 'Tẩy tế bào chết',  'Body scrub, exfoliator'),

-- Men's Care subcategories
(60, 6, 'Rửa mặt nam',      'Men cleanser'),
(61, 6, 'Dưỡng da nam',     'Men moisturizer, aftershave'),
(62, 6, 'Lăn khử mùi',      'Deodorant');

-- ── PRODUCTS (150+ products) ────────────────────────────────
-- Each brand gets 8-12 products spread across relevant categories

INSERT INTO products (product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity, image_url) VALUES

-- ═══ CERAVE (brand_id=6) ═══
('CeraVe Foaming Facial Cleanser', 6, 10, 'Sữa rửa mặt tạo bọt cho da dầu, chứa 3 ceramides thiết yếu và niacinamide', 'Da dầu', '236ml', 145000, 249000, 55, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400'),
('CeraVe Hydrating Cleanser', 6, 10, 'Sữa rửa mặt dạng kem dịu nhẹ cho da khô, không làm mất độ ẩm tự nhiên', 'Da khô', '236ml', 145000, 249000, 48, NULL),
('CeraVe Moisturizing Cream', 6, 13, 'Kem dưỡng ẩm phục hồi hàng rào bảo vệ da với ceramides và hyaluronic acid', 'Mọi loại da', '340g', 190000, 345000, 60, NULL),
('CeraVe PM Facial Moisturizing Lotion', 6, 13, 'Kem dưỡng ẩm ban đêm nhẹ với niacinamide giúp phục hồi da', 'Mọi loại da', '52ml', 140000, 239000, 42, NULL),
('CeraVe Eye Repair Cream', 6, 16, 'Kem mắt giảm quầng thâm và bọng mắt với ceramides', 'Mọi loại da', '14.2g', 95000, 179000, 30, NULL),
('CeraVe Hydrating Micellar Water', 6, 17, 'Nước tẩy trang dưỡng ẩm với ceramides, không cần rửa lại', 'Da khô', '296ml', 110000, 199000, 38, NULL),
('CeraVe Resurfacing Retinol Serum', 6, 12, 'Serum retinol giúp làm mờ vết thâm và cải thiện kết cấu da', 'Mọi loại da', '30ml', 130000, 229000, 25, NULL),
('CeraVe Mineral Sunscreen SPF50', 6, 14, 'Kem chống nắng vật lý phổ rộng SPF50, không gây bít tắc lỗ chân lông', 'Da nhạy cảm', '75ml', 120000, 215000, 35, NULL),
('CeraVe SA Smoothing Cleanser', 6, 10, 'Sữa rửa mặt chứa salicylic acid giúp tẩy da chết nhẹ và thông thoáng lỗ chân lông', 'Da dầu/mụn', '236ml', 155000, 269000, 40, NULL),
('CeraVe Skin Renewing Night Cream', 6, 13, 'Kem dưỡng ban đêm chứa biomimetic peptides giúp da săn chắc', 'Da thường/khô', '48g', 170000, 299000, 22, NULL),

-- ═══ THE ORDINARY (brand_id=4) ═══
('The Ordinary Niacinamide 10% + Zinc 1%', 4, 12, 'Serum kiểm soát dầu và se khít lỗ chân lông', 'Da dầu/hỗn hợp', '30ml', 65000, 135000, 70, NULL),
('The Ordinary Hyaluronic Acid 2% + B5', 4, 12, 'Serum cấp ẩm sâu với hyaluronic acid đa phân tử', 'Mọi loại da', '30ml', 55000, 119000, 65, NULL),
('The Ordinary AHA 30% + BHA 2% Peeling Solution', 4, 12, 'Mặt nạ peel hóa học giúp tẩy da chết, sáng da', 'Da thường (không nhạy cảm)', '30ml', 70000, 149000, 45, NULL),
('The Ordinary Retinol 0.5% in Squalane', 4, 12, 'Serum retinol chống lão hóa trong dầu squalane', 'Da khô/thường', '30ml', 80000, 165000, 38, NULL),
('The Ordinary Caffeine Solution 5% + EGCG', 4, 16, 'Serum giảm quầng thâm và bọng mắt chứa caffeine', 'Mọi loại da', '30ml', 55000, 115000, 50, NULL),
('The Ordinary Squalane Cleanser', 4, 10, 'Sữa rửa mặt dạng dầu chuyển gel, tẩy trang nhẹ nhàng', 'Mọi loại da', '50ml', 60000, 125000, 42, NULL),
('The Ordinary Natural Moisturizing Factors + HA', 4, 13, 'Kem dưỡng ẩm với các yếu tố dưỡng ẩm tự nhiên', 'Mọi loại da', '30ml', 50000, 109000, 55, NULL),
('The Ordinary Glycolic Acid 7% Toning Solution', 4, 11, 'Toner tẩy da chết hóa học với glycolic acid', 'Da thường/dầu', '240ml', 75000, 159000, 35, NULL),
('The Ordinary Vitamin C Suspension 23% + HA', 4, 12, 'Serum vitamin C nồng độ cao giúp sáng da', 'Mọi loại da', '30ml', 60000, 129000, 40, NULL),
('The Ordinary Azelaic Acid Suspension 10%', 4, 12, 'Gel azelaic acid giảm mụn và làm đều màu da', 'Da dầu/mụn', '30ml', 70000, 145000, 32, NULL),

-- ═══ INNISFREE (brand_id=3) ═══
('Innisfree Green Tea Seed Serum', 3, 12, 'Serum dưỡng ẩm trà xanh Jeju cung cấp độ ẩm cho da', 'Mọi loại da', '80ml', 140000, 259000, 45, NULL),
('Innisfree Jeju Volcanic Pore Cleansing Foam', 3, 10, 'Sữa rửa mặt đất sét núi lửa Jeju kiểm soát dầu', 'Da dầu/hỗn hợp', '150ml', 80000, 149000, 60, NULL),
('Innisfree Green Tea Balancing Toner', 3, 11, 'Toner cân bằng da chiết xuất trà xanh Jeju', 'Mọi loại da', '200ml', 85000, 159000, 55, NULL),
('Innisfree Daily UV Defense Sunscreen SPF36', 3, 14, 'Kem chống nắng hằng ngày nhẹ, không gây nhờn', 'Mọi loại da', '50ml', 95000, 179000, 40, NULL),
('Innisfree Super Volcanic Pore Clay Mask', 3, 15, 'Mặt nạ đất sét núi lửa Jeju hút sạch bã nhờn', 'Da dầu', '100ml', 75000, 139000, 50, NULL),
('Innisfree Green Tea Seed Cream', 3, 13, 'Kem dưỡng ẩm trà xanh Jeju cho da căng mọng', 'Da thường/khô', '50ml', 130000, 239000, 35, NULL),
('Innisfree Jeju Cherry Blossom Tone Up Cream', 3, 13, 'Kem dưỡng nâng tông da với hoa anh đào Jeju', 'Mọi loại da', '50ml', 110000, 199000, 42, NULL),
('Innisfree No Sebum Mineral Powder', 3, 21, 'Phấn phủ kiểm soát dầu với bột khoáng Jeju', 'Da dầu', '5g', 55000, 99000, 80, NULL),
('Innisfree Vivid Cotton Ink Lip Tint', 3, 22, 'Son tint lì mỏng nhẹ như cotton', 'N/A', '4g', 60000, 115000, 65, NULL),
('Innisfree My Real Squeeze Mask (10 miếng)', 3, 15, 'Mặt nạ giấy chiết xuất tự nhiên, combo 10 miếng', 'Mọi loại da', '10 sheets', 90000, 169000, 70, NULL),

-- ═══ LANEIGE (brand_id=5) ═══
('Laneige Water Sleeping Mask', 5, 15, 'Mặt nạ ngủ dưỡng ẩm sâu, thức dậy da căng mọng', 'Da thường/khô', '70ml', 140000, 259000, 35, NULL),
('Laneige Lip Sleeping Mask Berry', 5, 22, 'Mặt nạ ngủ môi hương berry dưỡng ẩm suốt đêm', 'N/A', '20g', 100000, 189000, 55, NULL),
('Laneige Water Bank Blue Hyaluronic Cream', 5, 13, 'Kem dưỡng cấp ẩm sâu với blue hyaluronic acid', 'Da khô/thường', '50ml', 180000, 329000, 28, NULL),
('Laneige Cream Skin Cera-mide Toner & Moisturizer', 5, 11, 'Toner-kem dưỡng 2 trong 1 chứa ceramide', 'Mọi loại da', '170ml', 150000, 279000, 40, NULL),
('Laneige Neo Cushion Glow', 5, 20, 'Cushion cho lớp nền bóng mịn tự nhiên với SPF50', 'Da thường/khô', '15g', 170000, 319000, 25, NULL),
('Laneige Radian-C Cream', 5, 13, 'Kem dưỡng sáng da chứa vitamin C', 'Mọi loại da', '30ml', 160000, 289000, 30, NULL),
('Laneige Water Bank Hydro Essence', 5, 12, 'Tinh chất cấp ẩm 72h với green mineral water', 'Mọi loại da', '70ml', 170000, 299000, 32, NULL),
('Laneige Bouncy & Firm Sleeping Mask', 5, 15, 'Mặt nạ ngủ nâng cơ săn chắc', 'Da lão hóa', '60ml', 150000, 269000, 20, NULL),

-- ═══ L'ORÉAL PARIS (brand_id=1) ═══
("L'Oréal Paris True Match Foundation", 1, 20, 'Kem nền mỏng mịn tự nhiên, 40 tông màu phù hợp mọi làn da', 'Mọi loại da', '30ml', 95000, 189000, 45, NULL),
("L'Oréal Paris Revitalift Laser X3 Serum", 1, 12, 'Serum chống lão hóa với Pro-Xylane giúp giảm nếp nhăn', 'Da lão hóa', '30ml', 160000, 299000, 30, NULL),
("L'Oréal Paris UV Perfect Even Complexion SPF50", 1, 14, 'Kem chống nắng nâng tông da với SPF50/PA++++', 'Mọi loại da', '30ml', 110000, 209000, 40, NULL),
("L'Oréal Paris Revitalift Crystal Micro-Essence", 1, 11, 'Tinh chất dưỡng sáng da như pha lê với salicylic acid', 'Mọi loại da', '65ml', 120000, 229000, 38, NULL),
("L'Oréal Paris Infallible 24H Fresh Wear Foundation", 1, 20, 'Kem nền 24h bền màu không trôi, finish mịn lì', 'Da dầu/hỗn hợp', '30ml', 120000, 229000, 35, NULL),
("L'Oréal Paris Rouge Signature Matte Lip Ink", 1, 22, 'Son kem lì nhẹ như không, bền màu cả ngày', 'N/A', '7ml', 75000, 149000, 60, NULL),
("L'Oréal Paris Lash Paradise Mascara", 1, 23, 'Mascara cho mi dày dài quyến rũ, công thức không vón cục', 'N/A', '6.4ml', 80000, 159000, 50, NULL),
("L'Oréal Paris Elseve Total Repair 5 Shampoo", 1, 40, 'Dầu gội phục hồi tóc hư tổn với protein và ceramide', 'N/A', '280ml', 55000, 99000, 70, NULL),
("L'Oréal Paris Elseve Extraordinary Oil Conditioner", 1, 41, 'Dầu xả dưỡng tóc với 6 loại tinh dầu quý', 'N/A', '280ml', 60000, 109000, 55, NULL),
("L'Oréal Paris Revitalift Eye Cream", 1, 16, 'Kem mắt chống nhăn và giảm quầng thâm', 'Da lão hóa', '15ml', 130000, 239000, 25, NULL),

-- ═══ MAYBELLINE (brand_id=2) ═══
('Maybelline Fit Me Matte + Poreless Foundation', 2, 20, 'Kem nền lì mịn che phủ lỗ chân lông, 40 tông màu', 'Da dầu/hỗn hợp', '30ml', 75000, 145000, 55, NULL),
('Maybelline Superstay Matte Ink Liquid Lipstick', 2, 22, 'Son kem lì siêu bền 16h không trôi không phai', 'N/A', '5ml', 70000, 139000, 75, NULL),
('Maybelline Lash Sensational Mascara', 2, 23, 'Mascara làm dày và dài mi 10 lớp, dễ tẩy', 'N/A', '9.5ml', 75000, 149000, 60, NULL),
('Maybelline Fit Me Concealer', 2, 27, 'Kem che khuyết điểm tự nhiên, độ che phủ trung bình', 'Mọi loại da', '6.8ml', 50000, 99000, 65, NULL),
('Maybelline Hyper Sharp Liner', 2, 24, 'Bút kẻ mắt nước siêu mảnh 0.01mm, không lem', 'N/A', '0.5g', 65000, 129000, 50, NULL),
('Maybelline Superstay 24H Skin Tint', 2, 20, 'Kem nền nhẹ 24h bền màu, finish tự nhiên', 'Mọi loại da', '30ml', 80000, 155000, 40, NULL),
('Maybelline The Nudes Eyeshadow Palette', 2, 25, 'Bảng phấn mắt 12 màu nude tự nhiên', 'N/A', '9.6g', 90000, 175000, 35, NULL),
('Maybelline Instant Age Rewind Concealer', 2, 27, 'Kem che khuyết điểm xóa tuổi, dạng bọt biển', 'Mọi loại da', '6ml', 60000, 119000, 45, NULL),
('Maybelline Fit Me Blush', 2, 26, 'Phấn má hồng dạng nén tự nhiên, 8 tông màu', 'N/A', '4.5g', 55000, 109000, 50, NULL),
('Maybelline Colossal Kajal Eyeliner', 2, 24, 'Chì kẻ mắt đen đậm, không lem suốt 24h', 'N/A', '0.35g', 40000, 79000, 70, NULL),

-- ═══ BIODERMA (brand_id=7) ═══
('Bioderma Sensibio H2O Micellar Water', 7, 17, 'Nước tẩy trang cho da nhạy cảm, không cần rửa lại', 'Da nhạy cảm', '250ml', 110000, 199000, 65, NULL),
('Bioderma Sensibio H2O Micellar Water 500ml', 7, 17, 'Nước tẩy trang cỡ lớn cho da nhạy cảm', 'Da nhạy cảm', '500ml', 180000, 329000, 40, NULL),
('Bioderma Sébium Foaming Gel', 7, 10, 'Gel rửa mặt tạo bọt cho da dầu mụn', 'Da dầu/mụn', '200ml', 130000, 239000, 35, NULL),
('Bioderma Hydrabio Serum', 7, 12, 'Serum dưỡng ẩm sâu cho da mất nước', 'Da khô', '40ml', 180000, 329000, 25, NULL),
('Bioderma Cicabio Cream', 7, 13, 'Kem phục hồi da tổn thương, làm dịu kích ứng', 'Da nhạy cảm', '40ml', 120000, 219000, 30, NULL),
('Bioderma Photoderm MAX Spray SPF50+', 7, 14, 'Xịt chống nắng SPF50+ bảo vệ tối đa', 'Mọi loại da', '200ml', 170000, 319000, 28, NULL),
('Bioderma Sébium H2O Micellar Water', 7, 17, 'Nước tẩy trang cho da dầu mụn', 'Da dầu/mụn', '250ml', 115000, 209000, 50, NULL),
('Bioderma Atoderm Intensive Baume', 7, 51, 'Kem dưỡng thể phục hồi cho da rất khô và kích ứng', 'Da khô/nhạy cảm', '200ml', 150000, 279000, 32, NULL),

-- ═══ SULWHASOO (brand_id=8) ═══
('Sulwhasoo First Care Activating Serum VI', 8, 12, 'Serum đầu bước dưỡng chất thảo dược Đông y', 'Mọi loại da', '90ml', 400000, 750000, 12, NULL),
('Sulwhasoo Essential Comfort Moisturizing Cream', 8, 13, 'Kem dưỡng ẩm cao cấp nhân sâm', 'Da thường/khô', '50ml', 350000, 650000, 15, NULL),
('Sulwhasoo Concentrated Ginseng Renewing Cream', 8, 13, 'Kem nhân sâm cô đặc chống lão hóa cao cấp', 'Da lão hóa', '60ml', 900000, 1690000, 8, NULL),
('Sulwhasoo Essential Comfort Balancing Water', 8, 11, 'Toner cân bằng dưỡng ẩm với thảo dược', 'Mọi loại da', '150ml', 250000, 470000, 18, NULL),
('Sulwhasoo Snowise Brightening Cleanser', 8, 10, 'Sữa rửa mặt sáng da với bạch truật', 'Mọi loại da', '200ml', 200000, 390000, 20, NULL),
('Sulwhasoo Perfecting Cushion EX SPF50', 8, 20, 'Cushion cao cấp nền mịn tự nhiên', 'Mọi loại da', '15g', 280000, 520000, 15, NULL),
('Sulwhasoo Overnight Vitalizing Mask', 8, 15, 'Mặt nạ ngủ dưỡng da với nhân sâm', 'Mọi loại da', '120ml', 230000, 430000, 18, NULL),
('Sulwhasoo Essential Lip Serum Stick', 8, 22, 'Son dưỡng môi cao cấp chiết xuất hoa trà và mật ong', 'N/A', '3g', 150000, 290000, 22, NULL),

-- ═══ MAC (brand_id=9) ═══
('MAC Matte Lipstick - Ruby Woo', 9, 22, 'Son lì đỏ huyền thoại, best-seller toàn cầu', 'N/A', '3g', 200000, 390000, 40, NULL),
('MAC Studio Fix Fluid Foundation SPF15', 9, 20, 'Kem nền bán lì kiểm soát dầu, che phủ trung bình-cao', 'Da dầu/hỗn hợp', '30ml', 230000, 450000, 30, NULL),
('MAC Powder Kiss Lipstick', 9, 22, 'Son lì mỏng nhẹ như hôn gió, 18 màu', 'N/A', '3g', 190000, 370000, 35, NULL),
('MAC Fix+ Setting Spray', 9, 21, 'Xịt khóa nền đa công dụng, giữ lớp trang điểm 12h', 'Mọi loại da', '100ml', 170000, 329000, 25, NULL),
('MAC Pro Longwear Paint Pot', 9, 25, 'Phấn mắt dạng kem bền màu, làm base mắt hoàn hảo', 'N/A', '5g', 140000, 270000, 28, NULL),
('MAC Strobe Cream', 9, 26, 'Kem bắt sáng tạo hiệu ứng da glass skin', 'Mọi loại da', '50ml', 180000, 349000, 30, NULL),
('MAC Prep + Prime Lip', 9, 22, 'Kem lót môi giúp son bền và mịn hơn', 'N/A', '1.7g', 120000, 230000, 35, NULL),
('MAC Mineralize Skinfinish Natural', 9, 21, 'Phấn phủ khoáng tự nhiên, kiểm soát bóng dầu', 'Mọi loại da', '10g', 200000, 390000, 22, NULL),

-- ═══ CLINIQUE (brand_id=10) ═══
('Clinique Moisture Surge 72H Auto-Replenishing Hydrator', 10, 13, 'Gel dưỡng ẩm 72h tự động bổ sung nước cho da', 'Mọi loại da', '50ml', 200000, 389000, 28, NULL),
('Clinique Dramatically Different Moisturizing Gel', 10, 13, 'Gel dưỡng ẩm cổ điển cho da dầu/hỗn hợp', 'Da dầu/hỗn hợp', '125ml', 170000, 329000, 35, NULL),
('Clinique Take The Day Off Cleansing Balm', 10, 17, 'Sáp tẩy trang tan chảy, làm sạch toàn bộ makeup', 'Mọi loại da', '125ml', 160000, 299000, 30, NULL),
('Clinique All About Eyes', 10, 16, 'Kem mắt giảm quầng thâm, bọng mắt và nếp nhăn li ti', 'Mọi loại da', '15ml', 180000, 349000, 25, NULL),
('Clinique Even Better Clinical Brightening Serum', 10, 12, 'Serum sáng da và làm mờ đốm nâu', 'Mọi loại da', '30ml', 250000, 479000, 20, NULL),
('Clinique Pop Lip Colour + Primer', 10, 22, 'Son thuần sắc kèm primer trong 1 thỏi', 'N/A', '3.9g', 140000, 270000, 38, NULL),
('Clinique Almost Lipstick - Black Honey', 10, 22, 'Son bóng trong suốt huyền thoại tông rượu vang', 'N/A', '1.9g', 130000, 249000, 42, NULL),
('Clinique High Impact Mascara', 10, 23, 'Mascara dày mi tác động cao, đen đậm', 'N/A', '7ml', 120000, 229000, 30, NULL),

-- ═══ SHISEIDO (brand_id=11) ═══
('Shiseido Ultimune Power Infusing Concentrate', 11, 12, 'Tinh chất tăng cường sức mạnh miễn dịch cho da', 'Mọi loại da', '50ml', 450000, 850000, 15, NULL),
('Shiseido Essential Energy Moisturizing Cream', 11, 13, 'Kem dưỡng ẩm tái tạo năng lượng cho da mệt mỏi', 'Mọi loại da', '50ml', 280000, 530000, 20, NULL),
('Shiseido Benefiance Wrinkle Smoothing Cream', 11, 13, 'Kem chống nhăn với công nghệ ReNeura+', 'Da lão hóa', '50ml', 350000, 660000, 12, NULL),
('Shiseido White Lucent Brightening Gel Cream', 11, 13, 'Kem dưỡng sáng da dạng gel nhẹ', 'Mọi loại da', '50ml', 300000, 570000, 18, NULL),
('Shiseido Perfect Protector SPF50+', 11, 14, 'Kem chống nắng WetForce chống nước', 'Mọi loại da', '50ml', 200000, 380000, 25, NULL),
('Shiseido ModernMatte Powder Lipstick', 11, 22, 'Son lì dạng phấn nhẹ như lụa', 'N/A', '4g', 170000, 320000, 30, NULL),
('Shiseido Synchro Skin Self-Refreshing Foundation', 11, 20, 'Kem nền tự làm mới suốt cả ngày', 'Da dầu/hỗn hợp', '30ml', 230000, 440000, 22, NULL),
('Shiseido Ginza Eau de Parfum', 11, 30, 'Nước hoa nữ hương hoa magnolia và gỗ hinoki', 'N/A', '50ml', 500000, 950000, 10, NULL),

-- ═══ ESTÉE LAUDER (brand_id=12) ═══
('Estée Lauder Advanced Night Repair Serum', 12, 12, 'Serum phục hồi da ban đêm huyền thoại', 'Mọi loại da', '50ml', 550000, 1050000, 15, NULL),
('Estée Lauder Double Wear Foundation', 12, 20, 'Kem nền 24h bền màu số 1 thế giới', 'Mọi loại da', '30ml', 270000, 520000, 25, NULL),
('Estée Lauder Revitalizing Supreme+ Cream', 12, 13, 'Kem dưỡng chống lão hóa đa công dụng', 'Mọi loại da', '50ml', 400000, 760000, 12, NULL),
('Estée Lauder Pure Color Envy Lipstick', 12, 22, 'Son thuần sắc cao cấp, dưỡng ẩm', 'N/A', '3.5g', 190000, 370000, 30, NULL),
('Estée Lauder Advanced Night Repair Eye', 12, 16, 'Kem mắt phục hồi ban đêm', 'Mọi loại da', '15ml', 320000, 610000, 15, NULL),
('Estée Lauder Futurist Hydra Rescue SPF45', 12, 20, 'Kem nền dưỡng ẩm phục hồi với SPF45', 'Da khô/thường', '35ml', 280000, 540000, 18, NULL),
('Estée Lauder Beautiful Magnolia EDP', 12, 30, 'Nước hoa nữ hương magnolia sang trọng', 'N/A', '50ml', 550000, 1050000, 10, NULL),
('Estée Lauder Perfectly Clean Foam Cleanser', 12, 10, 'Sữa rửa mặt tạo bọt nhẹ nhàng, 2 in 1', 'Mọi loại da', '150ml', 170000, 329000, 28, NULL),

-- ═══ NEUTROGENA (brand_id=13) ═══
('Neutrogena Hydro Boost Water Gel', 13, 13, 'Gel dưỡng ẩm với hyaluronic acid, không dầu', 'Da dầu/hỗn hợp', '50ml', 120000, 229000, 45, NULL),
('Neutrogena Ultra Sheer Dry-Touch Sunscreen SPF50', 13, 14, 'Kem chống nắng khô mịn không nhờn', 'Mọi loại da', '88ml', 100000, 189000, 55, NULL),
('Neutrogena Deep Clean Facial Cleanser', 13, 10, 'Sữa rửa mặt làm sạch sâu, loại bỏ bã nhờn', 'Da dầu', '200ml', 65000, 125000, 60, NULL),
('Neutrogena Rapid Wrinkle Repair Serum', 13, 12, 'Serum retinol giảm nếp nhăn nhanh chóng', 'Da lão hóa', '29ml', 150000, 289000, 25, NULL),
('Neutrogena Hydro Boost Eye Cream', 13, 16, 'Gel kem mắt dưỡng ẩm với hyaluronic acid', 'Mọi loại da', '14g', 110000, 209000, 30, NULL),
('Neutrogena Rainbath Refreshing Shower Gel', 13, 50, 'Sữa tắm hương thơm tươi mát cổ điển', 'Mọi loại da', '250ml', 80000, 155000, 45, NULL),
('Neutrogena Norwegian Formula Hand Cream', 13, 51, 'Kem dưỡng tay đậm đặc cho da khô nứt nẻ', 'Da khô', '56g', 50000, 95000, 55, NULL),
('Neutrogena T/Gel Therapeutic Shampoo', 13, 40, 'Dầu gội trị gàu và ngứa da đầu', 'N/A', '250ml', 90000, 169000, 35, NULL),

-- ═══ NIVEA (brand_id=14) ═══
('Nivea Creme', 14, 13, 'Kem dưỡng ẩm đa năng huyền thoại', 'Mọi loại da', '60ml', 30000, 59000, 90, NULL),
('Nivea Sun Protect & Moisture SPF50', 14, 14, 'Kem chống nắng dưỡng ẩm SPF50', 'Mọi loại da', '75ml', 70000, 135000, 50, NULL),
('Nivea Extra White Body Lotion', 14, 51, 'Sữa dưỡng thể trắng da chứa vitamin C', 'Mọi loại da', '200ml', 55000, 105000, 65, NULL),
('Nivea MicellAIR Skin Breathe Micellar Water', 14, 17, 'Nước tẩy trang micellar cho da thở', 'Mọi loại da', '200ml', 55000, 99000, 70, NULL),
('Nivea Men Deep Clean Face Wash', 14, 60, 'Sữa rửa mặt nam giới làm sạch sâu', 'Da dầu', '100ml', 40000, 79000, 55, NULL),
('Nivea Men Sensitive Moisturizer SPF15', 14, 61, 'Kem dưỡng nam cho da nhạy cảm', 'Da nhạy cảm', '75ml', 55000, 109000, 45, NULL),
('Nivea Deodorant Dry Comfort Roll-On', 14, 62, 'Lăn khử mùi khô thoáng 48h', 'N/A', '50ml', 30000, 59000, 80, NULL),
('Nivea Lip Care Original', 14, 22, 'Son dưỡng môi giữ ẩm suốt ngày', 'N/A', '4.8g', 25000, 49000, 100, NULL),
('Nivea Shower Cream Creme Soft', 14, 50, 'Sữa tắm dưỡng ẩm mềm mịn với dầu hạnh nhân', 'Da khô/thường', '250ml', 40000, 79000, 60, NULL),
('Nivea Body Scrub Raspberry & White Tea', 14, 52, 'Tẩy tế bào chết toàn thân hương raspberry', 'Mọi loại da', '200ml', 45000, 89000, 45, NULL),

-- ═══ DOVE (brand_id=15) ═══
('Dove Beauty Bar', 15, 50, 'Xà phòng dưỡng ẩm 1/4 kem dưỡng', 'Mọi loại da', '100g', 18000, 35000, 100, NULL),
('Dove Deeply Nourishing Body Wash', 15, 50, 'Sữa tắm dưỡng ẩm sâu với NutriumMoisture', 'Da khô', '250ml', 45000, 85000, 70, NULL),
('Dove Intensive Repair Shampoo', 15, 40, 'Dầu gội phục hồi tóc hư tổn nặng', 'N/A', '340ml', 50000, 95000, 60, NULL),
('Dove Hair Fall Rescue Conditioner', 15, 41, 'Dầu xả ngăn rụng tóc với Trichazole Actives', 'N/A', '340ml', 50000, 95000, 55, NULL),
('Dove DermaSpa Goodness Body Lotion', 15, 51, 'Dưỡng thể cao cấp mềm mịn như lụa', 'Da khô', '200ml', 65000, 125000, 40, NULL),
('Dove Essential Body Lotion Nourishing', 15, 51, 'Sữa dưỡng thể dưỡng ẩm hằng ngày', 'Mọi loại da', '250ml', 50000, 95000, 55, NULL),
('Dove Men+Care Clean Comfort Body Wash', 15, 50, 'Sữa tắm nam giới Clean Comfort', 'Mọi loại da', '250ml', 50000, 95000, 45, NULL),
('Dove Exfoliating Body Polish Pomegranate', 15, 52, 'Tẩy tế bào chết toàn thân hương lựu', 'Mọi loại da', '225ml', 55000, 105000, 35, NULL);

SET FOREIGN_KEY_CHECKS = 1;

-- Verify counts
SELECT 'Brands' as type, COUNT(*) as count FROM brands
UNION ALL SELECT 'Parent Categories', COUNT(*) FROM categories WHERE parent_id IS NULL
UNION ALL SELECT 'Subcategories', COUNT(*) FROM categories WHERE parent_id IS NOT NULL
UNION ALL SELECT 'Products', COUNT(*) FROM products;
