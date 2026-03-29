-- ============================================================
-- Migration 020: Create returns + return_items tables
-- Phase 3A — Business Workflows (returns/refunds)
-- Risk: LOW (new tables)
-- ============================================================

USE julie_cosmetics;

CREATE TABLE returns (
  return_id       INT            AUTO_INCREMENT PRIMARY KEY,
  invoice_id      INT            NOT NULL,
  customer_id     INT            NULL,
  return_type     ENUM('refund','exchange') NOT NULL DEFAULT 'refund',
  status          ENUM('requested','approved','processing','completed','rejected')
                                 NOT NULL DEFAULT 'requested',
  reason          TEXT           NOT NULL,
  total_refund    DECIMAL(12,2)  NOT NULL DEFAULT 0,
  approved_by     INT            NULL,
  approved_at     TIMESTAMP      NULL,
  completed_at    TIMESTAMP      NULL,
  note            TEXT           NULL,
  created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_ret_invoice (invoice_id),
  INDEX idx_ret_status (status, created_at)
) ENGINE=InnoDB COMMENT='Yêu cầu đổi/trả hàng';

CREATE TABLE return_items (
  item_id       INT            AUTO_INCREMENT PRIMARY KEY,
  return_id     INT            NOT NULL,
  product_id    INT            NOT NULL,
  quantity      INT            NOT NULL,
  unit_price    DECIMAL(12,2)  NOT NULL,
  reason        VARCHAR(255)   NULL,

  FOREIGN KEY (return_id) REFERENCES returns(return_id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  INDEX idx_ri_return (return_id)
) ENGINE=InnoDB COMMENT='Chi tiết sản phẩm trả lại';
