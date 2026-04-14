-- Migration 025: Extend leave workflow to support resignation requests

ALTER TABLE leave_requests
  MODIFY COLUMN leave_type ENUM('annual','sick','maternity','unpaid','resignation')
  NOT NULL DEFAULT 'annual';
