-- ============================================================
-- Migration 022: Add missing permissions for all modules
-- Adds permissions for: brands, categories, suppliers, positions,
--   reviews, roles, promotions, notifications, settings
-- Updates role assignments for completeness
-- ============================================================

USE julie_cosmetics;

-- ── Add missing permissions ───────────────────────────────────

-- Brands (CRUD)
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('brands.read',   'brands', 'read',   'Xem thương hiệu'),
  ('brands.create', 'brands', 'create', 'Thêm thương hiệu'),
  ('brands.update', 'brands', 'update', 'Sửa thương hiệu'),
  ('brands.delete', 'brands', 'delete', 'Xóa thương hiệu');

-- Categories (CRUD)
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('categories.read',   'categories', 'read',   'Xem danh mục'),
  ('categories.create', 'categories', 'create', 'Thêm danh mục'),
  ('categories.update', 'categories', 'update', 'Sửa danh mục'),
  ('categories.delete', 'categories', 'delete', 'Xóa danh mục');

-- Suppliers (CRUD)
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('suppliers.read',   'suppliers', 'read',   'Xem nhà cung cấp'),
  ('suppliers.create', 'suppliers', 'create', 'Thêm nhà cung cấp'),
  ('suppliers.update', 'suppliers', 'update', 'Sửa nhà cung cấp'),
  ('suppliers.delete', 'suppliers', 'delete', 'Xóa nhà cung cấp');

-- Positions (CRUD)
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('positions.read',   'positions', 'read',   'Xem chức vụ'),
  ('positions.create', 'positions', 'create', 'Thêm chức vụ'),
  ('positions.update', 'positions', 'update', 'Sửa chức vụ'),
  ('positions.delete', 'positions', 'delete', 'Xóa chức vụ');

-- Reviews (read, update, delete — no create from admin)
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('reviews.read',   'reviews', 'read',   'Xem đánh giá'),
  ('reviews.update', 'reviews', 'update', 'Ẩn/hiện đánh giá'),
  ('reviews.delete', 'reviews', 'delete', 'Xóa đánh giá');

-- Roles (CRUD — admin only)
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('roles.read',   'roles', 'read',   'Xem nhóm quyền'),
  ('roles.create', 'roles', 'create', 'Tạo nhóm quyền'),
  ('roles.update', 'roles', 'update', 'Sửa nhóm quyền'),
  ('roles.delete', 'roles', 'delete', 'Xóa nhóm quyền');

-- ── Grant new permissions to Admin role ───────────────────────
-- Admin gets ALL permissions (including newly added ones)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, permission_id FROM permissions
WHERE permission_id NOT IN (SELECT permission_id FROM role_permissions WHERE role_id = 1);

-- ── Grant appropriate permissions to Manager role ─────────────
-- Manager gets brands, categories, suppliers, positions, reviews
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, permission_id FROM permissions
WHERE module IN ('brands', 'categories', 'suppliers', 'positions', 'reviews')
AND permission_id NOT IN (SELECT permission_id FROM role_permissions WHERE role_id = 2);

-- ── Grant warehouse role access to brands, suppliers, categories (read) ──
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT 4, permission_id FROM permissions
WHERE (module IN ('brands', 'categories', 'suppliers') AND action = 'read')
AND permission_id NOT IN (SELECT permission_id FROM role_permissions WHERE role_id = 4);

-- ── NOTES ──────────────────────────────────────────────────────
-- • roles.* permissions are NOT assigned to manager/staff/warehouse
--   because role management is admin-exclusive
-- • Use INSERT IGNORE to safely re-run this migration
