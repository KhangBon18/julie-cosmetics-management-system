-- ============================================================
-- JulieCosmetics — Database Schema (Production-Ready)
-- MySQL 8.0 | UTF8MB4 | Engine: InnoDB
-- Last updated: 2026-03-29 (post-migration 001–009)
-- ============================================================

CREATE DATABASE IF NOT EXISTS julie_cosmetics
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE julie_cosmetics;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. NHÓM NHÂN SỰ ──────────────────────────────────────────

CREATE TABLE positions (
  position_id    INT            AUTO_INCREMENT PRIMARY KEY,
  position_name  VARCHAR(100)   NOT NULL COMMENT 'Manager / NV Bán hàng / Thủ kho',
  base_salary    DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'Lương cơ bản theo chức vụ',
  description    TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục chức vụ';

CREATE TABLE employees (
  employee_id    INT            AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(100)   NOT NULL,
  email          VARCHAR(100)   NOT NULL UNIQUE,
  phone          VARCHAR(15)    NULL,
  address        TEXT           NULL,
  gender         ENUM('Nam','Nữ') NOT NULL DEFAULT 'Nam',
  date_of_birth  DATE           NULL,
  hire_date      DATE           NOT NULL,
  base_salary    DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'Lương hiện tại (đồng bộ với employee_positions mới nhất)',
  status         ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP      NULL,
  INDEX idx_employees_status (status),
  INDEX idx_employees_deleted (deleted_at)
) ENGINE=InnoDB COMMENT='Thông tin nhân viên';

CREATE TABLE employee_positions (
  id             INT            AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT            NOT NULL,
  position_id    INT            NOT NULL,
  effective_date DATE           NOT NULL COMMENT 'Ngày nhận chức vụ',
  end_date       DATE           NULL     COMMENT 'NULL = đang giữ chức vụ này',
  salary_at_time DECIMAL(12,2)  NOT NULL COMMENT 'Lương tại thời điểm nhận chức vụ',
  note           TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_ep_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  FOREIGN KEY (position_id) REFERENCES positions(position_id),
  INDEX idx_ep_employee_current (employee_id, end_date)
) ENGINE=InnoDB COMMENT='Lịch sử chức vụ nhân viên';

CREATE TABLE users (
  user_id        INT            AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)    NOT NULL UNIQUE,
  password_hash  VARCHAR(255)   NOT NULL,
  role           ENUM('admin','manager','staff','warehouse') NOT NULL DEFAULT 'staff',
  employee_id    INT            NULL COMMENT 'NULL = tài khoản hệ thống không gắn NV',
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  last_login     TIMESTAMP      NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP      NULL,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL,
  INDEX idx_users_deleted (deleted_at)
) ENGINE=InnoDB COMMENT='Tài khoản đăng nhập hệ thống';

CREATE TABLE leave_requests (
  request_id     INT            AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT            NOT NULL,
  leave_type     ENUM('annual','sick','maternity','unpaid','resignation') NOT NULL DEFAULT 'annual',
  start_date     DATE           NOT NULL,
  end_date       DATE           NOT NULL,
  total_days     INT            NOT NULL DEFAULT 1,
  reason         TEXT           NOT NULL,
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approved_by    INT            NULL,
  approved_at    TIMESTAMP      NULL,
  reject_reason  TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_leave_date_range CHECK (end_date >= start_date),
  CONSTRAINT fk_lr_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_leave_emp_status (employee_id, status),
  INDEX idx_leave_emp_dates (employee_id, start_date, end_date, status)
) ENGINE=InnoDB COMMENT='Đơn xin nghỉ phép';

CREATE TABLE salaries (
  salary_id           INT            AUTO_INCREMENT PRIMARY KEY,
  employee_id         INT            NOT NULL,
  month               TINYINT        NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                YEAR           NOT NULL,
  work_days_standard  INT            NOT NULL DEFAULT 22,
  work_days_actual    INT            NOT NULL,
  unpaid_leave_days   INT            NOT NULL DEFAULT 0,
  base_salary         DECIMAL(12,2)  NOT NULL COMMENT 'Lương cơ bản tháng này',
  gross_salary        DECIMAL(12,2)  NOT NULL COMMENT '= base * (actual/standard)',
  bonus               DECIMAL(12,2)  NOT NULL DEFAULT 0,
  deductions          DECIMAL(12,2)  NOT NULL DEFAULT 0,
  net_salary          DECIMAL(12,2)  NOT NULL COMMENT '= gross + bonus - deductions',
  notes               TEXT           NULL,
  generated_at        TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  generated_by        INT            NULL,
  UNIQUE KEY uq_emp_month (employee_id, month, year),
  CONSTRAINT fk_sal_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_salaries_year_month (year, month)
) ENGINE=InnoDB COMMENT='Bảng lương tháng';

CREATE TABLE salary_bonus_adjustments (
  bonus_id            INT            AUTO_INCREMENT PRIMARY KEY,
  employee_id         INT            NOT NULL,
  month               TINYINT        NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                YEAR           NOT NULL,
  amount              DECIMAL(12,2)  NOT NULL DEFAULT 0,
  reason              VARCHAR(255)   NOT NULL,
  created_by          INT            NULL,
  updated_by          INT            NULL,
  created_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bonus_employee_period (employee_id, month, year),
  CONSTRAINT chk_bonus_amount_non_negative CHECK (amount >= 0),
  CONSTRAINT fk_bonus_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_bonus_year_month (year, month)
) ENGINE=InnoDB COMMENT='Thiết lập thưởng theo kỳ lương';

-- ── 2. NHÓM KHO & SẢN PHẨM ───────────────────────────────────

CREATE TABLE brands (
  brand_id       INT            AUTO_INCREMENT PRIMARY KEY,
  brand_name     VARCHAR(100)   NOT NULL,
  origin_country VARCHAR(100)   NULL,
  description    TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP      NULL,
  INDEX idx_brands_deleted (deleted_at)
) ENGINE=InnoDB COMMENT='Thương hiệu mỹ phẩm';

CREATE TABLE categories (
  category_id    INT            AUTO_INCREMENT PRIMARY KEY,
  parent_id      INT            NULL,
  category_name  VARCHAR(100)   NOT NULL,
  description    TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE CASCADE,
  INDEX idx_categories_parent_id (parent_id)
) ENGINE=InnoDB COMMENT='Danh mục sản phẩm';

CREATE TABLE suppliers (
  supplier_id    INT            AUTO_INCREMENT PRIMARY KEY,
  supplier_name  VARCHAR(200)   NOT NULL,
  contact_person VARCHAR(100)   NULL,
  phone          VARCHAR(15)    NULL,
  email          VARCHAR(100)   NULL,
  address        TEXT           NULL,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP      NULL,
  INDEX idx_suppliers_deleted (deleted_at)
) ENGINE=InnoDB COMMENT='Nhà cung cấp';

CREATE TABLE products (
  product_id     INT            AUTO_INCREMENT PRIMARY KEY,
  product_name   VARCHAR(200)   NOT NULL,
  brand_id       INT            NOT NULL,
  category_id    INT            NOT NULL,
  description    TEXT           NULL,
  skin_type      VARCHAR(100)   NULL COMMENT 'Da dầu / Da khô / Da hỗn hợp / Mọi loại da',
  volume         VARCHAR(50)    NULL COMMENT 'VD: 50ml, 30g',
  import_price   DECIMAL(12,2)  NOT NULL DEFAULT 0,
  sell_price     DECIMAL(12,2)  NOT NULL DEFAULT 0,
  stock_quantity INT            NOT NULL DEFAULT 0,
  image_url      VARCHAR(255)   NULL,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP      NULL,
  FOREIGN KEY (brand_id)    REFERENCES brands(brand_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  INDEX idx_products_brand_id (brand_id),
  INDEX idx_products_category_id (category_id),
  INDEX idx_products_is_active (is_active),
  INDEX idx_products_sell_price (sell_price),
  INDEX idx_products_deleted (deleted_at),
  FULLTEXT INDEX ft_products_search (product_name, description)
) ENGINE=InnoDB COMMENT='Sản phẩm mỹ phẩm';

CREATE TABLE supplier_products (
  supplier_id    INT            NOT NULL,
  product_id     INT            NOT NULL,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (supplier_id, product_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_supplier_products_product_id (product_id),
  INDEX idx_supplier_products_is_active (is_active)
) ENGINE=InnoDB COMMENT='Danh mục sản phẩm có thể nhập từ từng nhà cung cấp';

CREATE TABLE import_receipts (
  receipt_id     INT            AUTO_INCREMENT PRIMARY KEY,
  supplier_id    INT            NOT NULL,
  created_by     INT            NULL,
  total_amount   DECIMAL(12,2)  NOT NULL DEFAULT 0,
  status         ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
  note           TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (created_by)  REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_import_receipts_created_at (created_at),
  INDEX idx_import_receipts_supplier_id (supplier_id)
) ENGINE=InnoDB COMMENT='Phiếu nhập kho';

CREATE TABLE import_receipt_items (
  item_id        INT            AUTO_INCREMENT PRIMARY KEY,
  receipt_id     INT            NOT NULL,
  product_id     INT            NOT NULL,
  quantity       INT            NOT NULL DEFAULT 1,
  unit_price     DECIMAL(12,2)  NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES import_receipts(receipt_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  INDEX idx_import_items_receipt_id (receipt_id),
  INDEX idx_import_items_product_id (product_id)
) ENGINE=InnoDB COMMENT='Chi tiết phiếu nhập kho';

-- ── 3. NHÓM BÁN HÀNG & CRM ────────────────────────────────────

CREATE TABLE customers (
  customer_id      INT            AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(100)   NOT NULL,
  phone            VARCHAR(15)    NOT NULL UNIQUE,
  email            VARCHAR(100)   NULL,
  password_hash    VARCHAR(255)   NULL COMMENT 'Bcrypt hash. NULL = KH chưa đăng ký tài khoản online',
  address          TEXT           NULL,
  gender           ENUM('Nam','Nữ') NULL,
  date_of_birth    DATE           NULL,
  membership_tier  ENUM('standard','silver','gold') NOT NULL DEFAULT 'standard',
  total_points     INT            NOT NULL DEFAULT 0,
  total_spent      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at       TIMESTAMP      NULL,
  INDEX idx_customers_membership (membership_tier),
  INDEX idx_customers_email (email),
  INDEX idx_customers_deleted (deleted_at)
) ENGINE=InnoDB COMMENT='Khách hàng thành viên CRM';

CREATE TABLE invoices (
  invoice_id       INT            AUTO_INCREMENT PRIMARY KEY,
  customer_id      INT            NULL COMMENT 'NULL = khách vãng lai',
  created_by       INT            NULL,
  subtotal         DECIMAL(12,2)  NOT NULL DEFAULT 0,
  discount_percent DECIMAL(5,2)   NOT NULL DEFAULT 0,
  discount_amount  DECIMAL(12,2)  NOT NULL DEFAULT 0,
  final_total      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  points_earned    INT            NOT NULL DEFAULT 0,
  payment_method   ENUM('cash','card','transfer') NOT NULL DEFAULT 'cash',
  status           ENUM('draft','confirmed','paid','completed','refunded','cancelled')
                                  NOT NULL DEFAULT 'paid' COMMENT 'Invoice workflow status',
  promotion_id     INT            NULL,
  note             TEXT           NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(user_id)        ON DELETE SET NULL,
  INDEX idx_invoices_created_at (created_at),
  INDEX idx_invoices_customer_id (customer_id),
  INDEX idx_invoices_payment_method (payment_method),
  INDEX idx_invoices_status (status)
) ENGINE=InnoDB COMMENT='Hóa đơn bán hàng';

CREATE TABLE invoice_items (
  item_id        INT            AUTO_INCREMENT PRIMARY KEY,
  invoice_id     INT            NOT NULL,
  product_id     INT            NOT NULL,
  quantity       INT            NOT NULL DEFAULT 1,
  unit_price     DECIMAL(12,2)  NOT NULL,
  subtotal       DECIMAL(12,2)  NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  INDEX idx_invoice_items_invoice_id (invoice_id),
  INDEX idx_invoice_items_product_id (product_id)
) ENGINE=InnoDB COMMENT='Chi tiết hóa đơn bán hàng';

CREATE TABLE reviews (
  review_id      INT            AUTO_INCREMENT PRIMARY KEY,
  product_id     INT            NOT NULL,
  customer_id    INT            NULL,
  rating         TINYINT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT           NULL,
  is_visible     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_product (customer_id, product_id),
  FOREIGN KEY (product_id)  REFERENCES products(product_id)  ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  INDEX idx_reviews_product_id (product_id),
  INDEX idx_reviews_customer_id (customer_id)
) ENGINE=InnoDB COMMENT='Đánh giá sản phẩm';

-- ── 4. AUDIT & INVENTORY TRACKING ─────────────────────────────

CREATE TABLE audit_logs (
  log_id       BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id      INT            NULL COMMENT 'Staff user_id or NULL for system actions',
  user_type    ENUM('staff','customer','system') NOT NULL DEFAULT 'staff',
  action       VARCHAR(50)    NOT NULL COMMENT 'CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT',
  entity_type  VARCHAR(50)    NOT NULL COMMENT 'invoice, product, employee, customer, etc.',
  entity_id    INT            NULL COMMENT 'PK of affected record',
  old_values   JSON           NULL COMMENT 'State before change (for UPDATE/DELETE)',
  new_values   JSON           NULL COMMENT 'State after change (for CREATE/UPDATE)',
  ip_address   VARCHAR(45)    NULL COMMENT 'Client IP (supports IPv6)',
  user_agent   VARCHAR(500)   NULL COMMENT 'Browser/client user agent',
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_user (user_id, created_at),
  INDEX idx_audit_action (action, created_at),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB COMMENT='System-wide audit trail for all data changes';

CREATE TABLE inventory_movements (
  movement_id    BIGINT         AUTO_INCREMENT PRIMARY KEY,
  product_id     INT            NOT NULL,
  movement_type  ENUM('import','sale','return','adjustment','damage','transfer')
                                NOT NULL,
  quantity       INT            NOT NULL COMMENT 'Positive = in, Negative = out',
  stock_before   INT            NOT NULL COMMENT 'Stock level before this movement',
  stock_after    INT            NOT NULL COMMENT 'Stock level after this movement',
  reference_type VARCHAR(50)    NULL COMMENT 'import_receipt, invoice, manual',
  reference_id   INT            NULL COMMENT 'PK of the source document',
  unit_cost      DECIMAL(12,2)  NULL COMMENT 'Cost per unit at time of movement',
  note           TEXT           NULL,
  created_by     INT            NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_inv_mov_product (product_id, created_at),
  INDEX idx_inv_mov_type (movement_type, created_at),
  INDEX idx_inv_mov_ref (reference_type, reference_id),
  INDEX idx_inv_mov_created (created_at)
) ENGINE=InnoDB COMMENT='Complete inventory movement history for audit and reconciliation';

-- ── 5. RBAC ────────────────────────────────────────────────────

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

-- ── 6. PRODUCT IMAGES & SKIN TYPES ────────────────────────────

CREATE TABLE product_images (
  image_id     INT            AUTO_INCREMENT PRIMARY KEY,
  product_id   INT            NOT NULL,
  image_url    VARCHAR(500)   NOT NULL,
  alt_text     VARCHAR(200)   NULL,
  sort_order   INT            NOT NULL DEFAULT 0,
  is_primary   BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_pi_product (product_id, sort_order)
) ENGINE=InnoDB COMMENT='Gallery ảnh sản phẩm (N ảnh / sản phẩm)';

CREATE TABLE skin_types (
  skin_type_id   INT            AUTO_INCREMENT PRIMARY KEY,
  skin_type_name VARCHAR(100)   NOT NULL UNIQUE,
  description    VARCHAR(255)   NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục loại da chuẩn hóa';

CREATE TABLE product_skin_types (
  product_id    INT NOT NULL,
  skin_type_id  INT NOT NULL,
  PRIMARY KEY (product_id, skin_type_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (skin_type_id) REFERENCES skin_types(skin_type_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Sản phẩm phù hợp loại da nào (N:N)';

-- ── 7. PROMOTIONS ──────────────────────────────────────────────

CREATE TABLE promotions (
  promotion_id   INT            AUTO_INCREMENT PRIMARY KEY,
  code           VARCHAR(50)    NULL UNIQUE COMMENT 'Mã coupon. NULL = auto-apply promotion',
  title          VARCHAR(200)   NOT NULL,
  description    TEXT           NULL,
  discount_type  ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(12,2)  NOT NULL,
  min_order      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  max_discount   DECIMAL(12,2)  NULL,
  usage_limit    INT            NULL,
  usage_count    INT            NOT NULL DEFAULT 0,
  start_date     DATETIME       NOT NULL,
  end_date       DATETIME       NOT NULL,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_by     INT            NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_promo_code (code),
  INDEX idx_promo_dates (start_date, end_date, is_active),
  INDEX idx_promo_active (is_active, start_date, end_date)
) ENGINE=InnoDB COMMENT='Chương trình khuyến mãi & mã giảm giá';

-- ── 8. NOTIFICATIONS & SETTINGS ───────────────────────────────

CREATE TABLE notifications (
  notification_id  BIGINT         AUTO_INCREMENT PRIMARY KEY,
  user_id          INT            NULL,
  user_type        ENUM('staff','customer') NOT NULL DEFAULT 'staff',
  title            VARCHAR(200)   NOT NULL,
  message          TEXT           NOT NULL,
  type             ENUM('info','warning','success','error') NOT NULL DEFAULT 'info',
  is_read          BOOLEAN        NOT NULL DEFAULT FALSE,
  link             VARCHAR(500)   NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id, user_type, is_read),
  INDEX idx_notif_created (created_at),
  INDEX idx_notif_unread (user_id, is_read, created_at)
) ENGINE=InnoDB COMMENT='Thông báo cho staff và customer';

CREATE TABLE settings (
  setting_id    INT            AUTO_INCREMENT PRIMARY KEY,
  setting_key   VARCHAR(100)   NOT NULL UNIQUE,
  setting_value TEXT           NOT NULL,
  data_type     ENUM('string','number','boolean','json') NOT NULL DEFAULT 'string',
  category      VARCHAR(50)    NOT NULL DEFAULT 'general',
  description   VARCHAR(255)   NULL,
  is_public     BOOLEAN        NOT NULL DEFAULT FALSE,
  updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by    INT            NULL,
  FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_settings_category (category),
  INDEX idx_settings_public (is_public)
) ENGINE=InnoDB COMMENT='Cấu hình hệ thống key-value';

-- ── 9. AUTH & SECURITY ─────────────────────────────────────────

CREATE TABLE refresh_tokens (
  token_id    BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  user_type   ENUM('staff','customer') NOT NULL DEFAULT 'staff',
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  device_info VARCHAR(255) NULL,
  ip_address  VARCHAR(45) NULL,
  expires_at  TIMESTAMP NOT NULL,
  revoked_at  TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rt_user (user_id, user_type, revoked_at),
  INDEX idx_rt_expires (expires_at),
  INDEX idx_rt_hash (token_hash)
) ENGINE=InnoDB COMMENT='JWT refresh tokens for rotation and revocation';

CREATE TABLE login_attempts (
  attempt_id  BIGINT AUTO_INCREMENT PRIMARY KEY,
  identifier  VARCHAR(100) NOT NULL,
  ip_address  VARCHAR(45) NOT NULL,
  user_agent  VARCHAR(500) NULL,
  success     BOOLEAN NOT NULL DEFAULT FALSE,
  failure_reason VARCHAR(100) NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_la_identifier (identifier, created_at),
  INDEX idx_la_ip (ip_address, created_at),
  INDEX idx_la_created (created_at)
) ENGINE=InnoDB COMMENT='Login attempt tracking for brute-force protection';

-- ── 10. E-COMMERCE WORKFLOWS ───────────────────────────────────

CREATE TABLE payment_transactions (
  transaction_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  invoice_id   INT NOT NULL,
  amount       DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  payment_method ENUM('cash','card','transfer','momo','zalopay','vnpay') NOT NULL,
  status       ENUM('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'pending',
  transaction_ref VARCHAR(100) NULL,
  gateway_response JSON NULL,
  note         TEXT NULL,
  confirmed_by INT NULL,
  confirmed_at TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
  FOREIGN KEY (confirmed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_pt_invoice (invoice_id),
  INDEX idx_pt_status (status, created_at),
  INDEX idx_pt_ref (transaction_ref)
) ENGINE=InnoDB COMMENT='Payment transaction tracking per invoice';

CREATE TABLE customer_addresses (
  address_id  INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  label       VARCHAR(50) NULL,
  recipient   VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) NOT NULL,
  province    VARCHAR(100) NOT NULL,
  district    VARCHAR(100) NOT NULL,
  ward        VARCHAR(100) NULL,
  street      VARCHAR(255) NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  INDEX idx_ca_customer (customer_id, is_default)
) ENGINE=InnoDB COMMENT='Địa chỉ giao hàng khách hàng';

CREATE TABLE shipping_orders (
  shipping_id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  INT NOT NULL UNIQUE,
  address_id  INT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(15) NOT NULL,
  shipping_address TEXT NOT NULL,
  status      ENUM('pending','processing','shipped','delivered','failed','returned') NOT NULL DEFAULT 'pending',
  tracking_code VARCHAR(100) NULL,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (shipping_fee >= 0),
  shipped_at  TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  note        TEXT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
  FOREIGN KEY (address_id) REFERENCES customer_addresses(address_id) ON DELETE SET NULL,
  INDEX idx_so_status (status, created_at),
  INDEX idx_so_tracking (tracking_code)
) ENGINE=InnoDB COMMENT='Đơn giao hàng';

CREATE TABLE returns (
  return_id   INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id  INT NOT NULL,
  customer_id INT NULL,
  return_type ENUM('refund','exchange') NOT NULL DEFAULT 'refund',
  status      ENUM('requested','approved','processing','completed','rejected') NOT NULL DEFAULT 'requested',
  reason      TEXT NOT NULL,
  total_refund DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (total_refund >= 0),
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  note        TEXT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_ret_invoice (invoice_id),
  INDEX idx_ret_status (status, created_at)
) ENGINE=InnoDB COMMENT='Yêu cầu đổi/trả hàng';

CREATE TABLE return_items (
  item_id     INT AUTO_INCREMENT PRIMARY KEY,
  return_id   INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL,
  unit_price  DECIMAL(12,2) NOT NULL,
  refund_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  reason      VARCHAR(255) NULL,
  FOREIGN KEY (return_id) REFERENCES returns(return_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  INDEX idx_ri_return (return_id)
) ENGINE=InnoDB COMMENT='Chi tiết sản phẩm trả lại';

-- ── TRIGGERS ──────────────────────────────────────────────────


DELIMITER $$

-- Tự động trừ tồn kho khi thêm dòng hóa đơn
CREATE TRIGGER trg_invoice_item_insert
AFTER INSERT ON invoice_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE product_id = NEW.product_id;
END$$

-- Tự động cộng lại tồn kho khi xóa dòng hóa đơn
CREATE TRIGGER trg_invoice_item_delete
BEFORE DELETE ON invoice_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + OLD.quantity
  WHERE product_id = OLD.product_id;
END$$

-- Tự động cộng tồn kho khi nhập hàng và tính lại giá vốn trung bình (Moving Average Price)
CREATE TRIGGER trg_import_item_insert
AFTER INSERT ON import_receipt_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET import_price = IF(stock_quantity + NEW.quantity > 0, 
                        (import_price * stock_quantity + NEW.unit_price * NEW.quantity) / (stock_quantity + NEW.quantity), 
                        import_price),
      stock_quantity = stock_quantity + NEW.quantity
  WHERE product_id = NEW.product_id;
END$$

-- Tự động trừ tồn kho khi xóa phiếu nhập
CREATE TRIGGER trg_import_item_delete
BEFORE DELETE ON import_receipt_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity - OLD.quantity
  WHERE product_id = OLD.product_id;
END$$

-- Tự động cập nhật điểm, tổng chi và hạng thành viên KH sau khi tạo hóa đơn
CREATE TRIGGER trg_invoice_after_insert
AFTER INSERT ON invoices
FOR EACH ROW
BEGIN
  IF NEW.customer_id IS NOT NULL AND NEW.status IN ('paid', 'completed') THEN
    UPDATE customers
    SET total_points = total_points + NEW.points_earned,
        total_spent  = total_spent  + NEW.final_total,
        membership_tier = CASE
          WHEN (total_points + NEW.points_earned) >= 500 THEN 'gold'
          WHEN (total_points + NEW.points_earned) >= 100 THEN 'silver'
          ELSE 'standard'
        END
    WHERE customer_id = NEW.customer_id;
  END IF;
END$$

-- Rollback CRM points/total_spent/tier khi xóa hóa đơn
CREATE TRIGGER trg_invoice_before_delete
BEFORE DELETE ON invoices
FOR EACH ROW
BEGIN
  IF OLD.customer_id IS NOT NULL AND OLD.status IN ('paid', 'completed') THEN
    UPDATE customers
    SET total_points = GREATEST(0, total_points - OLD.points_earned),
        total_spent  = GREATEST(0, total_spent - OLD.final_total),
        membership_tier = CASE
          WHEN GREATEST(0, total_points - OLD.points_earned) >= 500 THEN 'gold'
          WHEN GREATEST(0, total_points - OLD.points_earned) >= 100 THEN 'silver'
          ELSE 'standard'
        END
    WHERE customer_id = OLD.customer_id;
  END IF;
END$$

-- Cập nhật: Rollback CRM points và hàng hóa khi Invoice chuyển sang trạng thái Hủy.
-- Refund được xử lý ở luồng returns để hỗ trợ partial/full refund chính xác.
CREATE TRIGGER trg_invoice_after_update
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE products p
    JOIN invoice_items ii ON p.product_id = ii.product_id
    SET p.stock_quantity = p.stock_quantity + ii.quantity
    WHERE ii.invoice_id = NEW.invoice_id;

    IF NEW.customer_id IS NOT NULL AND OLD.status IN ('paid', 'completed') THEN
      UPDATE customers
      SET total_points = GREATEST(0, total_points - OLD.points_earned),
          total_spent  = GREATEST(0, total_spent - OLD.final_total),
          membership_tier = CASE
            WHEN GREATEST(0, total_points - OLD.points_earned) >= 500 THEN 'gold'
            WHEN GREATEST(0, total_points - OLD.points_earned) >= 100 THEN 'silver'
            ELSE 'standard'
          END
      WHERE customer_id = NEW.customer_id;
    END IF;
  ELSEIF OLD.status = 'cancelled' AND (NEW.status = 'paid' OR NEW.status = 'completed') THEN
    UPDATE products p
    JOIN invoice_items ii ON p.product_id = ii.product_id
    SET p.stock_quantity = p.stock_quantity - ii.quantity
    WHERE ii.invoice_id = NEW.invoice_id;

    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET total_points = total_points + NEW.points_earned,
          total_spent  = total_spent + NEW.final_total,
          membership_tier = CASE
            WHEN (total_points + NEW.points_earned) >= 500 THEN 'gold'
            WHEN (total_points + NEW.points_earned) >= 100 THEN 'silver'
            ELSE 'standard'
          END
      WHERE customer_id = NEW.customer_id;
    END IF;
  ELSEIF OLD.status NOT IN ('paid', 'completed') AND (NEW.status = 'paid' OR NEW.status = 'completed') THEN
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET total_points = total_points + NEW.points_earned,
          total_spent  = total_spent + NEW.final_total,
          membership_tier = CASE
            WHEN (total_points + NEW.points_earned) >= 500 THEN 'gold'
            WHEN (total_points + NEW.points_earned) >= 100 THEN 'silver'
            ELSE 'standard'
          END
      WHERE customer_id = NEW.customer_id;
    END IF;
  END IF;
END$$

-- Cập nhật: Trừ tồn kho khi Phiếu nhập bị Hủy (Soft-cancel)
CREATE TRIGGER trg_import_after_update
AFTER UPDATE ON import_receipts
FOR EACH ROW
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    UPDATE products p
    JOIN import_receipt_items iri ON p.product_id = iri.product_id
    SET p.stock_quantity = p.stock_quantity - iri.quantity
    WHERE iri.receipt_id = NEW.receipt_id;
  END IF;
  
  IF OLD.status = 'cancelled' AND NEW.status = 'completed' THEN
    UPDATE products p
    JOIN import_receipt_items iri ON p.product_id = iri.product_id
    SET p.stock_quantity = p.stock_quantity + iri.quantity
    WHERE iri.receipt_id = NEW.receipt_id;
  END IF;
END$$

-- Chặn 1 nhân sự được gắn với nhiều tài khoản hệ thống chưa xóa
CREATE TRIGGER trg_users_unique_employee_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.employee_id IS NOT NULL
     AND NEW.deleted_at IS NULL
     AND EXISTS (
       SELECT 1
       FROM users u
       WHERE u.employee_id = NEW.employee_id
         AND u.deleted_at IS NULL
     ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Mỗi nhân viên chỉ được liên kết với một tài khoản hệ thống chưa xóa';
  END IF;
END$$

CREATE TRIGGER trg_users_unique_employee_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.employee_id IS NOT NULL
     AND NEW.deleted_at IS NULL
     AND EXISTS (
       SELECT 1
       FROM users u
       WHERE u.employee_id = NEW.employee_id
         AND u.deleted_at IS NULL
         AND u.user_id <> OLD.user_id
     ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Mỗi nhân viên chỉ được liên kết với một tài khoản hệ thống chưa xóa';
  END IF;
END$$

DELIMITER ;

-- Add foreign key after both tables are created
ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id) ON DELETE SET NULL;

SET FOREIGN_KEY_CHECKS = 1;
