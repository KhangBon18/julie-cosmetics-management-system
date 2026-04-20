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
INSERT IGNORE INTO roles (role_name, description, is_system) VALUES
('admin',     'Quản trị viên hệ thống — toàn quyền', TRUE),
('manager',   'Quản lý — quản lý nhân sự, duyệt đơn, xem báo cáo', TRUE),
('staff_portal', 'Nhân viên tự phục vụ — hồ sơ cá nhân, nghỉ phép và bảng lương', TRUE),
('sales',     'Nhân viên kinh doanh — bán hàng nội bộ, chăm sóc khách hàng và xem báo cáo kinh doanh', TRUE),
('staff',     'Nhân viên bán hàng — tạo hóa đơn, quản lý khách hàng', TRUE),
('warehouse', 'Thủ kho — quản lý nhập kho, kiểm kho', TRUE);

-- ── CORE PERMISSIONS ─────────────────────────────────────────
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
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
('salaries.read',    'salaries',  'read',   'Xem bảng lương'),
('salaries.create',  'salaries',  'create', 'Tạo bảng lương'),
('salaries.update',  'salaries',  'update', 'Sửa bảng lương'),
('salaries.delete',  'salaries',  'delete', 'Xóa bảng lương'),
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
('settings.update',  'settings',  'update', 'Sửa cấu hình');

-- ── APP DATABASE USER ────────────────────────────────────────
CREATE USER IF NOT EXISTS 'julie_app'@'%' IDENTIFIED BY 'julie_demo_123';
ALTER USER 'julie_app'@'%' IDENTIFIED BY 'julie_demo_123';
GRANT ALL PRIVILEGES ON julie_cosmetics.* TO 'julie_app'@'%';
FLUSH PRIVILEGES;

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
  AND p.module NOT IN ('users', 'settings', 'roles');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'staff_portal'
  AND (
    p.module = 'leaves' AND p.action IN ('read', 'create')
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'staff'
  AND (
    (p.module = 'invoices' AND p.action IN ('read', 'create'))
    OR (p.module = 'customers' AND p.action IN ('read', 'create', 'update'))
    OR (p.module = 'products' AND p.action = 'read')
    OR (p.module = 'leaves' AND p.action IN ('read', 'create'))
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'sales'
  AND (
    (p.module = 'invoices' AND p.action IN ('read', 'create'))
    OR (p.module = 'customers' AND p.action IN ('read', 'create', 'update'))
    OR (p.module = 'products' AND p.action = 'read')
    OR (p.module = 'reports' AND p.action = 'read')
  );

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p
WHERE r.role_name = 'warehouse'
  AND (
    p.module = 'imports'
    OR (p.module = 'products' AND p.action IN ('read', 'update'))
    OR (p.module IN ('brands', 'categories', 'suppliers') AND p.action = 'read')
    OR (p.module = 'reports' AND p.action = 'read')
    OR (p.module = 'leaves' AND p.action IN ('read', 'create'))
  );

-- ── SYNC LEGACY USERS -> role_id ─────────────────────────────
UPDATE users u
JOIN roles r ON r.role_name = u.role
SET u.role_id = r.role_id
WHERE u.deleted_at IS NULL
  AND (u.role_id IS NULL OR u.role_id <> r.role_id);
