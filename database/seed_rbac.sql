-- ============================================================
-- JulieCosmetics — RBAC Seed Data
-- Chạy sau seed.sql để đồng bộ role_id + quyền mặc định
-- ============================================================

USE julie_cosmetics;
SET NAMES utf8mb4;

-- Đảm bảo schema users tương thích RBAC ngay cả khi schema.sql chưa có role_id
SET @add_role_id_sql = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'role_id'
    ),
    'SELECT 1',
    'ALTER TABLE users ADD COLUMN role_id INT NULL COMMENT ''FK to roles table (RBAC)'' AFTER role'
  )
);
PREPARE add_role_id_stmt FROM @add_role_id_sql;
EXECUTE add_role_id_stmt;
DEALLOCATE PREPARE add_role_id_stmt;

-- ── SYSTEM ROLES ─────────────────────────────────────────────
INSERT INTO roles (role_name, description, is_system) VALUES
('admin',     'Quản trị viên hệ thống — toàn quyền', TRUE),
('manager',   'Quản lý — quản lý nhân sự, duyệt đơn, xem báo cáo', TRUE),
('staff_portal', 'Nhân viên tự phục vụ — hồ sơ cá nhân, nghỉ phép và bảng lương', TRUE),
('sales',     'Nhân viên kinh doanh — bán hàng nội bộ, chăm sóc khách hàng và xem báo cáo kinh doanh', TRUE),
('staff',     'Nhân viên bán hàng — tạo hóa đơn, quản lý khách hàng', TRUE),
('warehouse', 'Thủ kho — quản lý nhập kho, kiểm kho', TRUE)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  is_system = VALUES(is_system);

-- ── CORE PERMISSIONS ─────────────────────────────────────────
INSERT INTO permissions (permission_name, module, action, description) VALUES
('employees.read',   'employees', 'read',   'Xem danh sách nhân viên'),
('employees.create', 'employees', 'create', 'Thêm nhân viên'),
('employees.update', 'employees', 'update', 'Sửa thông tin nhân viên'),
('employees.delete', 'employees', 'delete', 'Xóa nhân viên'),
('employees.export', 'employees', 'export', 'Xuất dữ liệu nhân viên'),
('products.read',    'products',  'read',   'Xem sản phẩm'),
('products.create',  'products',  'create', 'Thêm sản phẩm'),
('products.update',  'products',  'update', 'Sửa sản phẩm'),
('products.delete',  'products',  'delete', 'Xóa sản phẩm'),
('products.export',  'products',  'export', 'Xuất dữ liệu sản phẩm'),
('invoices.read',    'invoices',  'read',   'Xem hóa đơn'),
('invoices.create',  'invoices',  'create', 'Tạo hóa đơn'),
('invoices.update',  'invoices',  'update', 'Sửa hóa đơn'),
('invoices.delete',  'invoices',  'delete', 'Hủy hóa đơn'),
('invoices.export',  'invoices',  'export', 'Xuất dữ liệu hóa đơn'),
('customers.read',   'customers', 'read',   'Xem khách hàng'),
('customers.create', 'customers', 'create', 'Thêm khách hàng'),
('customers.update', 'customers', 'update', 'Sửa khách hàng'),
('customers.delete', 'customers', 'delete', 'Xóa khách hàng'),
('customers.export', 'customers', 'export', 'Xuất dữ liệu khách hàng'),
('imports.read',     'imports',   'read',   'Xem phiếu nhập kho'),
('imports.create',   'imports',   'create', 'Tạo phiếu nhập kho'),
('imports.delete',   'imports',   'delete', 'Hủy phiếu nhập kho'),
('reports.read',     'reports',   'read',   'Xem báo cáo'),
('reports.export',   'reports',   'export', 'Xuất báo cáo'),
('users.read',       'users',     'read',   'Xem danh sách tài khoản'),
('users.create',     'users',     'create', 'Tạo tài khoản'),
('users.update',     'users',     'update', 'Sửa tài khoản'),
('users.delete',     'users',     'delete', 'Xóa tài khoản'),
('leaves.read',      'leaves',    'read',   'Xem đơn nghỉ phép'),
('leaves.create',    'leaves',    'create', 'Tạo đơn nghỉ phép'),
('leaves.update',    'leaves',    'update', 'Duyệt đơn nghỉ phép'),
('attendances.read', 'attendances','read',  'Xem chấm công'),
('attendances.create','attendances','create','Tạo bản ghi chấm công'),
('attendances.update','attendances','update','Sửa chấm công và duyệt điều chỉnh'),
('attendances.delete','attendances','delete','Xóa bản ghi chấm công'),
('attendances.export','attendances','export','Xuất dữ liệu chấm công'),
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
('returns.update',   'returns',    'update', 'Duyệt và hoàn tất yêu cầu đổi trả'),
('salaries.read',    'salaries',  'read',   'Xem bảng lương'),
('salaries.create',  'salaries',  'create', 'Tạo bảng lương'),
('salaries.update',  'salaries',  'update', 'Sửa bảng lương'),
('salaries.delete',  'salaries',  'delete', 'Xóa bảng lương'),
('salaries.export',  'salaries',  'export', 'Xuất bảng lương'),
('brands.read',      'brands',    'read',   'Xem thương hiệu'),
('brands.create',    'brands',    'create', 'Thêm thương hiệu'),
('brands.update',    'brands',    'update', 'Sửa thương hiệu'),
('brands.delete',    'brands',    'delete', 'Xóa thương hiệu'),
('categories.read',  'categories','read',   'Xem danh mục'),
('categories.create','categories','create', 'Thêm danh mục'),
('categories.update','categories','update', 'Sửa danh mục'),
('categories.delete','categories','delete', 'Xóa danh mục'),
('suppliers.read',   'suppliers', 'read',   'Xem nhà cung cấp'),
('suppliers.create', 'suppliers', 'create', 'Thêm nhà cung cấp'),
('suppliers.update', 'suppliers', 'update', 'Sửa nhà cung cấp'),
('suppliers.delete', 'suppliers', 'delete', 'Xóa nhà cung cấp'),
('positions.read',   'positions', 'read',   'Xem chức vụ'),
('positions.create', 'positions', 'create', 'Thêm chức vụ'),
('positions.update', 'positions', 'update', 'Sửa chức vụ'),
('positions.delete', 'positions', 'delete', 'Xóa chức vụ'),
('reviews.read',     'reviews',   'read',   'Xem đánh giá'),
('reviews.update',   'reviews',   'update', 'Ẩn/hiện đánh giá'),
('reviews.delete',   'reviews',   'delete', 'Xóa đánh giá'),
('roles.read',       'roles',     'read',   'Xem nhóm quyền'),
('roles.create',     'roles',     'create', 'Tạo nhóm quyền'),
('roles.update',     'roles',     'update', 'Sửa nhóm quyền'),
('roles.delete',     'roles',     'delete', 'Xóa nhóm quyền'),
('settings.read',    'settings',  'read',   'Xem cấu hình'),
('settings.update',  'settings',  'update', 'Sửa cấu hình')
ON DUPLICATE KEY UPDATE
  module = VALUES(module),
  action = VALUES(action),
  description = VALUES(description);

-- ── APP DATABASE USER ────────────────────────────────────────
-- The MySQL container creates this account from DB_USER/DB_PASSWORD in docker-compose.
-- Keep only the grant here so the SQL seed does not carry application credentials.
GRANT ALL PRIVILEGES ON julie_cosmetics.* TO 'julie_app'@'%';
FLUSH PRIVILEGES;

-- Xóa quyền mặc định cũ của system roles trước khi gán lại để tránh stale grants.
DELETE rp
FROM role_permissions rp
JOIN roles r ON r.role_id = rp.role_id
WHERE r.role_name IN ('admin', 'manager', 'staff_portal', 'sales', 'staff', 'warehouse');

-- ── DEFAULT ROLE ASSIGNMENTS ─────────────────────────────────
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'manager'
  AND p.permission_name IN (
    'employees.read', 'employees.create', 'employees.update', 'employees.delete', 'employees.export',
    'positions.read', 'positions.create', 'positions.update', 'positions.delete',
    'leaves.read', 'leaves.create', 'leaves.update',
    'attendances.read', 'attendances.create', 'attendances.update', 'attendances.export',
    'promotions.read', 'promotions.create', 'promotions.update', 'promotions.delete',
    'payments.read', 'payments.update',
    'shipping.read', 'shipping.update',
    'returns.read', 'returns.update',
    'salaries.read', 'salaries.create', 'salaries.update', 'salaries.delete', 'salaries.export',
    'reports.read', 'reports.export'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'staff_portal'
  AND p.permission_name IN ('leaves.read', 'leaves.create');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'staff'
  AND p.permission_name IN (
    'invoices.read', 'invoices.create', 'invoices.export',
    'customers.read', 'customers.create', 'customers.update', 'customers.export',
    'products.read',
    'shipping.read',
    'returns.read', 'returns.create',
    'leaves.read', 'leaves.create'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'sales'
  AND p.permission_name IN (
    'invoices.read', 'invoices.create', 'invoices.export',
    'customers.read', 'customers.create', 'customers.update', 'customers.export',
    'products.read',
    'shipping.read',
    'returns.read', 'returns.create',
    'reports.read', 'reports.export'
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'warehouse'
  AND p.permission_name IN (
    'products.read', 'products.create', 'products.update', 'products.delete', 'products.export',
    'brands.read', 'brands.create', 'brands.update', 'brands.delete',
    'categories.read', 'categories.create', 'categories.update', 'categories.delete',
    'suppliers.read', 'suppliers.create', 'suppliers.update', 'suppliers.delete',
    'imports.read', 'imports.create', 'imports.delete',
    'shipping.read', 'shipping.update',
    'returns.read',
    'reports.read', 'reports.export',
    'leaves.read', 'leaves.create'
  );

-- ── BACKFILL LEGACY USERS -> role_id ─────────────────────────
-- `role_id` là nguồn RBAC chính; chỉ backfill khi còn NULL.
-- Legacy enum `staff` được tách thành:
--   - staff_portal: tài khoản nhân viên thuần tự phục vụ
--   - sales: tài khoản kinh doanh; có thể vẫn gắn employee_id để dùng self-service cá nhân
UPDATE users u
JOIN roles r_sales ON r_sales.role_name = 'sales'
JOIN roles r_staff_portal ON r_staff_portal.role_name = 'staff_portal'
SET u.role_id = CASE
  WHEN u.employee_id IS NOT NULL THEN r_staff_portal.role_id
  ELSE r_sales.role_id
END
WHERE u.deleted_at IS NULL
  AND u.role = 'staff'
  AND u.role_id IS NULL;

UPDATE users u
JOIN roles r_sales ON r_sales.role_name = 'sales'
SET u.role_id = r_sales.role_id
WHERE u.deleted_at IS NULL
  AND u.username = 'sales01';

UPDATE users u
JOIN roles r ON r.role_name = u.role
SET u.role_id = r.role_id
WHERE u.deleted_at IS NULL
  AND u.role_id IS NULL
  AND u.role IN ('admin', 'manager', 'warehouse');
