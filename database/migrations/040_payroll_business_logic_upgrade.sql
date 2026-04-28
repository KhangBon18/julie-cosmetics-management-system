-- ============================================================
-- Migration 040: Payroll Business Logic & Leave Balances
-- Safe to re-run (IF NOT EXISTS / IGNORE throughout)
-- ============================================================

-- 1. employee_leave_balances — Quản lý phép năm
CREATE TABLE IF NOT EXISTS employee_leave_balances (
  balance_id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  year YEAR NOT NULL,
  annual_leave_entitled DECIMAL(5,2) NOT NULL DEFAULT 12,
  annual_leave_used DECIMAL(5,2) NOT NULL DEFAULT 0,
  annual_leave_remaining DECIMAL(5,2) NOT NULL DEFAULT 12,
  unpaid_leave_used DECIMAL(5,2) NOT NULL DEFAULT 0,
  carried_over_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_emp_year (employee_id, year),
  CONSTRAINT fk_elb_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Số dư phép năm của nhân viên';

-- Initialize basic balances for current year for all active employees
INSERT IGNORE INTO employee_leave_balances (employee_id, year, annual_leave_entitled, annual_leave_remaining)
SELECT employee_id, YEAR(CURDATE()), 12, 12 FROM employees WHERE status = 'active';


-- 2. ALTER salaries — Add calculation breakdown fields
DROP PROCEDURE IF EXISTS _040_alter_salaries_breakdown;
DELIMITER //
CREATE PROCEDURE _040_alter_salaries_breakdown()
BEGIN
  -- daily_rate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='daily_rate') THEN
    ALTER TABLE salaries ADD COLUMN daily_rate DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER base_salary;
  END IF;
  -- hourly_rate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='hourly_rate') THEN
    ALTER TABLE salaries ADD COLUMN hourly_rate DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER daily_rate;
  END IF;
  -- minute_rate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='minute_rate') THEN
    ALTER TABLE salaries ADD COLUMN minute_rate DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER hourly_rate;
  END IF;
  -- unpaid_leave_deduction
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='unpaid_leave_deduction') THEN
    ALTER TABLE salaries ADD COLUMN unpaid_leave_deduction DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER deductions;
  END IF;
  -- absence_deduction
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='absence_deduction') THEN
    ALTER TABLE salaries ADD COLUMN absence_deduction DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER unpaid_leave_deduction;
  END IF;
  -- other_deduction_amount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='other_deduction_amount') THEN
    ALTER TABLE salaries ADD COLUMN other_deduction_amount DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER absence_deduction;
  END IF;
  -- calculation_details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='salaries' AND column_name='calculation_details') THEN
    ALTER TABLE salaries ADD COLUMN calculation_details JSON NULL AFTER status;
  END IF;
END //
DELIMITER ;
CALL _040_alter_salaries_breakdown();
DROP PROCEDURE IF EXISTS _040_alter_salaries_breakdown;


-- 3. Payroll Settings
INSERT IGNORE INTO settings (setting_key, setting_value, data_type, category, description, is_public) VALUES
  ('payroll.standard_working_days', '26', 'number', 'payroll', 'Số ngày công chuẩn/tháng', 0),
  ('payroll.standard_working_hours_per_day', '8', 'number', 'payroll', 'Số giờ công chuẩn/ngày', 0),
  ('payroll.paid_leave_counts_as_workday', 'true', 'boolean', 'payroll', 'Phép có lương tính là ngày đi làm', 0),
  ('payroll.unpaid_leave_deduct_enabled', 'true', 'boolean', 'payroll', 'Có trừ lương ngày nghỉ không lương', 0),
  ('payroll.absence_deduct_enabled', 'true', 'boolean', 'payroll', 'Có trừ lương vắng không phép', 0);
