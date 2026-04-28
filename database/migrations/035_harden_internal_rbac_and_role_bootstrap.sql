USE julie_cosmetics;
SET NAMES utf8mb4;

INSERT INTO permissions (permission_name, module, action, description) VALUES
('promotions.read',  'promotions', 'read',   'Xem chương trình khuyến mãi'),
('promotions.create','promotions', 'create', 'Tạo chương trình khuyến mãi'),
('promotions.update','promotions', 'update', 'Cập nhật chương trình khuyến mãi'),
('promotions.delete','promotions', 'delete', 'Xóa chương trình khuyến mãi'),
('payments.read',    'payments',   'read',   'Xem giao dịch thanh toán'),
('payments.update',  'payments',   'update', 'Xác nhận hoặc hoàn tiền giao dịch'),
('shipping.read',    'shipping',   'read',   'Xem đơn giao hàng'),
('shipping.update',  'shipping',   'update', 'Cập nhật đơn giao hàng'),
('returns.read',     'returns',    'read',   'Xem yêu cầu đổi trả'),
('returns.create',   'returns',    'create', 'Tạo yêu cầu đổi trả'),
('returns.update',   'returns',    'update', 'Duyệt và hoàn tất yêu cầu đổi trả')
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
  'promotions.read', 'promotions.create', 'promotions.update', 'promotions.delete',
  'payments.read', 'payments.update',
  'shipping.read', 'shipping.update',
  'returns.read', 'returns.create', 'returns.update'
)
WHERE r.role_name = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
  'promotions.read', 'promotions.create', 'promotions.update', 'promotions.delete',
  'payments.read', 'payments.update',
  'shipping.read', 'shipping.update',
  'returns.read', 'returns.update'
)
WHERE r.role_name = 'manager';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
  'shipping.read',
  'returns.read',
  'returns.create'
)
WHERE r.role_name IN ('sales', 'staff');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
  'shipping.read',
  'shipping.update',
  'returns.read'
)
WHERE r.role_name = 'warehouse';

UPDATE users u
JOIN roles r_sales ON r_sales.role_name = 'sales'
JOIN roles r_staff_portal ON r_staff_portal.role_name = 'staff_portal'
LEFT JOIN roles r_staff ON r_staff.role_name = 'staff'
SET u.role_id = CASE
  WHEN u.employee_id IS NOT NULL THEN r_staff_portal.role_id
  ELSE r_sales.role_id
END
WHERE u.role = 'staff'
  AND u.deleted_at IS NULL
  AND (u.role_id IS NULL OR u.role_id = r_staff.role_id);

UPDATE users u
JOIN roles r_legacy ON r_legacy.role_name = u.role
SET u.role_id = r_legacy.role_id
WHERE u.deleted_at IS NULL
  AND u.role_id IS NULL
  AND u.role IN ('admin', 'manager', 'warehouse');
