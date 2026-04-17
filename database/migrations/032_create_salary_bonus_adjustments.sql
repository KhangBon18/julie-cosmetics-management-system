CREATE TABLE IF NOT EXISTS salary_bonus_adjustments (
  bonus_id            INT            AUTO_INCREMENT PRIMARY KEY,
  employee_id         INT            NOT NULL,
  month               TINYINT        NOT NULL,
  year                YEAR           NOT NULL,
  amount              DECIMAL(12,2)  NOT NULL DEFAULT 0,
  reason              VARCHAR(255)   NOT NULL,
  created_by          INT            NULL,
  updated_by          INT            NULL,
  created_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_bonus_employee_period (employee_id, month, year),
  CONSTRAINT chk_bonus_month_range CHECK (month BETWEEN 1 AND 12),
  CONSTRAINT chk_bonus_amount_non_negative CHECK (amount >= 0),
  CONSTRAINT fk_bonus_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE RESTRICT,
  CONSTRAINT fk_bonus_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_bonus_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_bonus_year_month (year, month)
);

INSERT INTO salary_bonus_adjustments (employee_id, month, year, amount, reason, created_by, updated_by)
SELECT s.employee_id,
       s.month,
       s.year,
       s.bonus,
       LEFT(COALESCE(NULLIF(TRIM(s.notes), ''), CONCAT('Thưởng kỳ ', LPAD(s.month, 2, '0'), '/', s.year)), 255),
       s.generated_by,
       s.generated_by
FROM salaries s
WHERE s.bonus > 0
  AND NOT EXISTS (
    SELECT 1
    FROM salary_bonus_adjustments sb
    WHERE sb.employee_id = s.employee_id
      AND sb.month = s.month
      AND sb.year = s.year
  );
