-- ============================================================
-- Migration 010: Create RBAC tables (roles, permissions, role_permissions)
-- Priority: P2-01 — Phase 2
-- Risk: LOW (new tables + data migration for existing roles)
-- Downtime: NO
-- Backup: Recommended
-- Backend sync: REQUIRED — add role_id FK to users, update authMiddleware
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────

CREATE TABLE roles (
  role_id      INT            AUTO_INCREMENT PRIMARY KEY,
  role_name    VARCHAR(50)    NOT NULL UNIQUE,
  description  VARCHAR(255)   NULL,
  is_system    BOOLEAN        NOT NULL DEFAULT FALSE COMMENT 'System roles cannot be deleted',
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh sách vai trò hệ thống';

CREATE TABLE permissions (
  permission_id   INT            AUTO_INCREMENT PRIMARY KEY,
  permission_name VARCHAR(100)   NOT NULL UNIQUE,
  module          VARCHAR(50)    NOT NULL COMMENT 'employees, products, invoices, etc.',
  action          ENUM('read','create','update','delete','export') NOT NULL,
  description     VARCHAR(255)   NULL,
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_perm_module_action (module, action)
) ENGINE=InnoDB COMMENT='Quyền truy cập theo module + action';

CREATE TABLE role_permissions (
  role_id       INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Gán quyền cho vai trò (N:N)';

-- Add role_id FK to users (keep ENUM for backward compat during transition)
ALTER TABLE users
  ADD COLUMN role_id INT NULL COMMENT 'FK to roles table (replaces ENUM role)' AFTER role;

ALTER TABLE users
  ADD CONSTRAINT fk_users_role
  FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE SET NULL;

CREATE INDEX idx_users_role_id ON users(role_id);

-- Seed system roles matching existing ENUM values
INSERT INTO roles (role_name, description, is_system) VALUES
  ('admin',     'Quản trị viên hệ thống — toàn quyền', TRUE),
  ('manager',   'Quản lý — quản lý nhân sự, duyệt đơn, xem báo cáo', TRUE),
  ('staff',     'Nhân viên bán hàng — tạo hóa đơn, quản lý khách hàng', TRUE),
  ('warehouse', 'Thủ kho — quản lý nhập kho, kiểm kho', TRUE);

-- Seed permissions for all modules
INSERT INTO permissions (permission_name, module, action, description) VALUES
  -- Employees
  ('employees.read',   'employees', 'read',   'Xem danh sách nhân viên'),
  ('employees.create', 'employees', 'create', 'Thêm nhân viên'),
  ('employees.update', 'employees', 'update', 'Sửa thông tin nhân viên'),
  ('employees.delete', 'employees', 'delete', 'Xóa nhân viên'),
  ('employees.export', 'employees', 'export', 'Xuất dữ liệu nhân viên'),
  -- Products
  ('products.read',   'products', 'read',   'Xem sản phẩm'),
  ('products.create', 'products', 'create', 'Thêm sản phẩm'),
  ('products.update', 'products', 'update', 'Sửa sản phẩm'),
  ('products.delete', 'products', 'delete', 'Xóa sản phẩm'),
  ('products.export', 'products', 'export', 'Xuất dữ liệu sản phẩm'),
  -- Invoices
  ('invoices.read',   'invoices', 'read',   'Xem hóa đơn'),
  ('invoices.create', 'invoices', 'create', 'Tạo hóa đơn'),
  ('invoices.update', 'invoices', 'update', 'Sửa hóa đơn'),
  ('invoices.delete', 'invoices', 'delete', 'Xóa hóa đơn'),
  ('invoices.export', 'invoices', 'export', 'Xuất dữ liệu hóa đơn'),
  -- Customers
  ('customers.read',   'customers', 'read',   'Xem khách hàng'),
  ('customers.create', 'customers', 'create', 'Thêm khách hàng'),
  ('customers.update', 'customers', 'update', 'Sửa thông tin khách hàng'),
  ('customers.delete', 'customers', 'delete', 'Xóa khách hàng'),
  ('customers.export', 'customers', 'export', 'Xuất dữ liệu khách hàng'),
  -- Imports
  ('imports.read',   'imports', 'read',   'Xem phiếu nhập kho'),
  ('imports.create', 'imports', 'create', 'Tạo phiếu nhập kho'),
  ('imports.delete', 'imports', 'delete', 'Xóa phiếu nhập kho'),
  -- Reports
  ('reports.read',   'reports', 'read',   'Xem báo cáo'),
  ('reports.export', 'reports', 'export', 'Xuất báo cáo'),
  -- Users/Settings
  ('users.read',   'users', 'read',   'Xem danh sách tài khoản'),
  ('users.create', 'users', 'create', 'Tạo tài khoản'),
  ('users.update', 'users', 'update', 'Sửa tài khoản'),
  ('users.delete', 'users', 'delete', 'Xóa tài khoản'),
  -- Leaves
  ('leaves.read',    'leaves', 'read',   'Xem đơn nghỉ phép'),
  ('leaves.create',  'leaves', 'create', 'Tạo đơn nghỉ phép'),
  ('leaves.update',  'leaves', 'update', 'Duyệt/từ chối đơn nghỉ phép'),
  -- Salaries
  ('salaries.read',   'salaries', 'read',   'Xem bảng lương'),
  ('salaries.create', 'salaries', 'create', 'Tạo bảng lương'),
  ('salaries.update', 'salaries', 'update', 'Sửa bảng lương'),
  ('salaries.delete', 'salaries', 'delete', 'Xóa bảng lương'),
  -- Settings
  ('settings.read',   'settings', 'read',   'Xem cấu hình'),
  ('settings.update', 'settings', 'update', 'Sửa cấu hình');

-- Admin gets ALL permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions;

-- Manager gets most permissions except users/settings management
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions
WHERE module NOT IN ('users', 'settings');

-- Staff gets read + create on invoices/customers, read products
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, permission_id FROM permissions
WHERE (module = 'invoices' AND action IN ('read', 'create'))
   OR (module = 'customers' AND action IN ('read', 'create', 'update'))
   OR (module = 'products' AND action = 'read')
   OR (module = 'leaves' AND action IN ('read', 'create'));

-- Warehouse gets imports + products read/update
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions
WHERE (module = 'imports')
   OR (module = 'products' AND action IN ('read', 'update'))
   OR (module = 'leaves' AND action IN ('read', 'create'));

-- Sync existing users: map ENUM role → role_id
UPDATE users SET role_id = 1 WHERE role = 'admin';
UPDATE users SET role_id = 2 WHERE role = 'manager';
UPDATE users SET role_id = 3 WHERE role = 'staff';
UPDATE users SET role_id = 4 WHERE role = 'warehouse';

-- ── DOWN ───────────────────────────────────────────────────────
-- UPDATE users SET role_id = NULL;
-- ALTER TABLE users DROP FOREIGN KEY fk_users_role;
-- ALTER TABLE users DROP COLUMN role_id;
-- DROP TABLE IF EXISTS role_permissions;
-- DROP TABLE IF EXISTS permissions;
-- DROP TABLE IF EXISTS roles;

-- ── NOTES ──────────────────────────────────────────────────────
-- • The ENUM `role` column on `users` is kept for backward compatibility.
--   Once backend is fully migrated to use role_id, the ENUM column
--   can be dropped in a future migration.
-- • authMiddleware.js should be updated to resolve permissions via
--   role_id → role_permissions → permissions for fine-grained access.
-- • For now, the existing roleCheck('admin','manager') pattern
--   continues to work since we keep the ENUM column.
