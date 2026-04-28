-- Seed demo promotions for audit/smoke verification

INSERT IGNORE INTO promotions (
  code,
  title,
  description,
  discount_type,
  discount_value,
  min_order,
  max_discount,
  usage_limit,
  start_date,
  end_date,
  is_active,
  created_by
)
VALUES
  (
    'WELCOME10',
    'Giảm 10% cho đơn đầu tiên',
    'Khuyến mãi demo: giảm 10% cho đơn từ 100,000đ',
    'percent',
    10.00,
    100000.00,
    100000.00,
    500,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    1,
    1
  ),
  (
    'SALE50K',
    'Giảm 50,000đ cho đơn từ 500,000đ',
    'Khuyến mãi demo: giảm trực tiếp 50,000đ',
    'fixed',
    50000.00,
    500000.00,
    NULL,
    300,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    1,
    1
  ),
  (
    'MEMBER20',
    'VIP giảm 20%',
    'Khuyến mãi demo cho khách hàng thành viên',
    'percent',
    20.00,
    200000.00,
    150000.00,
    200,
    NOW(),
    DATE_ADD(NOW(), INTERVAL 60 DAY),
    1,
    1
  );
