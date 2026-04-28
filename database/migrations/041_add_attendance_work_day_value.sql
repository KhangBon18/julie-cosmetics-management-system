-- ============================================================
-- Migration 041: Attendance Work Day Value
-- Safe to re-run
-- ============================================================

USE julie_cosmetics;

DROP PROCEDURE IF EXISTS _041_add_attendance_work_day_value;
DELIMITER //
CREATE PROCEDURE _041_add_attendance_work_day_value()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'attendance_records'
      AND column_name = 'work_day_value'
  ) THEN
    ALTER TABLE attendance_records
      ADD COLUMN work_day_value DECIMAL(4,2)
      GENERATED ALWAYS AS (
        CASE
          WHEN status IN ('present', 'late', 'early_leave', 'late_and_early') THEN 1.00
          WHEN status = 'half_day' THEN 0.50
          ELSE 0.00
        END
      ) STORED
      AFTER status;
  END IF;
END //
DELIMITER ;

CALL _041_add_attendance_work_day_value();
DROP PROCEDURE IF EXISTS _041_add_attendance_work_day_value;
