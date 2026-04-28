USE julie_cosmetics;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS attendance_shifts (
  shift_id                INT AUTO_INCREMENT PRIMARY KEY,
  shift_code              VARCHAR(30) NOT NULL UNIQUE,
  shift_name              VARCHAR(100) NOT NULL,
  start_time              TIME NOT NULL,
  end_time                TIME NOT NULL,
  break_minutes           INT NOT NULL DEFAULT 60,
  grace_minutes           INT NOT NULL DEFAULT 10,
  standard_work_minutes   INT NOT NULL DEFAULT 480,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Danh mục ca làm việc cho module chấm công';

CREATE TABLE IF NOT EXISTS employee_shift_assignments (
  assignment_id    INT AUTO_INCREMENT PRIMARY KEY,
  employee_id      INT NOT NULL,
  shift_id         INT NOT NULL,
  effective_from   DATE NOT NULL,
  effective_to     DATE NULL,
  created_by       INT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_esa_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  CONSTRAINT fk_esa_shift FOREIGN KEY (shift_id) REFERENCES attendance_shifts(shift_id) ON DELETE RESTRICT,
  CONSTRAINT fk_esa_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_esa_employee_dates (employee_id, effective_from, effective_to)
) ENGINE=InnoDB COMMENT='Gán ca làm việc cho nhân viên theo hiệu lực ngày';

CREATE TABLE IF NOT EXISTS attendance_records (
  attendance_id          INT AUTO_INCREMENT PRIMARY KEY,
  employee_id            INT NOT NULL,
  work_date              DATE NOT NULL,
  shift_id               INT NULL,
  check_in_at            DATETIME NULL,
  check_out_at           DATETIME NULL,
  source                 ENUM('self','manual','adjustment','system') NOT NULL DEFAULT 'self',
  status                 ENUM('present','late','early_leave','late_and_early','absent','half_day','leave','holiday','pending','incomplete') NOT NULL DEFAULT 'pending',
  minutes_late           INT NOT NULL DEFAULT 0,
  minutes_early_leave    INT NOT NULL DEFAULT 0,
  work_minutes           INT NOT NULL DEFAULT 0,
  overtime_minutes       INT NOT NULL DEFAULT 0,
  note                   TEXT NULL,
  verified_by            INT NULL,
  verified_at            TIMESTAMP NULL,
  created_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_attendance_employee_work_date (employee_id, work_date),
  CONSTRAINT fk_attendance_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  CONSTRAINT fk_attendance_shift FOREIGN KEY (shift_id) REFERENCES attendance_shifts(shift_id) ON DELETE SET NULL,
  CONSTRAINT fk_attendance_verified_by FOREIGN KEY (verified_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_attendance_work_date (work_date),
  INDEX idx_attendance_employee_work_date (employee_id, work_date),
  INDEX idx_attendance_status (status)
) ENGINE=InnoDB COMMENT='Bản ghi chấm công theo nhân viên và ngày làm việc';

CREATE TABLE IF NOT EXISTS attendance_adjustment_requests (
  request_id                 INT AUTO_INCREMENT PRIMARY KEY,
  employee_id                INT NOT NULL,
  attendance_id              INT NULL,
  work_date                  DATE NOT NULL,
  requested_check_in_at      DATETIME NULL,
  requested_check_out_at     DATETIME NULL,
  reason                     TEXT NOT NULL,
  status                     ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by                INT NULL,
  reviewed_at                TIMESTAMP NULL,
  reject_reason              TEXT NULL,
  created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_att_adj_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  CONSTRAINT fk_att_adj_attendance FOREIGN KEY (attendance_id) REFERENCES attendance_records(attendance_id) ON DELETE SET NULL,
  CONSTRAINT fk_att_adj_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_att_adj_employee_date_status (employee_id, work_date, status),
  INDEX idx_att_adj_status_created (status, created_at)
) ENGINE=InnoDB COMMENT='Yêu cầu điều chỉnh công của nhân viên';

INSERT INTO attendance_shifts (
  shift_code,
  shift_name,
  start_time,
  end_time,
  break_minutes,
  grace_minutes,
  standard_work_minutes,
  is_active
)
VALUES (
  'HC',
  'Ca hành chính',
  '08:00:00',
  '17:00:00',
  60,
  10,
  480,
  TRUE
)
ON DUPLICATE KEY UPDATE
  shift_name = VALUES(shift_name),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  break_minutes = VALUES(break_minutes),
  grace_minutes = VALUES(grace_minutes),
  standard_work_minutes = VALUES(standard_work_minutes),
  is_active = VALUES(is_active);

INSERT IGNORE INTO permissions (permission_name, module, action, description) VALUES
  ('attendances.read', 'attendances', 'read', 'Xem chấm công'),
  ('attendances.create', 'attendances', 'create', 'Tạo bản ghi chấm công'),
  ('attendances.update', 'attendances', 'update', 'Sửa chấm công và duyệt điều chỉnh'),
  ('attendances.delete', 'attendances', 'delete', 'Xóa bản ghi chấm công'),
  ('attendances.export', 'attendances', 'export', 'Xuất dữ liệu chấm công');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name LIKE 'attendances.%'
WHERE r.role_name = 'admin';

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
  'attendances.read',
  'attendances.create',
  'attendances.update',
  'attendances.export'
)
WHERE r.role_name = 'manager';
