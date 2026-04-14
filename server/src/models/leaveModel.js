const { pool } = require('../config/db');
const { syncApprovedResignations } = require('../utils/employeeLifecycle');

const LEAVE_TYPE_LABELS = {
  annual: 'nghỉ phép năm',
  sick: 'nghỉ ốm',
  maternity: 'nghỉ thai sản',
  unpaid: 'nghỉ không lương',
  resignation: 'nghỉ việc'
};

const toDateOnly = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const calculateTotalDays = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return null;
  }
  return Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
};

const assertValidDateRange = (startDate, endDate) => {
  const normalizedStart = toDateOnly(startDate);
  const normalizedEnd = toDateOnly(endDate);
  const totalDays = calculateTotalDays(normalizedStart, normalizedEnd);

  if (!normalizedStart || !normalizedEnd || totalDays === null) {
    throw Object.assign(new Error('Khoảng thời gian nghỉ phép không hợp lệ'), { status: 400 });
  }

  return { startDate: normalizedStart, endDate: normalizedEnd, totalDays };
};

const assertEmployeeEligible = async (db, employeeId) => {
  const [rows] = await db.query(
    `SELECT employee_id, full_name
     FROM employees
     WHERE employee_id = ? AND status = 'active' AND deleted_at IS NULL`,
    [employeeId]
  );

  if (!rows.length) {
    throw Object.assign(new Error('Nhân viên không tồn tại hoặc đã ngừng hoạt động'), { status: 400 });
  }

  return rows[0];
};

const findOverlap = async (db, { employeeId, startDate, endDate, statuses, excludeRequestId = null }) => {
  const placeholders = statuses.map(() => '?').join(', ');
  const params = [employeeId, ...statuses, endDate, startDate];

  let query = `
    SELECT request_id, leave_type, start_date, end_date, status
    FROM leave_requests
    WHERE employee_id = ?
      AND status IN (${placeholders})
      AND start_date <= ?
      AND end_date >= ?`;

  if (excludeRequestId) {
    query += ' AND request_id != ?';
    params.push(excludeRequestId);
  }

  query += ' ORDER BY start_date ASC LIMIT 1';

  const [rows] = await db.query(query, params);
  return rows[0] || null;
};

const findOpenResignation = async (db, employeeId, excludeRequestId = null) => {
  const params = [employeeId];
  let query = `
    SELECT request_id, status, start_date, end_date
    FROM leave_requests
    WHERE employee_id = ?
      AND leave_type = 'resignation'
      AND status IN ('pending', 'approved')`;

  if (excludeRequestId) {
    query += ' AND request_id != ?';
    params.push(excludeRequestId);
  }

  query += ' ORDER BY created_at DESC LIMIT 1';

  const [rows] = await db.query(query, params);
  return rows[0] || null;
};

const Leave = {
  findAll: async ({ page = 1, limit = 10, employee_id, status }) => {
    await syncApprovedResignations(undefined, employee_id ? Number(employee_id) : null);

    let query = `SELECT lr.*, e.full_name as employee_name, u.username as approved_by_name
                 FROM leave_requests lr
                 JOIN employees e ON lr.employee_id = e.employee_id
                 LEFT JOIN users u ON lr.approved_by = u.user_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM leave_requests WHERE 1=1';
    const params = [];
    const countParams = [];

    if (employee_id) {
      query += ' AND lr.employee_id = ?';
      countQuery += ' AND employee_id = ?';
      params.push(employee_id);
      countParams.push(employee_id);
    }

    if (status) {
      query += ' AND lr.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY lr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { leaves: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT lr.*, e.full_name as employee_name, u.username as approved_by_name
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.employee_id
       LEFT JOIN users u ON lr.approved_by = u.user_id
      WHERE lr.request_id = ?`,
      [id]
    );
    if (rows[0]?.employee_id) {
      await syncApprovedResignations(undefined, Number(rows[0].employee_id));
    }
    return rows[0];
  },

  create: async (data) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const employeeId = Number(data.employee_id);
      const leaveType = data.leave_type || 'annual';
      const reason = data.reason?.trim();
      const { startDate, endDate, totalDays } = assertValidDateRange(data.start_date, data.end_date);

      if (!employeeId) {
        throw Object.assign(new Error('employee_id là bắt buộc'), { status: 400 });
      }

      if (!reason) {
        throw Object.assign(new Error('Lý do nghỉ phép là bắt buộc'), { status: 400 });
      }

      await assertEmployeeEligible(connection, employeeId);

      if (leaveType === 'resignation') {
        const openResignation = await findOpenResignation(connection, employeeId);
        if (openResignation) {
          throw Object.assign(
            new Error(
              `Nhân viên đã có đơn nghỉ việc ${openResignation.status === 'approved' ? 'được duyệt' : 'đang chờ duyệt'} (hiệu lực đến ${toDateOnly(openResignation.end_date)})`
            ),
            { status: 409 }
          );
        }
      }

      const conflict = await findOverlap(connection, {
        employeeId,
        startDate,
        endDate,
        statuses: ['pending', 'approved']
      });

      if (conflict) {
        throw Object.assign(
          new Error(
            `Nhân viên đã có đơn ${LEAVE_TYPE_LABELS[conflict.leave_type] || conflict.leave_type} ${conflict.status === 'approved' ? 'đã duyệt' : 'chờ duyệt'} trùng khoảng ${toDateOnly(conflict.start_date)} đến ${toDateOnly(conflict.end_date)}`
          ),
          { status: 409 }
        );
      }

      const [result] = await connection.query(
        `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, leaveType, startDate, endDate, totalDays, reason]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  approve: async (id, userId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [leaveRows] = await connection.query(
        `SELECT request_id, employee_id, leave_type, start_date, end_date, status
         FROM leave_requests
         WHERE request_id = ?
         FOR UPDATE`,
        [id]
      );
      const leave = leaveRows[0];
      if (!leave) {
        throw Object.assign(new Error('Không tìm thấy đơn nghỉ phép'), { status: 404 });
      }

      if (leave.status !== 'pending') {
        throw Object.assign(new Error('Chỉ có thể duyệt đơn đang chờ xử lý'), { status: 409 });
      }

      const conflict = await findOverlap(connection, {
        employeeId: leave.employee_id,
        startDate: toDateOnly(leave.start_date),
        endDate: toDateOnly(leave.end_date),
        statuses: ['approved'],
        excludeRequestId: Number(id)
      });

      if (conflict) {
        throw Object.assign(
          new Error(
            `Nhân viên đã có đơn được duyệt trùng khoảng ${toDateOnly(conflict.start_date)} đến ${toDateOnly(conflict.end_date)}`
          ),
          { status: 409 }
        );
      }

      const [result] = await connection.query(
        `UPDATE leave_requests
         SET status = 'approved', approved_by = ?, approved_at = NOW(), reject_reason = NULL
         WHERE request_id = ? AND status = 'pending'`,
        [userId, id]
      );

      if (leave.leave_type === 'resignation') {
        await syncApprovedResignations(connection, leave.employee_id);
      }

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  reject: async (id, userId, rejectReason) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [leaveRows] = await connection.query(
        `SELECT request_id, status
         FROM leave_requests
         WHERE request_id = ?
         FOR UPDATE`,
        [id]
      );
      const leave = leaveRows[0];
      if (!leave) {
        throw Object.assign(new Error('Không tìm thấy đơn nghỉ phép'), { status: 404 });
      }

      if (leave.status !== 'pending') {
        throw Object.assign(new Error('Chỉ có thể từ chối đơn đang chờ xử lý'), { status: 409 });
      }

      const [result] = await connection.query(
        `UPDATE leave_requests
         SET status = 'rejected', approved_by = ?, approved_at = NOW(), reject_reason = ?
         WHERE request_id = ? AND status = 'pending'`,
        [userId, rejectReason?.trim() || null, id]
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM leave_requests WHERE request_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Leave;
