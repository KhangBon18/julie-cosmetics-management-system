const { pool } = require('../config/db');
const Setting = require('../models/settingModel');
const Attendance = require('../models/attendanceModel');
const { syncApprovedResignations } = require('./employeeLifecycle');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const parseSqlDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const [year, month, day] = String(value).slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const formatSqlDate = (value) => value.toISOString().slice(0, 10);
const addDays = (value, days) => new Date(value.getTime() + days * MS_PER_DAY);
const maxDate = (a, b) => (a > b ? a : b);
const minDate = (a, b) => (a < b ? a : b);
const diffDaysInclusive = (start, end) => Math.floor((end - start) / MS_PER_DAY) + 1;

/**
 * Tính lương tự động cho nhân viên trong tháng/năm
 * Công thức mới với đầy đủ breakdown chi tiết
 */
async function calculateSalary(employeeId, month, year) {
  const targetDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthStart = parseSqlDate(targetDate);
  const fullMonthEnd = parseSqlDate(`${year}-${String(month).padStart(2, '0')}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`);
  const monthCalendarDays = diffDaysInclusive(monthStart, fullMonthEnd);

  // 1. Employee Info & Resignation Check
  const [empRows] = await pool.query(`SELECT * FROM employees WHERE employee_id = ?`, [employeeId]);
  if (!empRows.length) throw new Error('Không tìm thấy nhân viên');
  const emp = empRows[0];

  const [resignationRows] = await pool.query(
    `SELECT MIN(end_date) as resignation_date FROM leave_requests WHERE employee_id = ? AND leave_type = 'resignation' AND status = 'approved'`,
    [employeeId]
  );
  const resignationDate = resignationRows[0]?.resignation_date ? parseSqlDate(resignationRows[0].resignation_date) : null;
  if (resignationDate && resignationDate < monthStart) {
    throw new Error('Nhân viên đã nghỉ việc trước kỳ lương này');
  }
  const activePeriodEnd = resignationDate && resignationDate < fullMonthEnd ? resignationDate : fullMonthEnd;

  // 2. Base Salary Prorating (Position Segments)
  const [positionRows] = await pool.query(
    `SELECT ep.position_id, ep.effective_date, ep.end_date, ep.salary_at_time, p.position_name
     FROM employee_positions ep
     LEFT JOIN positions p ON ep.position_id = p.position_id
     WHERE ep.employee_id = ? AND ep.effective_date <= ? AND (ep.end_date IS NULL OR ep.end_date >= ?)
     ORDER BY ep.effective_date ASC, ep.id ASC`,
    [employeeId, formatSqlDate(activePeriodEnd), formatSqlDate(monthStart)]
  );

  const normalizedSegments = [];
  let cursor = monthStart;
  const pushFallbackSegment = (start, end) => {
    if (start > end) return;
    normalizedSegments.push({ salary_at_time: Number(emp.base_salary) || 0, start, end, is_fallback: true });
  };

  for (const row of positionRows) {
    const rawStart = maxDate(parseSqlDate(row.effective_date), monthStart);
    const rawEnd = minDate(parseSqlDate(row.end_date || formatSqlDate(activePeriodEnd)), activePeriodEnd);
    if (rawEnd < rawStart) continue;
    if (cursor < rawStart) pushFallbackSegment(cursor, addDays(rawStart, -1));
    const segmentStart = maxDate(rawStart, cursor);
    if (segmentStart > rawEnd) continue;
    normalizedSegments.push({ salary_at_time: Number(row.salary_at_time) || Number(emp.base_salary) || 0, start: segmentStart, end: rawEnd, is_fallback: false });
    cursor = addDays(rawEnd, 1);
  }
  if (cursor <= activePeriodEnd || !normalizedSegments.length) {
    pushFallbackSegment(cursor <= activePeriodEnd ? cursor : monthStart, activePeriodEnd);
  }

  let effectiveBaseSalary = 0;
  for (const segment of normalizedSegments) {
    const calendarDays = diffDaysInclusive(segment.start, segment.end);
    effectiveBaseSalary += segment.salary_at_time * (calendarDays / monthCalendarDays);
  }
  effectiveBaseSalary = Math.round(effectiveBaseSalary);

  // 3. System Settings
  const getNumSetting = async (key, def) => {
    const s = await Setting.findByKey(key);
    return s ? Number(s.parsed_value) : def;
  };
  const workDaysStandard = await getNumSetting('payroll.standard_working_days', 26);
  const hoursPerDay = await getNumSetting('payroll.standard_working_hours_per_day', 8);
  const otRateMultiplier = await getNumSetting('payroll.ot_rate_weekday', 1.5);
  const latePenaltyPerMin = await getNumSetting('payroll.late_penalty_per_minute', 0);
  const earlyPenaltyPerMin = await getNumSetting('payroll.early_leave_penalty_per_minute', 0);

  // 4. Base Rates
  const dailyRate = workDaysStandard > 0 ? (effectiveBaseSalary / workDaysStandard) : 0;
  const hourlyRate = hoursPerDay > 0 ? (dailyRate / hoursPerDay) : 0;
  const minuteRate = hourlyRate / 60;

  // 5. Approved Leaves (overlap with active period)
  const [leaveRows] = await pool.query(
    `SELECT start_date, end_date, leave_type
     FROM leave_requests
     WHERE employee_id = ? AND status = 'approved' AND leave_type IN ('annual', 'unpaid', 'sick', 'maternity')
     AND start_date <= ? AND end_date >= ?`,
    [employeeId, formatSqlDate(activePeriodEnd), formatSqlDate(monthStart)]
  );

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  for (const leave of leaveRows) {
    let current = maxDate(parseSqlDate(leave.start_date), monthStart);
    const leaveEnd = minDate(parseSqlDate(leave.end_date), activePeriodEnd);
    const days = diffDaysInclusive(current, leaveEnd);
    if (days > 0) {
      if (leave.leave_type === 'annual') paidLeaveDays += days;
      else unpaidLeaveDays += days; // sick, unpaid, maternity default to unpaid deduction
    }
  }

  // 6. Attendance Summary
  const [attRows] = await pool.query(
    `SELECT
      COALESCE(SUM(minutes_late), 0) AS total_late_minutes,
      COALESCE(SUM(minutes_early_leave), 0) AS total_early_leave_minutes,
      COALESCE(SUM(overtime_minutes), 0) AS total_overtime_minutes,
      COALESCE(SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END), 0) AS absent_days,
      COALESCE(SUM(work_day_value), 0) AS work_days_actual
     FROM attendance_records
     WHERE employee_id = ? AND MONTH(work_date) = ? AND YEAR(work_date) = ?`,
    [employeeId, month, year]
  );
  const att = attRows[0] || {};
  const totalLateMinutes = Number(att.total_late_minutes);
  const totalEarlyMinutes = Number(att.total_early_leave_minutes);
  const totalOvertimeMinutes = Number(att.total_overtime_minutes);
  const absentDays = Number(att.absent_days);
  const workDaysActual = Number(att.work_days_actual);

  // 7. Additions & Deductions
  const overtimeAmount = Math.round((totalOvertimeMinutes / 60) * hourlyRate * otRateMultiplier);
  const latePenaltyAmount = Math.round(totalLateMinutes * latePenaltyPerMin);
  const earlyLeavePenaltyAmount = Math.round(totalEarlyMinutes * earlyPenaltyPerMin);
  const unpaidLeaveDeduction = Math.round(unpaidLeaveDays * dailyRate);
  const absenceDeduction = Math.round(absentDays * dailyRate);

  const grossSalary = effectiveBaseSalary + overtimeAmount;
  const deductions = unpaidLeaveDeduction + absenceDeduction + latePenaltyAmount + earlyLeavePenaltyAmount;
  const netSalary = Math.max(0, grossSalary - deductions);

  // 8. Calculation Details JSON
  const calculation_details = {
    formula: "net_salary = base_salary + overtime_amount - unpaid_leave_deduction - absence_deduction - late_penalty - early_leave_penalty",
    base_rates: {
      effective_base_salary: effectiveBaseSalary,
      standard_working_days: workDaysStandard,
      daily_rate: Math.round(dailyRate),
      hourly_rate: Math.round(hourlyRate),
      minute_rate: Math.round(minuteRate)
    },
    leaves: {
      paid_leave_days: paidLeaveDays,
      unpaid_leave_days: unpaidLeaveDays,
      unpaid_leave_deduction: unpaidLeaveDeduction
    },
    attendance: {
      work_days_actual: workDaysActual,
      absent_days: absentDays,
      absence_deduction: absenceDeduction
    },
    penalties: {
      late_minutes: totalLateMinutes,
      late_penalty_amount: latePenaltyAmount,
      early_leave_minutes: totalEarlyMinutes,
      early_leave_penalty_amount: earlyLeavePenaltyAmount
    },
    additions: {
      overtime_minutes: totalOvertimeMinutes,
      overtime_multiplier: otRateMultiplier,
      overtime_amount: overtimeAmount
    },
    summary: {
      gross_salary: grossSalary,
      total_deductions: deductions,
      net_salary: netSalary
    }
  };

  return {
    employee_id: employeeId,
    employee_name: emp.full_name,
    month: parseInt(month),
    year: parseInt(year),
    work_days_standard: workDaysStandard,
    work_days_actual: workDaysActual,
    paid_leave_days: paidLeaveDays,
    unpaid_leave_days: unpaidLeaveDays,
    absent_days: absentDays,
    total_late_minutes: totalLateMinutes,
    total_early_leave_minutes: totalEarlyMinutes,
    total_overtime_minutes: totalOvertimeMinutes,
    overtime_amount: overtimeAmount,
    late_penalty_amount: latePenaltyAmount,
    early_leave_penalty_amount: earlyLeavePenaltyAmount,
    daily_rate: Math.round(dailyRate),
    hourly_rate: Math.round(hourlyRate),
    minute_rate: Math.round(minuteRate),
    unpaid_leave_deduction: unpaidLeaveDeduction,
    absence_deduction: absenceDeduction,
    other_deduction_amount: 0,
    calculation_details: calculation_details,
    base_salary: effectiveBaseSalary,
    gross_salary: grossSalary,
    deductions: deductions,
    net_salary: netSalary,
    notes: resignationDate && resignationDate <= fullMonthEnd
      ? `Tính lương đến hết ngày ${formatSqlDate(resignationDate)} (nghỉ việc)`
      : null
  };
}

/**
 * Tính lương cho tất cả nhân viên active trong tháng/năm
 */
async function calculateAllSalaries(month, year) {
  await syncApprovedResignations();
  const [employees] = await pool.query("SELECT employee_id FROM employees WHERE status = 'active'");
  const results = [];
  for (const emp of employees) {
    try {
      const salary = await calculateSalary(emp.employee_id, month, year);
      results.push(salary);
    } catch (err) {
      console.error(`Error calculating salary for employee ${emp.employee_id}:`, err.message);
    }
  }
  return results;
}

module.exports = { calculateSalary, calculateAllSalaries };
