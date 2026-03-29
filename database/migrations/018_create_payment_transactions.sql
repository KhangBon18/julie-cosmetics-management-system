-- ============================================================
-- Migration 018: Create payment_transactions table
-- Phase 3A — Business Workflows
-- Risk: LOW (new table + FK to invoices)
-- ============================================================

USE julie_cosmetics;

CREATE TABLE payment_transactions (
  transaction_id   BIGINT         AUTO_INCREMENT PRIMARY KEY,
  invoice_id       INT            NOT NULL,
  amount           DECIMAL(12,2)  NOT NULL,
  payment_method   ENUM('cash','card','transfer','momo','zalopay','vnpay') NOT NULL,
  status           ENUM('pending','confirmed','failed','refunded') NOT NULL DEFAULT 'pending',
  transaction_ref  VARCHAR(100)   NULL COMMENT 'Mã giao dịch từ cổng thanh toán',
  gateway_response JSON           NULL COMMENT 'Raw response từ payment gateway',
  note             TEXT           NULL,
  confirmed_by     INT            NULL,
  confirmed_at     TIMESTAMP      NULL,
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE RESTRICT,
  FOREIGN KEY (confirmed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_pt_invoice (invoice_id),
  INDEX idx_pt_status (status, created_at),
  INDEX idx_pt_ref (transaction_ref)
) ENGINE=InnoDB COMMENT='Payment transaction tracking per invoice';
