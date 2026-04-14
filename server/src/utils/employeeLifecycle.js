const { pool } = require('../config/db');

const syncApprovedResignations = async (db = pool, employeeId = null) => {
  const params = [];
  let employeeFilter = '';

  if (employeeId) {
    employeeFilter = ' AND lr.employee_id = ?';
    params.push(employeeId);
  }

  const [targets] = await db.query(
    `SELECT DISTINCT lr.employee_id
     FROM leave_requests lr
     JOIN employees e ON e.employee_id = lr.employee_id
     WHERE lr.leave_type = 'resignation'
       AND lr.status = 'approved'
       AND lr.end_date <= CURDATE()
       AND e.deleted_at IS NULL
       AND e.status != 'inactive'
       ${employeeFilter}`,
    params
  );

  if (!targets.length) {
    return 0;
  }

  const employeeIds = targets.map((row) => Number(row.employee_id)).filter(Boolean);
  const placeholders = employeeIds.map(() => '?').join(', ');

  await db.query(
    `UPDATE employees
     SET status = 'inactive'
     WHERE employee_id IN (${placeholders})`,
    employeeIds
  );

  await db.query(
    `UPDATE users
     SET is_active = 0
     WHERE employee_id IN (${placeholders})
       AND deleted_at IS NULL`,
    employeeIds
  );

  return employeeIds.length;
};

module.exports = {
  syncApprovedResignations
};
