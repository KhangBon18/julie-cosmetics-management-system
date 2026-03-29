-- ============================================================
-- Migration 003: Fix dangerous ON DELETE CASCADE on financial/HR data
-- Priority: CRITICAL (C-03) — Phase 0
-- Risk: HIGH (FK constraint changes — must backup first)
-- Downtime: Brief (ALTER TABLE locks, ~seconds on small tables)
-- Backup: MANDATORY
-- Backend sync: employeeModel.js delete() must change to soft delete
-- ============================================================

USE julie_cosmetics;

-- ── UP ─────────────────────────────────────────────────────────
-- Problem: Deleting an employee cascades and permanently destroys
-- all salary records, leave requests, and position history.
-- Fix: Change to RESTRICT so deletion is blocked if related data exists.
-- Application should use soft delete (status='inactive') instead.

-- Step 1: Add deleted_at for soft delete on employees
ALTER TABLE employees
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
  ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at;

-- Step 2: Drop and recreate FK on employee_positions
ALTER TABLE employee_positions
  DROP FOREIGN KEY employee_positions_ibfk_1;

ALTER TABLE employee_positions
  ADD CONSTRAINT fk_ep_employee
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
  ON DELETE RESTRICT;

-- Step 3: Drop and recreate FK on leave_requests
ALTER TABLE leave_requests
  DROP FOREIGN KEY leave_requests_ibfk_1;

ALTER TABLE leave_requests
  ADD CONSTRAINT fk_lr_employee
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
  ON DELETE RESTRICT;

-- Step 4: Drop and recreate FK on salaries
ALTER TABLE salaries
  DROP FOREIGN KEY salaries_ibfk_1;

ALTER TABLE salaries
  ADD CONSTRAINT fk_sal_employee
  FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
  ON DELETE RESTRICT;

-- ── DOWN ───────────────────────────────────────────────────────
-- ALTER TABLE employee_positions
--   DROP FOREIGN KEY fk_ep_employee,
--   ADD FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
-- ALTER TABLE leave_requests
--   DROP FOREIGN KEY fk_lr_employee,
--   ADD FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
-- ALTER TABLE salaries
--   DROP FOREIGN KEY fk_sal_employee,
--   ADD FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE;
-- ALTER TABLE employees DROP COLUMN deleted_at, DROP COLUMN updated_at;

-- ── NOTES ──────────────────────────────────────────────────────
-- • FK constraint names (employee_positions_ibfk_1 etc.) are MySQL
--   auto-generated names. If your DB has different names, run:
--   SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
--   WHERE TABLE_NAME = 'employee_positions' AND COLUMN_NAME = 'employee_id'
--   AND REFERENCED_TABLE_NAME = 'employees';
-- • After this migration, DELETE FROM employees will fail if the
--   employee has salaries, leaves, or positions. This is INTENTIONAL.
-- • Backend must be updated to use soft delete instead of hard delete.
