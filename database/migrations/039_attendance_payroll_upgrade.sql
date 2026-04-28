-- ============================================================
-- Migration 039: Attendance & Payroll Professional Upgrade
-- Safe to re-run (IF NOT EXISTS / IGNORE throughout)
-- ============================================================

-- 1. attendance_periods — kỳ công theo tháng
CREATE TABLE IF NOT EXISTS attendance_periods (
  period_id INT AUTO_INCREMENT PRIMARY KEY,
  month TINYINT NOT NULL,
  year YEAR NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('open','locked') NOT NULL DEFAULT 'open',
  locked_by INT NULL,
  locked_at TIMESTAMP NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_att_period (month, year),
  CONSTRAINT fk_att_period_locked_by FOREIGN KEY (locked_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Kỳ công theo tháng';

-- 2. payroll_periods — kỳ lương với workflow trạng thái
CREATE TABLE IF NOT EXISTS payroll_periods (
  period_id INT AUTO_INCREMENT PRIMARY KEY,
  month TINYINT NOT NULL,
  year YEAR NOT NULL,
  attendance_period_id INT NULL,
  status ENUM('draft','calculated','approved','paid','locked') NOT NULL DEFAULT 'draft',
  total_employees INT NOT NULL DEFAULT 0,
  total_gross DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_net DECIMAL(15,2) NOT NULL DEFAULT 0,
  calculated_by INT NULL,
  calculated_at TIMESTAMP NULL,
  approved_by INT NULL,
  approved_at TIMESTAMP NULL,
  paid_by INT NULL,
  paid_at TIMESTAMP NULL,
  locked_by INT NULL,
  locked_at TIMESTAMP NULL,
  note TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_payroll_period (month, year),
  CONSTRAINT fk_pp_att_period FOREIGN KEY (attendance_period_id) REFERENCES attendance_periods(period_id) ON DELETE SET NULL,
  CONSTRAINT fk_pp_calc FOREIGN KEY (calculated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_pp_appr FOREIGN KEY (approved_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_pp_paid FOREIGN KEY (paid_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_pp_lock FOREIGN KEY (locked_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Kỳ lương theo tháng';

-- 3. ALTER salaries — add detailed breakdown columns
-- Using stored procedure for safe column additions
DROP PROCEDURE IF EXISTS _039_alter_salaries;
DELIMITER //
CREATE PROCEDURE _039_alter_salaries()
BEGIN
  -- payroll_period_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='payroll_period_id') THEN
    ALTER TABLE salaries ADD COLUMN payroll_period_id INT NULL AFTER salary_id;
    ALTER TABLE salaries ADD CONSTRAINT fk_sal_pp FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(period_id) ON DELETE SET NULL;
  END IF;
  -- paid_leave_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='paid_leave_days') THEN
    ALTER TABLE salaries ADD COLUMN paid_leave_days INT NOT NULL DEFAULT 0 AFTER work_days_actual;
  END IF;
  -- absent_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='absent_days') THEN
    ALTER TABLE salaries ADD COLUMN absent_days INT NOT NULL DEFAULT 0 AFTER paid_leave_days;
  END IF;
  -- total_late_minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='total_late_minutes') THEN
    ALTER TABLE salaries ADD COLUMN total_late_minutes INT NOT NULL DEFAULT 0 AFTER unpaid_leave_days;
  END IF;
  -- total_early_leave_minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='total_early_leave_minutes') THEN
    ALTER TABLE salaries ADD COLUMN total_early_leave_minutes INT NOT NULL DEFAULT 0 AFTER total_late_minutes;
  END IF;
  -- total_overtime_minutes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='total_overtime_minutes') THEN
    ALTER TABLE salaries ADD COLUMN total_overtime_minutes INT NOT NULL DEFAULT 0 AFTER total_early_leave_minutes;
  END IF;
  -- overtime_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='overtime_amount') THEN
    ALTER TABLE salaries ADD COLUMN overtime_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER total_overtime_minutes;
  END IF;
  -- allowance_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='allowance_amount') THEN
    ALTER TABLE salaries ADD COLUMN allowance_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER overtime_amount;
  END IF;
  -- late_penalty_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='late_penalty_amount') THEN
    ALTER TABLE salaries ADD COLUMN late_penalty_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER allowance_amount;
  END IF;
  -- early_leave_penalty_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='early_leave_penalty_amount') THEN
    ALTER TABLE salaries ADD COLUMN early_leave_penalty_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER late_penalty_amount;
  END IF;
  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='status') THEN
    ALTER TABLE salaries ADD COLUMN status ENUM('draft','approved','paid','locked') NOT NULL DEFAULT 'draft' AFTER net_salary;
  END IF;
END //
DELIMITER ;
CALL _039_alter_salaries();
DROP PROCEDURE IF EXISTS _039_alter_salaries;

-- 4. payroll_adjustments — phụ cấp/khấu trừ chi tiết
CREATE TABLE IF NOT EXISTS payroll_adjustments (
  adjustment_id INT AUTO_INCREMENT PRIMARY KEY,
  salary_id INT NOT NULL,
  type ENUM('allowance','bonus','deduction','fine','other') NOT NULL,
  title VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  note TEXT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pa_salary FOREIGN KEY (salary_id) REFERENCES salaries(salary_id) ON DELETE CASCADE,
  CONSTRAINT fk_pa_creator FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_pa_salary (salary_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Khoản cộng/trừ chi tiết cho phiếu lương';

-- 5. Expand permissions action ENUM to support new values
ALTER TABLE permissions MODIFY COLUMN action VARCHAR(50) NOT NULL;

-- 6. New permissions for period management and payroll workflow
INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('attendances.period.read', 'attendances', 'period.read', 'Xem kỳ công'),
  ('attendances.period.lock', 'attendances', 'period.lock', 'Chốt kỳ công'),
  ('attendances.period.unlock', 'attendances', 'period.unlock', 'Mở chốt kỳ công'),
  ('salaries.export', 'salaries', 'export', 'Xuất bảng lương'),
  ('salaries.approve', 'salaries', 'approve', 'Duyệt bảng lương'),
  ('salaries.mark_paid', 'salaries', 'mark_paid', 'Đánh dấu đã thanh toán'),
  ('salaries.lock', 'salaries', 'lock', 'Khóa kỳ lương');

-- Assign all new permissions to admin
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r
JOIN permissions p ON p.permission_name IN (
  'attendances.period.read','attendances.period.lock','attendances.period.unlock',
  'salaries.export','salaries.approve','salaries.mark_paid','salaries.lock'
) WHERE r.role_name = 'admin';

-- Assign subset to manager (no unlock, no mark_paid, no lock)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id FROM roles r
JOIN permissions p ON p.permission_name IN (
  'attendances.period.read','attendances.period.lock',
  'salaries.export','salaries.approve'
) WHERE r.role_name = 'manager';

-- 7. Payroll settings
INSERT IGNORE INTO settings (setting_key, setting_value, data_type, category, description, is_public) VALUES
  ('payroll.ot_rate_weekday', '1.5', 'number', 'payroll', 'Hệ số tăng ca ngày thường', 0),
  ('payroll.late_penalty_per_minute', '0', 'number', 'payroll', 'Phạt đi trễ (đ/phút), 0 = không phạt', 0),
  ('payroll.early_leave_penalty_per_minute', '0', 'number', 'payroll', 'Phạt về sớm (đ/phút), 0 = không phạt', 0);

-- 8. Mark existing salaries as 'paid' (legacy data)
UPDATE salaries SET status = 'paid' WHERE status = 'draft' AND generated_at < NOW();
