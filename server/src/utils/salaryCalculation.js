const { pool } = require('../config/db');
const Setting = require('../models/settingModel');
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

const formatCurrency = (value) => new Intl.NumberFormat('vi-VN').format(Math.round(value || 0));

/**
 * Tính lương tự động cho nhân viên trong tháng/năm
 * Công thức: net = base × (actual/standard) + bonus - deductions
 * - actual = standard - unpaid_leave_days
 * - unpaid_leave_days = nghỉ không phép (unpaid) đã duyệt trong tháng
 * - Nghỉ phép năm (annual) đã duyệt → không trừ lương
 */
async function calculateSalary(employeeId, month, year) {
  const targetDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthStart = parseSqlDate(targetDate);
  const fullMonthEnd = parseSqlDate(`${year}-${String(month).padStart(2, '0')}-${new Date(Date.UTC(year, month, 0)).getUTCDate()}`);
  const monthCalendarDays = diffDaysInclusive(monthStart, fullMonthEnd);

  // 1. Lấy thông tin nhân viên
  const [empRows] = await pool.query(
    `SELECT e.*
     FROM employees e
     WHERE e.employee_id = ?`,
    [employeeId]
  );

  if (!empRows.length) throw new Error('Không tìm thấy nhân viên');
  const emp = empRows[0];

  const [resignationRows] = await pool.query(
    `SELECT MIN(end_date) as resignation_date
     FROM leave_requests
     WHERE employee_id = ?
       AND leave_type = 'resignation'
       AND status = 'approved'`,
    [employeeId]
  );

  const resignationDate = resignationRows[0]?.resignation_date ? parseSqlDate(resignationRows[0].resignation_date) : null;
  if (resignationDate && resignationDate < monthStart) {
    throw new Error('Nhân viên đã nghỉ việc trước kỳ lương này');
  }

  const activePeriodEnd = resignationDate && resignationDate < fullMonthEnd ? resignationDate : fullMonthEnd;

  // 2. Lấy lịch sử chức vụ giao với tháng cần tính.
  // Có thể tồn tại overlap lịch sử cũ, nên sẽ normalize lại theo thứ tự effective_date.
  const [positionRows] = await pool.query(
    `SELECT ep.position_id, ep.effective_date, ep.end_date, ep.salary_at_time, p.position_name
     FROM employee_positions ep
     LEFT JOIN positions p ON ep.position_id = p.position_id
     WHERE ep.employee_id = ?
       AND ep.effective_date <= ?
       AND (ep.end_date IS NULL OR ep.end_date >= ?)
     ORDER BY ep.effective_date ASC, ep.id ASC`,
    [employeeId, formatSqlDate(activePeriodEnd), formatSqlDate(monthStart)]
  );

  const normalizedSegments = [];
  let cursor = monthStart;
  const pushFallbackSegment = (start, end) => {
    if (start > end) return;
    normalizedSegments.push({
      position_id: null,
      position_name: 'Lương hồ sơ nhân viên',
      salary_at_time: Number(emp.base_salary) || 0,
      start,
      end,
      is_fallback: true
    });
  };

  for (const row of positionRows) {
    const rawStart = maxDate(parseSqlDate(row.effective_date), monthStart);
    const rawEnd = minDate(parseSqlDate(row.end_date || formatSqlDate(activePeriodEnd)), activePeriodEnd);
    if (rawEnd < rawStart) continue;
    if (cursor < rawStart) {
      pushFallbackSegment(cursor, addDays(rawStart, -1));
    }
    const segmentStart = maxDate(rawStart, cursor);
    if (segmentStart > rawEnd) continue;
    normalizedSegments.push({
      position_id: row.position_id,
      position_name: row.position_name || 'Chức vụ không xác định',
      salary_at_time: Number(row.salary_at_time) || Number(emp.base_salary) || 0,
      start: segmentStart,
      end: rawEnd,
      is_fallback: false
    });
    cursor = addDays(rawEnd, 1);
  }

  if (cursor <= activePeriodEnd || !normalizedSegments.length) {
    pushFallbackSegment(cursor <= activePeriodEnd ? cursor : monthStart, activePeriodEnd);
  }

  // 3. Tính ngày nghỉ không lương (unpaid) đã duyệt rơi vào đúng tháng này.
  // Dùng Set theo ngày để tránh double count nếu dữ liệu đơn nghỉ bị chồng.
  const [leaveRows] = await pool.query(
    `SELECT start_date, end_date
     FROM leave_requests
     WHERE employee_id = ? AND status = 'approved' AND leave_type = 'unpaid'
     AND start_date <= LAST_DAY(?)
     AND end_date >= ?`,
    [employeeId, targetDate, targetDate]
  );

  const unpaidLeaveDates = new Set();
  for (const leave of leaveRows) {
    let current = maxDate(parseSqlDate(leave.start_date), monthStart);
    const leaveEnd = minDate(parseSqlDate(leave.end_date), activePeriodEnd);
    while (current <= leaveEnd) {
      unpaidLeaveDates.add(formatSqlDate(current));
      current = addDays(current, 1);
    }
  }
  const unpaidLeaveDays = unpaidLeaveDates.size;

  // 4. Lấy số ngày công chuẩn từ settings (mặc định 22)
  const workDaysSetting = await Setting.findByKey('work_days_standard');
  const workDaysStandard = workDaysSetting ? parseInt(workDaysSetting.parsed_value) : 22;

  // 5. Tính lương theo từng giai đoạn chức vụ trong tháng.
  // Mỗi giai đoạn nhận một phần ngày công chuẩn tương ứng số ngày lịch trong tháng.
  let baseSalaryEquivalent = 0;
  let grossSalary = 0;
  const salaryBreakdown = normalizedSegments.map((segment) => {
    const calendarDays = diffDaysInclusive(segment.start, segment.end);
    const standardDaysEquivalent = workDaysStandard * (calendarDays / monthCalendarDays);

    let segmentUnpaidDays = 0;
    let current = segment.start;
    while (current <= segment.end) {
      if (unpaidLeaveDates.has(formatSqlDate(current))) segmentUnpaidDays++;
      current = addDays(current, 1);
    }

    const paidDaysEquivalent = Math.max(0, standardDaysEquivalent - segmentUnpaidDays);
    const segmentBaseEquivalent = segment.salary_at_time * (standardDaysEquivalent / workDaysStandard);
    const segmentGross = segment.salary_at_time * (paidDaysEquivalent / workDaysStandard);

    baseSalaryEquivalent += segmentBaseEquivalent;
    grossSalary += segmentGross;

    return {
      position_id: segment.position_id,
      position_name: segment.position_name,
      start_date: formatSqlDate(segment.start),
      end_date: formatSqlDate(segment.end),
      calendar_days: calendarDays,
      standard_days_equivalent: Number(standardDaysEquivalent.toFixed(2)),
      unpaid_leave_days: segmentUnpaidDays,
      paid_days_equivalent: Number(paidDaysEquivalent.toFixed(2)),
      salary_at_time: segment.salary_at_time,
      gross_salary: Math.round(segmentGross),
      is_fallback: segment.is_fallback
    };
  });

  const workDaysActual = Math.max(0, workDaysStandard - unpaidLeaveDays);
  const baseSalary = Math.round(baseSalaryEquivalent);
  const grossSalaryRounded = Math.round(grossSalary);
  const notes = salaryBreakdown.length > 1
    ? `Lương tháng được phân bổ theo ${salaryBreakdown.length} giai đoạn chức vụ: ${salaryBreakdown.map((segment) => `${segment.start_date} đến ${segment.end_date} - ${segment.position_name} (${formatCurrency(segment.salary_at_time)}đ)`).join('; ')}.`
    : (unpaidLeaveDays > 0 ? `Phát sinh ${unpaidLeaveDays} ngày nghỉ không lương trong tháng.` : null);

  return {
    employee_id: employeeId,
    employee_name: emp.full_name,
    month: parseInt(month),
    year: parseInt(year),
    work_days_standard: workDaysStandard,
    work_days_actual: workDaysActual,
    unpaid_leave_days: unpaidLeaveDays,
    base_salary: baseSalary,
    gross_salary: grossSalaryRounded,
    bonus: 0,
    deductions: 0,
    net_salary: grossSalaryRounded,
    notes: resignationDate && resignationDate <= fullMonthEnd
      ? `${notes ? `${notes} ` : ''}Hệ thống chỉ tính lương đến hết ngày ${formatSqlDate(resignationDate)} do nhân sự nghỉ việc từ thời điểm này.`
      : notes,
    salary_breakdown: salaryBreakdown
  };
}

/**
 * Tính lương cho tất cả nhân viên active trong tháng/năm
 */
async function calculateAllSalaries(month, year) {
  await syncApprovedResignations();

  const [employees] = await pool.query(
    "SELECT employee_id FROM employees WHERE status = 'active'"
  );

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
