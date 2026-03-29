const { pool } = require('../config/db');

/**
 * Tính lương tự động cho nhân viên trong tháng/năm
 * Công thức: net = base × (actual/standard) + bonus - deductions
 * - actual = standard - unpaid_leave_days
 * - unpaid_leave_days = nghỉ không phép (unpaid) đã duyệt trong tháng
 * - Nghỉ phép năm (annual) đã duyệt → không trừ lương
 */
async function calculateSalary(employeeId, month, year) {
  // 1. Lấy thông tin nhân viên
  const [empRows] = await pool.query(
    `SELECT e.*, p.position_name, p.base_salary as position_salary
     FROM employees e
     LEFT JOIN employee_positions ep ON e.employee_id = ep.employee_id AND ep.end_date IS NULL
     LEFT JOIN positions p ON ep.position_id = p.position_id
     WHERE e.employee_id = ?`,
    [employeeId]
  );
  if (!empRows.length) throw new Error('Không tìm thấy nhân viên');
  const emp = empRows[0];

  // 2. Tính ngày nghỉ không lương (unpaid) đã duyệt rơi vào ĐÚNG tháng này
  // Fix cross-month: tính chính xác số ngày overlap giữa leave period và target month
  const [leaveRows] = await pool.query(
    `SELECT SUM(
       DATEDIFF(
         LEAST(end_date, LAST_DAY(CONCAT(?, '-', ?, '-01'))),
         GREATEST(start_date, CONCAT(?, '-', ?, '-01'))
       ) + 1
     ) as total_unpaid
     FROM leave_requests
     WHERE employee_id = ? AND status = 'approved' AND leave_type = 'unpaid'
     AND start_date <= LAST_DAY(CONCAT(?, '-', ?, '-01'))
     AND end_date >= CONCAT(?, '-', ?, '-01')`,
    [year, month, year, month, employeeId, year, month, year, month]
  );
  const unpaidLeaveDays = Math.max(0, parseInt(leaveRows[0]?.total_unpaid) || 0);

  // 3. Tính lương — ưu tiên position_salary, fallback employee.base_salary
  const workDaysStandard = 22;
  const workDaysActual = Math.max(0, workDaysStandard - unpaidLeaveDays);
  const baseSalary = parseFloat(emp.position_salary) || parseFloat(emp.base_salary) || 0;
  const grossSalary = Math.round(baseSalary * (workDaysActual / workDaysStandard));

  return {
    employee_id: employeeId,
    employee_name: emp.full_name,
    month: parseInt(month),
    year: parseInt(year),
    work_days_standard: workDaysStandard,
    work_days_actual: workDaysActual,
    unpaid_leave_days: unpaidLeaveDays,
    base_salary: baseSalary,
    gross_salary: grossSalary,
    bonus: 0,
    deductions: 0,
    net_salary: grossSalary // net = gross + bonus - deductions (bonus/deductions nhập thủ công)
  };
}

/**
 * Tính lương cho tất cả nhân viên active trong tháng/năm
 */
async function calculateAllSalaries(month, year) {
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
