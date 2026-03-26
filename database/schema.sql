-- ============================================================
-- JulieCosmetics — Database Schema
-- MySQL 8.0 | UTF8MB4 | Engine: InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS julie_cosmetics
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE julie_cosmetics;

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. NHÓM NHÂN SỰ ──────────────────────────────────────────

CREATE TABLE positions (
  position_id    INT            AUTO_INCREMENT PRIMARY KEY,
  position_name  VARCHAR(100)   NOT NULL COMMENT 'Manager / NV Bán hàng / Thủ kho',
  base_salary    DECIMAL(12,2)  NOT NULL DEFAULT 0 COMMENT 'Lương cơ bản theo chức vụ',
  description    TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
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
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
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
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (position_id) REFERENCES positions(position_id)
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
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Tài khoản đăng nhập hệ thống';

CREATE TABLE leave_requests (
  request_id     INT            AUTO_INCREMENT PRIMARY KEY,
  employee_id    INT            NOT NULL,
  leave_type     ENUM('annual','sick','maternity','unpaid') NOT NULL DEFAULT 'annual',
  start_date     DATE           NOT NULL,
  end_date       DATE           NOT NULL,
  total_days     INT            NOT NULL DEFAULT 1,
  reason         TEXT           NOT NULL,
  status         ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  approved_by    INT            NULL,
  approved_at    TIMESTAMP      NULL,
  reject_reason  TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL
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
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Bảng lương tháng';

-- ── 2. NHÓM KHO & SẢN PHẨM ───────────────────────────────────

CREATE TABLE brands (
  brand_id       INT            AUTO_INCREMENT PRIMARY KEY,
  brand_name     VARCHAR(100)   NOT NULL,
  origin_country VARCHAR(100)   NULL,
  description    TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Thương hiệu mỹ phẩm';

CREATE TABLE categories (
  category_id    INT            AUTO_INCREMENT PRIMARY KEY,
  category_name  VARCHAR(100)   NOT NULL,
  description    TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục sản phẩm';

CREATE TABLE suppliers (
  supplier_id    INT            AUTO_INCREMENT PRIMARY KEY,
  supplier_name  VARCHAR(200)   NOT NULL,
  contact_person VARCHAR(100)   NULL,
  phone          VARCHAR(15)    NULL,
  email          VARCHAR(100)   NULL,
  address        TEXT           NULL,
  is_active      BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
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
  FOREIGN KEY (brand_id)    REFERENCES brands(brand_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id)
) ENGINE=InnoDB COMMENT='Sản phẩm mỹ phẩm';

CREATE TABLE import_receipts (
  receipt_id     INT            AUTO_INCREMENT PRIMARY KEY,
  supplier_id    INT            NOT NULL,
  created_by     INT            NULL,
  total_amount   DECIMAL(12,2)  NOT NULL DEFAULT 0,
  note           TEXT           NULL,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (created_by)  REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Phiếu nhập kho';

CREATE TABLE import_receipt_items (
  item_id        INT            AUTO_INCREMENT PRIMARY KEY,
  receipt_id     INT            NOT NULL,
  product_id     INT            NOT NULL,
  quantity       INT            NOT NULL DEFAULT 1,
  unit_price     DECIMAL(12,2)  NOT NULL,
  FOREIGN KEY (receipt_id) REFERENCES import_receipts(receipt_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB COMMENT='Chi tiết phiếu nhập kho';

-- ── 3. NHÓM BÁN HÀNG & CRM ────────────────────────────────────

CREATE TABLE customers (
  customer_id      INT            AUTO_INCREMENT PRIMARY KEY,
  full_name        VARCHAR(100)   NOT NULL,
  phone            VARCHAR(15)    NOT NULL UNIQUE,
  email            VARCHAR(100)   NULL,
  address          TEXT           NULL,
  gender           ENUM('Nam','Nữ') NULL,
  date_of_birth    DATE           NULL,
  membership_tier  ENUM('standard','silver','gold') NOT NULL DEFAULT 'standard',
  total_points     INT            NOT NULL DEFAULT 0,
  total_spent      DECIMAL(12,2)  NOT NULL DEFAULT 0,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
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
  note             TEXT           NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  FOREIGN KEY (created_by)  REFERENCES users(user_id)        ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Hóa đơn bán hàng';

CREATE TABLE invoice_items (
  item_id        INT            AUTO_INCREMENT PRIMARY KEY,
  invoice_id     INT            NOT NULL,
  product_id     INT            NOT NULL,
  quantity       INT            NOT NULL DEFAULT 1,
  unit_price     DECIMAL(12,2)  NOT NULL,
  subtotal       DECIMAL(12,2)  NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id)
) ENGINE=InnoDB COMMENT='Chi tiết hóa đơn bán hàng';

CREATE TABLE reviews (
  review_id      INT            AUTO_INCREMENT PRIMARY KEY,
  product_id     INT            NOT NULL,
  customer_id    INT            NOT NULL,
  rating         TINYINT        NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT           NULL,
  is_visible     BOOLEAN        NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_customer_product (customer_id, product_id),
  FOREIGN KEY (product_id)  REFERENCES products(product_id)  ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Đánh giá sản phẩm';

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

-- Tự động cộng tồn kho khi nhập hàng
CREATE TRIGGER trg_import_item_insert
AFTER INSERT ON import_receipt_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET stock_quantity = stock_quantity + NEW.quantity,
      import_price   = NEW.unit_price
  WHERE product_id = NEW.product_id;
END$$

-- Tự động cập nhật điểm, tổng chi và hạng thành viên KH sau khi tạo hóa đơn
CREATE TRIGGER trg_invoice_after_insert
AFTER INSERT ON invoices
FOR EACH ROW
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
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

DELIMITER ;

SET FOREIGN_KEY_CHECKS = 1;
