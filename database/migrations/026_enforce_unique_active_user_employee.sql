-- Migration 026: Enforce one non-deleted system user per employee
-- Strategy:
--   - Keep historical deleted users untouched
--   - Reject INSERT/UPDATE when another non-deleted user already links to the same employee

DROP TRIGGER IF EXISTS trg_users_unique_employee_insert;
DROP TRIGGER IF EXISTS trg_users_unique_employee_update;

DELIMITER $$

CREATE TRIGGER trg_users_unique_employee_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
  IF NEW.employee_id IS NOT NULL
     AND NEW.deleted_at IS NULL
     AND EXISTS (
       SELECT 1
       FROM users u
       WHERE u.employee_id = NEW.employee_id
         AND u.deleted_at IS NULL
     ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Mỗi nhân viên chỉ được liên kết với một tài khoản hệ thống chưa xóa';
  END IF;
END$$

CREATE TRIGGER trg_users_unique_employee_update
BEFORE UPDATE ON users
FOR EACH ROW
BEGIN
  IF NEW.employee_id IS NOT NULL
     AND NEW.deleted_at IS NULL
     AND EXISTS (
       SELECT 1
       FROM users u
       WHERE u.employee_id = NEW.employee_id
         AND u.deleted_at IS NULL
         AND u.user_id <> OLD.user_id
     ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Mỗi nhân viên chỉ được liên kết với một tài khoản hệ thống chưa xóa';
  END IF;
END$$

DELIMITER ;
