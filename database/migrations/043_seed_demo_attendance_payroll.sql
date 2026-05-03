-- ============================================================
-- Migration 043: Seed demo attendance + payroll period evidence
-- Safe to re-run. Only targets demo accounts that are linked to employees.
-- ============================================================

SET NAMES utf8mb4;

INSERT INTO attendance_shifts (
  shift_code, shift_name, start_time, end_time,
  break_minutes, grace_minutes, standard_work_minutes, is_active
)
VALUES (
  'HC', 'Ca hành chính', '08:00:00', '17:00:00',
  60, 10, 480, TRUE
)
ON DUPLICATE KEY UPDATE
  shift_name = VALUES(shift_name),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  break_minutes = VALUES(break_minutes),
  grace_minutes = VALUES(grace_minutes),
  standard_work_minutes = VALUES(standard_work_minutes),
  is_active = VALUES(is_active);

INSERT IGNORE INTO attendance_periods (month, year, start_date, end_date, status, locked_by, locked_at, note)
VALUES
  (3, 2026, '2026-03-01', '2026-03-31', 'locked', 1, NOW(), 'Demo attendance period for SGU EIS final demo'),
  (4, 2026, '2026-04-01', '2026-04-30', 'locked', 1, NOW(), 'Demo attendance period for SGU EIS final demo'),
  (5, 2026, '2026-05-01', '2026-05-31', 'locked', 1, NOW(), 'Demo attendance period for SGU EIS final demo');

UPDATE attendance_periods
SET status = 'locked',
    locked_by = COALESCE(locked_by, 1),
    locked_at = COALESCE(locked_at, NOW()),
    note = COALESCE(note, 'Demo attendance period for SGU EIS final demo')
WHERE year = 2026 AND month IN (3, 4, 5);

INSERT INTO employee_shift_assignments (employee_id, shift_id, effective_from, effective_to, created_by)
SELECT u.employee_id, s.shift_id, '2026-03-01', '2026-05-31', 1
FROM users u
JOIN attendance_shifts s ON s.shift_code = 'HC'
WHERE u.username IN ('manager01', 'staff01', 'sales01', 'warehouse01')
  AND u.employee_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM employee_shift_assignments existing
    WHERE existing.employee_id = u.employee_id
      AND existing.shift_id = s.shift_id
      AND existing.effective_from = '2026-03-01'
  );

INSERT IGNORE INTO attendance_records (
  employee_id, work_date, shift_id, check_in_at, check_out_at,
  source, status, minutes_late, minutes_early_leave,
  work_minutes, overtime_minutes, note, verified_by, verified_at
)
WITH RECURSIVE calendar AS (
  SELECT DATE('2026-03-01') AS work_date
  UNION ALL
  SELECT DATE_ADD(work_date, INTERVAL 1 DAY)
  FROM calendar
  WHERE work_date < DATE('2026-05-31')
),
demo_employees AS (
  SELECT u.employee_id, u.username
  FROM users u
  WHERE u.username IN ('manager01', 'staff01', 'sales01', 'warehouse01')
    AND u.employee_id IS NOT NULL
),
shift AS (
  SELECT shift_id
  FROM attendance_shifts
  WHERE shift_code = 'HC'
  LIMIT 1
)
SELECT
  e.employee_id,
  c.work_date,
  s.shift_id,
  CASE
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 17) = 0 THEN NULL
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 7) = 0 THEN CONCAT(c.work_date, ' 08:24:00')
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 11) = 0 THEN CONCAT(c.work_date, ' 08:16:00')
    ELSE CONCAT(c.work_date, ' 08:00:00')
  END AS check_in_at,
  CASE
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 17) = 0 THEN NULL
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 11) = 0 THEN CONCAT(c.work_date, ' 16:34:00')
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 5) = 0 THEN CONCAT(c.work_date, ' 18:30:00')
    ELSE CONCAT(c.work_date, ' 17:00:00')
  END AS check_out_at,
  'system' AS source,
  CASE
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 17) = 0 THEN 'absent'
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 11) = 0 THEN 'late_and_early'
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 7) = 0 THEN 'late'
    ELSE 'present'
  END AS status,
  CASE
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 11) = 0 THEN 16
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 7) = 0 THEN 24
    ELSE 0
  END AS minutes_late,
  CASE
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 11) = 0 THEN 26
    ELSE 0
  END AS minutes_early_leave,
  CASE
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 17) = 0 THEN 0
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 11) = 0 THEN 438
    ELSE 480
  END AS work_minutes,
  CASE
    WHEN MOD(DAYOFMONTH(c.work_date) + e.employee_id, 5) = 0
     AND MOD(DAYOFMONTH(c.work_date) + e.employee_id, 17) <> 0 THEN 90
    ELSE 0
  END AS overtime_minutes,
  CONCAT('Demo attendance seed for ', e.username, ' - SGU EIS final demo') AS note,
  1 AS verified_by,
  NOW() AS verified_at
FROM calendar c
JOIN demo_employees e
JOIN shift s
WHERE DAYOFWEEK(c.work_date) BETWEEN 2 AND 6;

INSERT INTO payroll_periods (
  month, year, attendance_period_id, status,
  calculated_by, calculated_at, approved_by, approved_at, note
)
SELECT ap.month, ap.year, ap.period_id, 'approved', 1, NOW(), 1, NOW(),
       'Demo payroll period with seeded attendance evidence for SGU EIS final demo'
FROM attendance_periods ap
WHERE ap.year = 2026 AND ap.month IN (3, 4, 5)
ON DUPLICATE KEY UPDATE
  attendance_period_id = VALUES(attendance_period_id),
  status = IF(payroll_periods.status IN ('paid', 'locked'), payroll_periods.status, 'approved'),
  calculated_by = COALESCE(payroll_periods.calculated_by, VALUES(calculated_by)),
  calculated_at = COALESCE(payroll_periods.calculated_at, VALUES(calculated_at)),
  approved_by = COALESCE(payroll_periods.approved_by, VALUES(approved_by)),
  approved_at = COALESCE(payroll_periods.approved_at, VALUES(approved_at)),
  note = COALESCE(payroll_periods.note, VALUES(note));

INSERT INTO salaries (
  payroll_period_id, employee_id, month, year,
  work_days_standard, work_days_actual, paid_leave_days, absent_days, unpaid_leave_days,
  total_late_minutes, total_early_leave_minutes, total_overtime_minutes,
  overtime_amount, allowance_amount, late_penalty_amount, early_leave_penalty_amount,
  daily_rate, hourly_rate, minute_rate, unpaid_leave_deduction, absence_deduction, other_deduction_amount,
  calculation_details, base_salary, gross_salary, bonus, deductions, net_salary,
  status, notes, generated_by
)
WITH demo_employees AS (
  SELECT u.employee_id, e.full_name, e.base_salary
  FROM users u
  JOIN employees e ON e.employee_id = u.employee_id
  WHERE u.username IN ('manager01', 'staff01', 'sales01', 'warehouse01')
    AND u.employee_id IS NOT NULL
),
attendance_summary AS (
  SELECT
    ar.employee_id,
    MONTH(ar.work_date) AS month,
    YEAR(ar.work_date) AS year,
    COALESCE(SUM(ar.work_day_value), 0) AS work_days_actual,
    COALESCE(SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_days,
    COALESCE(SUM(ar.minutes_late), 0) AS total_late_minutes,
    COALESCE(SUM(ar.minutes_early_leave), 0) AS total_early_leave_minutes,
    COALESCE(SUM(ar.overtime_minutes), 0) AS total_overtime_minutes
  FROM attendance_records ar
  WHERE ar.work_date BETWEEN '2026-03-01' AND '2026-05-31'
  GROUP BY ar.employee_id, MONTH(ar.work_date), YEAR(ar.work_date)
),
calc AS (
  SELECT
    pp.period_id AS payroll_period_id,
    de.employee_id,
    pp.month,
    pp.year,
    26 AS work_days_standard,
    COALESCE(ats.work_days_actual, 0) AS work_days_actual,
    0 AS paid_leave_days,
    COALESCE(ats.absent_days, 0) AS absent_days,
    0 AS unpaid_leave_days,
    COALESCE(ats.total_late_minutes, 0) AS total_late_minutes,
    COALESCE(ats.total_early_leave_minutes, 0) AS total_early_leave_minutes,
    COALESCE(ats.total_overtime_minutes, 0) AS total_overtime_minutes,
    ROUND(de.base_salary / 26, 2) AS daily_rate,
    ROUND(de.base_salary / 26 / 8, 2) AS hourly_rate,
    ROUND(de.base_salary / 26 / 8 / 60, 2) AS minute_rate,
    ROUND((COALESCE(ats.total_overtime_minutes, 0) / 60) * (de.base_salary / 26 / 8) * 1.5, 2) AS overtime_amount,
    ROUND(COALESCE(ats.total_late_minutes, 0) * 1000, 2) AS late_penalty_amount,
    ROUND(COALESCE(ats.total_early_leave_minutes, 0) * 1000, 2) AS early_leave_penalty_amount,
    0 AS unpaid_leave_deduction,
    ROUND(COALESCE(ats.absent_days, 0) * (de.base_salary / 26), 2) AS absence_deduction,
    0 AS other_deduction_amount,
    de.base_salary AS base_salary
  FROM payroll_periods pp
  JOIN demo_employees de
  LEFT JOIN attendance_summary ats
    ON ats.employee_id = de.employee_id
   AND ats.month = pp.month
   AND ats.year = pp.year
  WHERE pp.year = 2026 AND pp.month IN (3, 4, 5)
)
SELECT
  payroll_period_id,
  employee_id,
  month,
  year,
  work_days_standard,
  work_days_actual,
  paid_leave_days,
  absent_days,
  unpaid_leave_days,
  total_late_minutes,
  total_early_leave_minutes,
  total_overtime_minutes,
  overtime_amount,
  0 AS allowance_amount,
  late_penalty_amount,
  early_leave_penalty_amount,
  daily_rate,
  hourly_rate,
  minute_rate,
  unpaid_leave_deduction,
  absence_deduction,
  other_deduction_amount,
  JSON_OBJECT(
    'formula', 'net_salary = base_salary + overtime_amount + bonus - deductions',
    'base_rates', JSON_OBJECT(
      'effective_base_salary', base_salary,
      'standard_working_days', work_days_standard,
      'daily_rate', daily_rate,
      'hourly_rate', hourly_rate,
      'minute_rate', minute_rate
    ),
    'leaves', JSON_OBJECT(
      'paid_leave_days', paid_leave_days,
      'unpaid_leave_days', unpaid_leave_days,
      'unpaid_leave_deduction', unpaid_leave_deduction
    ),
    'attendance', JSON_OBJECT(
      'work_days_actual', work_days_actual,
      'absent_days', absent_days,
      'absence_deduction', absence_deduction
    ),
    'penalties', JSON_OBJECT(
      'late_minutes', total_late_minutes,
      'late_penalty_amount', late_penalty_amount,
      'early_leave_minutes', total_early_leave_minutes,
      'early_leave_penalty_amount', early_leave_penalty_amount
    ),
    'additions', JSON_OBJECT(
      'overtime_minutes', total_overtime_minutes,
      'overtime_multiplier', 1.5,
      'overtime_amount', overtime_amount
    ),
    'summary', JSON_OBJECT(
      'gross_salary', ROUND(base_salary + overtime_amount, 2),
      'total_deductions', ROUND(unpaid_leave_deduction + absence_deduction + late_penalty_amount + early_leave_penalty_amount + other_deduction_amount, 2),
      'net_salary', GREATEST(0, ROUND(base_salary + overtime_amount - unpaid_leave_deduction - absence_deduction - late_penalty_amount - early_leave_penalty_amount - other_deduction_amount, 2))
    )
  ) AS calculation_details,
  base_salary,
  ROUND(base_salary + overtime_amount, 2) AS gross_salary,
  0 AS bonus,
  ROUND(unpaid_leave_deduction + absence_deduction + late_penalty_amount + early_leave_penalty_amount + other_deduction_amount, 2) AS deductions,
  GREATEST(0, ROUND(base_salary + overtime_amount - unpaid_leave_deduction - absence_deduction - late_penalty_amount - early_leave_penalty_amount - other_deduction_amount, 2)) AS net_salary,
  'approved' AS status,
  'Demo payroll generated from seeded attendance for SGU EIS final demo' AS notes,
  1 AS generated_by
FROM calc
ON DUPLICATE KEY UPDATE
  payroll_period_id = VALUES(payroll_period_id),
  work_days_standard = IF(salaries.status IN ('paid', 'locked'), salaries.work_days_standard, VALUES(work_days_standard)),
  work_days_actual = IF(salaries.status IN ('paid', 'locked'), salaries.work_days_actual, VALUES(work_days_actual)),
  paid_leave_days = IF(salaries.status IN ('paid', 'locked'), salaries.paid_leave_days, VALUES(paid_leave_days)),
  absent_days = IF(salaries.status IN ('paid', 'locked'), salaries.absent_days, VALUES(absent_days)),
  unpaid_leave_days = IF(salaries.status IN ('paid', 'locked'), salaries.unpaid_leave_days, VALUES(unpaid_leave_days)),
  total_late_minutes = IF(salaries.status IN ('paid', 'locked'), salaries.total_late_minutes, VALUES(total_late_minutes)),
  total_early_leave_minutes = IF(salaries.status IN ('paid', 'locked'), salaries.total_early_leave_minutes, VALUES(total_early_leave_minutes)),
  total_overtime_minutes = IF(salaries.status IN ('paid', 'locked'), salaries.total_overtime_minutes, VALUES(total_overtime_minutes)),
  overtime_amount = IF(salaries.status IN ('paid', 'locked'), salaries.overtime_amount, VALUES(overtime_amount)),
  allowance_amount = IF(salaries.status IN ('paid', 'locked'), salaries.allowance_amount, VALUES(allowance_amount)),
  late_penalty_amount = IF(salaries.status IN ('paid', 'locked'), salaries.late_penalty_amount, VALUES(late_penalty_amount)),
  early_leave_penalty_amount = IF(salaries.status IN ('paid', 'locked'), salaries.early_leave_penalty_amount, VALUES(early_leave_penalty_amount)),
  daily_rate = IF(salaries.status IN ('paid', 'locked'), salaries.daily_rate, VALUES(daily_rate)),
  hourly_rate = IF(salaries.status IN ('paid', 'locked'), salaries.hourly_rate, VALUES(hourly_rate)),
  minute_rate = IF(salaries.status IN ('paid', 'locked'), salaries.minute_rate, VALUES(minute_rate)),
  unpaid_leave_deduction = IF(salaries.status IN ('paid', 'locked'), salaries.unpaid_leave_deduction, VALUES(unpaid_leave_deduction)),
  absence_deduction = IF(salaries.status IN ('paid', 'locked'), salaries.absence_deduction, VALUES(absence_deduction)),
  other_deduction_amount = IF(salaries.status IN ('paid', 'locked'), salaries.other_deduction_amount, VALUES(other_deduction_amount)),
  calculation_details = IF(salaries.status IN ('paid', 'locked'), salaries.calculation_details, VALUES(calculation_details)),
  base_salary = IF(salaries.status IN ('paid', 'locked'), salaries.base_salary, VALUES(base_salary)),
  gross_salary = IF(salaries.status IN ('paid', 'locked'), salaries.gross_salary, VALUES(gross_salary)),
  bonus = IF(salaries.status IN ('paid', 'locked'), salaries.bonus, VALUES(bonus)),
  deductions = IF(salaries.status IN ('paid', 'locked'), salaries.deductions, VALUES(deductions)),
  net_salary = IF(salaries.status IN ('paid', 'locked'), salaries.net_salary, VALUES(net_salary)),
  status = IF(salaries.status IN ('paid', 'locked'), salaries.status, VALUES(status)),
  notes = IF(salaries.status IN ('paid', 'locked'), salaries.notes, VALUES(notes)),
  generated_by = IF(salaries.status IN ('paid', 'locked'), salaries.generated_by, VALUES(generated_by));

UPDATE payroll_periods pp
SET total_employees = (SELECT COUNT(*) FROM salaries s WHERE s.payroll_period_id = pp.period_id),
    total_gross = (SELECT COALESCE(SUM(s.gross_salary), 0) FROM salaries s WHERE s.payroll_period_id = pp.period_id),
    total_net = (SELECT COALESCE(SUM(s.net_salary), 0) FROM salaries s WHERE s.payroll_period_id = pp.period_id)
WHERE pp.year = 2026 AND pp.month IN (3, 4, 5);
