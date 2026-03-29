-- ============================================================
-- Migration 019: Create customer_addresses + shipping_orders
-- Phase 3A — Business Workflows
-- Risk: LOW (new tables)
-- Note: customer_addresses MUST be created before shipping_orders (FK)
-- ============================================================

USE julie_cosmetics;

CREATE TABLE customer_addresses (
  address_id    INT            AUTO_INCREMENT PRIMARY KEY,
  customer_id   INT            NOT NULL,
  label         VARCHAR(50)    NULL COMMENT 'Nhà, Công ty, etc.',
  recipient     VARCHAR(100)   NOT NULL,
  phone         VARCHAR(15)    NOT NULL,
  province      VARCHAR(100)   NOT NULL,
  district      VARCHAR(100)   NOT NULL,
  ward          VARCHAR(100)   NULL,
  street        VARCHAR(255)   NOT NULL,
  is_default    BOOLEAN        NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  INDEX idx_ca_customer (customer_id, is_default)
) ENGINE=InnoDB COMMENT='Địa chỉ giao hàng của khách hàng (N/customer)';

CREATE TABLE shipping_orders (
  shipping_id      INT            AUTO_INCREMENT PRIMARY KEY,
  invoice_id       INT            NOT NULL UNIQUE,
  address_id       INT            NULL,
  recipient_name   VARCHAR(100)   NOT NULL,
  recipient_phone  VARCHAR(15)    NOT NULL,
  shipping_address TEXT           NOT NULL,
  status           ENUM('pending','processing','shipped','delivered','failed','returned')
                                  NOT NULL DEFAULT 'pending',
  tracking_code    VARCHAR(100)   NULL,
  shipping_fee     DECIMAL(12,2)  NOT NULL DEFAULT 0,
  shipped_at       TIMESTAMP      NULL,
  delivered_at     TIMESTAMP      NULL,
  note             TEXT           NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
  FOREIGN KEY (address_id) REFERENCES customer_addresses(address_id) ON DELETE SET NULL,
  INDEX idx_so_status (status, created_at),
  INDEX idx_so_tracking (tracking_code)
) ENGINE=InnoDB COMMENT='Đơn giao hàng gắn với invoice';
