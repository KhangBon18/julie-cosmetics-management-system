-- Migration 042: per-user permission overrides
-- Allows admin to grant or deny permissions for a specific account without changing role defaults.

CREATE TABLE IF NOT EXISTS user_permission_overrides (
  user_id       INT NOT NULL,
  permission_id INT NOT NULL,
  effect        ENUM('grant','deny') NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, permission_id),
  INDEX idx_user_permission_overrides_effect (user_id, effect),
  CONSTRAINT fk_user_permission_overrides_user
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permission_overrides_permission
    FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Quyền cấp/chặn riêng cho từng tài khoản';
