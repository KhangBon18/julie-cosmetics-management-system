USE julie_cosmetics;

SET @idx_exists := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'leave_requests'
    AND index_name = 'idx_leave_emp_dates'
);
SET @idx_sql := IF(
  @idx_exists = 0,
  'ALTER TABLE leave_requests ADD INDEX idx_leave_emp_dates (employee_id, start_date, end_date, status)',
  'SELECT 1'
);
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @chk_exists := (
  SELECT COUNT(*)
  FROM information_schema.table_constraints
  WHERE constraint_schema = DATABASE()
    AND table_name = 'leave_requests'
    AND constraint_name = 'chk_leave_date_range'
);
SET @chk_sql := IF(
  @chk_exists = 0,
  'ALTER TABLE leave_requests ADD CONSTRAINT chk_leave_date_range CHECK (end_date >= start_date)',
  'SELECT 1'
);
PREPARE stmt FROM @chk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
