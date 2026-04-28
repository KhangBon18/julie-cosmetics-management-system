const { pool } = require('../config/db');

let _attendanceTableReady = null;
const MANUAL_EMPTY_STATUSES = new Set(['pending', 'absent', 'leave', 'holiday']);

const ATTENDANCE_SELECT = `
  SELECT ar.attendance_id,
         ar.employee_id,
         e.full_name AS employee_name,
         DATE_FORMAT(ar.work_date, '%Y-%m-%d') AS work_date,
         ar.shift_id,
         s.shift_code,
         s.shift_name,
         DATE_FORMAT(ar.check_in_at, '%Y-%m-%d %H:%i:%s') AS check_in_at,
         DATE_FORMAT(ar.check_out_at, '%Y-%m-%d %H:%i:%s') AS check_out_at,
         ar.source,
         ar.status,
         ar.minutes_late,
         ar.minutes_early_leave,
         ar.work_minutes,
         ar.overtime_minutes,
         ar.note,
         ar.verified_by,
         uv.username AS verified_by_name,
         DATE_FORMAT(ar.verified_at, '%Y-%m-%d %H:%i:%s') AS verified_at,
         DATE_FORMAT(ar.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
         DATE_FORMAT(ar.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at
  FROM attendance_records ar
  JOIN employees e ON ar.employee_id = e.employee_id
  LEFT JOIN attendance_shifts s ON ar.shift_id = s.shift_id
  LEFT JOIN users uv ON ar.verified_by = uv.user_id
`;

const ADJUSTMENT_SELECT = `
  SELECT aar.request_id,
         aar.employee_id,
         e.full_name AS employee_name,
         aar.attendance_id,
         DATE_FORMAT(aar.work_date, '%Y-%m-%d') AS work_date,
         DATE_FORMAT(aar.requested_check_in_at, '%Y-%m-%d %H:%i:%s') AS requested_check_in_at,
         DATE_FORMAT(aar.requested_check_out_at, '%Y-%m-%d %H:%i:%s') AS requested_check_out_at,
         aar.reason,
         aar.status,
         aar.reviewed_by,
         ur.username AS reviewed_by_name,
         DATE_FORMAT(aar.reviewed_at, '%Y-%m-%d %H:%i:%s') AS reviewed_at,
         aar.reject_reason,
         DATE_FORMAT(aar.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
         DATE_FORMAT(aar.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
         DATE_FORMAT(ar.check_in_at, '%Y-%m-%d %H:%i:%s') AS current_check_in_at,
         DATE_FORMAT(ar.check_out_at, '%Y-%m-%d %H:%i:%s') AS current_check_out_at,
         ar.status AS current_attendance_status
  FROM attendance_adjustment_requests aar
  JOIN employees e ON aar.employee_id = e.employee_id
  LEFT JOIN users ur ON aar.reviewed_by = ur.user_id
  LEFT JOIN attendance_records ar ON aar.attendance_id = ar.attendance_id
`;

const normalizePositiveInt = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const pad = (value) => String(value).padStart(2, '0');

const normalizeDateInput = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const text = String(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
};

const normalizeDateTimeInput = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
  }

  const text = String(value).trim().replace('T', ' ');
  const match = text.match(
    /^(\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) return null;

  return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6] || '00'}`;
};

const parseDateOnly = (value) => {
  const normalized = normalizeDateInput(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

const parseDateTime = (value) => {
  const normalized = normalizeDateTimeInput(value);
  if (!normalized) return null;
  const [datePart, timePart] = normalized.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second || 0, 0);
};

const combineDateAndTime = (dateValue, timeValue) => {
  const baseDate = parseDateOnly(dateValue);
  if (!baseDate || !timeValue) return null;
  const [hour, minute, second] = String(timeValue).split(':').map(Number);
  if ([hour, minute].some(Number.isNaN)) return null;
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hour,
    minute,
    Number.isNaN(second) ? 0 : second,
    0
  );
};

const diffMinutes = (later, earlier) => {
  if (!(later instanceof Date) || !(earlier instanceof Date)) return 0;
  return Math.max(0, Math.floor((later.getTime() - earlier.getTime()) / 60000));
};

const appendNote = (baseNote, extraNote) => {
  const current = String(baseNote || '').trim();
  const extra = String(extraNote || '').trim();

  if (!current) return extra || null;
  if (!extra) return current;
  return `${current}\n${extra}`;
};

const applyAttendanceFilters = (filters = {}, alias = 'ar') => {
  const where = ['1=1'];
  const params = [];

  if (filters.employee_id) {
    where.push(`${alias}.employee_id = ?`);
    params.push(Number(filters.employee_id));
  }

  if (filters.status) {
    where.push(`${alias}.status = ?`);
    params.push(filters.status);
  }

  if (filters.from_date) {
    where.push(`${alias}.work_date >= ?`);
    params.push(filters.from_date);
  }

  if (filters.to_date) {
    where.push(`${alias}.work_date <= ?`);
    params.push(filters.to_date);
  }

  return { where, params };
};

const applyAdjustmentFilters = (filters = {}) => {
  const where = ['1=1'];
  const params = [];

  if (filters.employee_id) {
    where.push('aar.employee_id = ?');
    params.push(Number(filters.employee_id));
  }

  if (filters.status) {
    where.push('aar.status = ?');
    params.push(filters.status);
  }

  if (filters.from_date) {
    where.push('aar.work_date >= ?');
    params.push(filters.from_date);
  }

  if (filters.to_date) {
    where.push('aar.work_date <= ?');
    params.push(filters.to_date);
  }

  return { where, params };
};

const ensureEmployeeExists = async (executor, employeeId) => {
  const [rows] = await executor.query(
    `SELECT employee_id, full_name, status, deleted_at
     FROM employees
     WHERE employee_id = ?
     LIMIT 1`,
    [employeeId]
  );

  if (!rows.length || rows[0].deleted_at) {
    throw Object.assign(new Error('Nhân viên không tồn tại'), { status: 404 });
  }

  return rows[0];
};

const getShiftById = async (shiftId, executor = pool) => {
  const [rows] = await executor.query(
    `SELECT shift_id, shift_code, shift_name, start_time, end_time, break_minutes, grace_minutes, standard_work_minutes, is_active
     FROM attendance_shifts
     WHERE shift_id = ?
     LIMIT 1`,
    [shiftId]
  );

  return rows[0] || null;
};

const getCurrentDbMoment = async (executor = pool) => {
  const [rows] = await executor.query(
    `SELECT DATE_FORMAT(CURDATE(), '%Y-%m-%d') AS work_date,
            DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s') AS now_at`
  );
  return rows[0];
};

const getApprovedLeaveForEmployeeDate = async (employeeId, workDate, executor = pool) => {
  const [rows] = await executor.query(
    `SELECT request_id,
            leave_type,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
            reason
     FROM leave_requests
     WHERE employee_id = ?
       AND status = 'approved'
       AND start_date <= ?
       AND end_date >= ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [employeeId, workDate, workDate]
  );

  return rows[0] || null;
};

const Attendance = {
  hasAttendanceTable: async (executor = pool) => {
    if (executor === pool && _attendanceTableReady !== null) return _attendanceTableReady;

    try {
      await executor.query('SELECT attendance_id FROM attendance_records LIMIT 0');
      if (executor === pool) _attendanceTableReady = true;
      return true;
    } catch {
      if (executor === pool) _attendanceTableReady = false;
      return false;
    }
  },

  getCurrentDbMoment,

  getApprovedLeaveForEmployeeDate,

  getDefaultShift: async (executor = pool) => {
    const [rows] = await executor.query(
      `SELECT shift_id, shift_code, shift_name, start_time, end_time, break_minutes, grace_minutes, standard_work_minutes, is_active
       FROM attendance_shifts
       WHERE shift_code = 'HC'
       LIMIT 1`
    );

    if (rows[0]) return rows[0];

    const [fallbackRows] = await executor.query(
      `SELECT shift_id, shift_code, shift_name, start_time, end_time, break_minutes, grace_minutes, standard_work_minutes, is_active
       FROM attendance_shifts
       WHERE is_active = 1
       ORDER BY shift_id ASC
       LIMIT 1`
    );

    if (!fallbackRows[0]) {
      throw Object.assign(new Error('Chưa cấu hình ca làm việc mặc định cho hệ thống'), { status: 503 });
    }

    return fallbackRows[0];
  },

  getShiftForEmployee: async (employeeId, workDate, executor = pool) => {
    const normalizedDate = normalizeDateInput(workDate);
    if (!normalizedDate) {
      throw Object.assign(new Error('Ngày công không hợp lệ'), { status: 400 });
    }

    const [rows] = await executor.query(
      `SELECT s.shift_id, s.shift_code, s.shift_name, s.start_time, s.end_time,
              s.break_minutes, s.grace_minutes, s.standard_work_minutes, s.is_active
       FROM employee_shift_assignments esa
       JOIN attendance_shifts s ON esa.shift_id = s.shift_id
       WHERE esa.employee_id = ?
         AND esa.effective_from <= ?
         AND (esa.effective_to IS NULL OR esa.effective_to >= ?)
       ORDER BY esa.effective_from DESC, esa.assignment_id DESC
       LIMIT 1`,
      [employeeId, normalizedDate, normalizedDate]
    );

    if (rows[0]) return rows[0];
    return Attendance.getDefaultShift(executor);
  },

  recalculateRecord: (record = {}) => {
    const shift = record.shift || {
      start_time: record.start_time,
      end_time: record.end_time,
      break_minutes: record.break_minutes,
      grace_minutes: record.grace_minutes,
      standard_work_minutes: record.standard_work_minutes,
    };

    const manualStatus = String(record.manual_status || record.status || '').trim();
    const checkIn = parseDateTime(record.check_in_at);
    const checkOut = parseDateTime(record.check_out_at);

    let minutesLate = 0;
    let minutesEarlyLeave = 0;
    let workMinutes = 0;
    let overtimeMinutes = 0;
    let status = manualStatus && MANUAL_EMPTY_STATUSES.has(manualStatus) ? manualStatus : 'pending';

    if (checkIn) {
      const shiftStart = combineDateAndTime(record.work_date, shift.start_time);
      if (shiftStart) {
        const graceStart = new Date(shiftStart.getTime() + Number(shift.grace_minutes || 0) * 60000);
        minutesLate = diffMinutes(checkIn, graceStart);
      }
      status = 'incomplete';
    }

    if (checkIn && checkOut) {
      const shiftEnd = combineDateAndTime(record.work_date, shift.end_time);
      if (shiftEnd && shift.start_time && shift.end_time && shiftEnd <= combineDateAndTime(record.work_date, shift.start_time)) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }

      if (shiftEnd && checkOut < shiftEnd) {
        minutesEarlyLeave = diffMinutes(shiftEnd, checkOut);
      }

      const rawMinutes = diffMinutes(checkOut, checkIn);
      workMinutes = Math.max(0, rawMinutes - Number(shift.break_minutes || 0));
      overtimeMinutes = Math.max(0, workMinutes - Number(shift.standard_work_minutes || 0));

      if (workMinutes < Number(shift.standard_work_minutes || 0) / 2) {
        status = 'half_day';
      } else if (minutesLate > 0 && minutesEarlyLeave > 0) {
        status = 'late_and_early';
      } else if (minutesLate > 0) {
        status = 'late';
      } else if (minutesEarlyLeave > 0) {
        status = 'early_leave';
      } else {
        status = 'present';
      }
    }

    if (!checkIn && !checkOut && manualStatus && MANUAL_EMPTY_STATUSES.has(manualStatus)) {
      status = manualStatus;
    }

    return {
      status,
      minutes_late: minutesLate,
      minutes_early_leave: minutesEarlyLeave,
      work_minutes: workMinutes,
      overtime_minutes: overtimeMinutes,
    };
  },

  findAll: async (filters = {}) => {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 50));
    const { where, params } = applyAttendanceFilters(filters);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `${ATTENDANCE_SELECT}
       WHERE ${where.join(' AND ')}
       ORDER BY ar.work_date DESC, e.full_name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM attendance_records ar
       WHERE ${where.join(' AND ')}`,
      params
    );

    return {
      attendances: rows,
      total: countRows[0]?.total || 0,
      page,
      limit,
    };
  },

  findById: async (id, executor = pool, lockForUpdate = false) => {
    const [rows] = await executor.query(
      `${ATTENDANCE_SELECT}
       WHERE ar.attendance_id = ?
       LIMIT 1${lockForUpdate ? ' FOR UPDATE' : ''}`,
      [id]
    );
    return rows[0] || null;
  },

  findByEmployeeAndDate: async (employeeId, workDate, executor = pool, lockForUpdate = false) => {
    const normalizedDate = normalizeDateInput(workDate);
    if (!normalizedDate) return null;

    const [rows] = await executor.query(
      `${ATTENDANCE_SELECT}
       WHERE ar.employee_id = ?
         AND ar.work_date = ?
       LIMIT 1${lockForUpdate ? ' FOR UPDATE' : ''}`,
      [employeeId, normalizedDate]
    );

    return rows[0] || null;
  },

  checkIn: async (employeeId, userId, optionalNote) => {
    const normalizedEmployeeId = normalizePositiveInt(employeeId);
    if (!normalizedEmployeeId) {
      throw Object.assign(new Error('Không xác định được nhân viên để chấm công'), { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const employee = await ensureEmployeeExists(connection, normalizedEmployeeId);
      if (employee.status !== 'active') {
        throw Object.assign(new Error('Nhân viên đã ngừng hoạt động, không thể chấm công'), { status: 400 });
      }

      const currentMoment = await getCurrentDbMoment(connection);
      const existing = await Attendance.findByEmployeeAndDate(normalizedEmployeeId, currentMoment.work_date, connection, true);

      if (existing?.check_in_at) {
        throw Object.assign(new Error('Bạn đã chấm vào hôm nay'), { status: 409 });
      }

      const shift = existing?.shift_id
        ? (await getShiftById(existing.shift_id, connection)) || (await Attendance.getShiftForEmployee(normalizedEmployeeId, currentMoment.work_date, connection))
        : await Attendance.getShiftForEmployee(normalizedEmployeeId, currentMoment.work_date, connection);

      const calculated = Attendance.recalculateRecord({
        work_date: currentMoment.work_date,
        check_in_at: currentMoment.now_at,
        check_out_at: existing?.check_out_at || null,
        shift,
        status: existing?.status,
      });

      let attendanceId = existing?.attendance_id;
      if (existing) {
        await connection.query(
          `UPDATE attendance_records
           SET shift_id = ?,
               check_in_at = ?,
               source = 'self',
               status = ?,
               minutes_late = ?,
               minutes_early_leave = ?,
               work_minutes = ?,
               overtime_minutes = ?,
               note = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE attendance_id = ?`,
          [
            shift.shift_id,
            currentMoment.now_at,
            calculated.status,
            calculated.minutes_late,
            calculated.minutes_early_leave,
            calculated.work_minutes,
            calculated.overtime_minutes,
            appendNote(existing.note, optionalNote),
            existing.attendance_id,
          ]
        );
      } else {
        const [result] = await connection.query(
          `INSERT INTO attendance_records (
             employee_id, work_date, shift_id, check_in_at, source, status,
             minutes_late, minutes_early_leave, work_minutes, overtime_minutes, note
           ) VALUES (?, ?, ?, ?, 'self', ?, ?, ?, ?, ?, ?)`,
          [
            normalizedEmployeeId,
            currentMoment.work_date,
            shift.shift_id,
            currentMoment.now_at,
            calculated.status,
            calculated.minutes_late,
            calculated.minutes_early_leave,
            calculated.work_minutes,
            calculated.overtime_minutes,
            String(optionalNote || '').trim() || null,
          ]
        );
        attendanceId = result.insertId;
      }

      await connection.commit();
      return Attendance.findById(attendanceId);
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        throw Object.assign(new Error('Bạn đã chấm vào hôm nay'), { status: 409 });
      }
      throw error;
    } finally {
      connection.release();
    }
  },

  checkOut: async (employeeId, userId, optionalNote) => {
    const normalizedEmployeeId = normalizePositiveInt(employeeId);
    if (!normalizedEmployeeId) {
      throw Object.assign(new Error('Không xác định được nhân viên để chấm công'), { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const employee = await ensureEmployeeExists(connection, normalizedEmployeeId);
      if (employee.status !== 'active') {
        throw Object.assign(new Error('Nhân viên đã ngừng hoạt động, không thể chấm công'), { status: 400 });
      }

      const currentMoment = await getCurrentDbMoment(connection);
      const existing = await Attendance.findByEmployeeAndDate(normalizedEmployeeId, currentMoment.work_date, connection, true);

      if (!existing?.check_in_at) {
        throw Object.assign(new Error('Bạn chưa chấm vào nên không thể chấm ra'), { status: 409 });
      }

      if (existing.check_out_at) {
        throw Object.assign(new Error('Bạn đã chấm ra hôm nay'), { status: 409 });
      }

      const shift = existing.shift_id
        ? (await getShiftById(existing.shift_id, connection)) || (await Attendance.getShiftForEmployee(normalizedEmployeeId, currentMoment.work_date, connection))
        : await Attendance.getShiftForEmployee(normalizedEmployeeId, currentMoment.work_date, connection);

      const calculated = Attendance.recalculateRecord({
        work_date: currentMoment.work_date,
        check_in_at: existing.check_in_at,
        check_out_at: currentMoment.now_at,
        shift,
      });

      await connection.query(
        `UPDATE attendance_records
         SET shift_id = ?,
             check_out_at = ?,
             source = CASE WHEN source = 'manual' THEN 'manual' ELSE 'self' END,
             status = ?,
             minutes_late = ?,
             minutes_early_leave = ?,
             work_minutes = ?,
             overtime_minutes = ?,
             note = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE attendance_id = ?`,
        [
          shift.shift_id,
          currentMoment.now_at,
          calculated.status,
          calculated.minutes_late,
          calculated.minutes_early_leave,
          calculated.work_minutes,
          calculated.overtime_minutes,
          appendNote(existing.note, optionalNote),
          existing.attendance_id,
        ]
      );

      await connection.commit();
      return Attendance.findById(existing.attendance_id);
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        throw Object.assign(new Error('Nhân viên đã có bản ghi chấm công trong ngày này'), { status: 409 });
      }
      throw error;
    } finally {
      connection.release();
    }
  },

  upsertManual: async (data = {}, userId) => {
    const employeeId = normalizePositiveInt(data.employee_id);
    const workDate = normalizeDateInput(data.work_date);
    const checkInAt = normalizeDateTimeInput(data.check_in_at);
    const checkOutAt = normalizeDateTimeInput(data.check_out_at);
    const attendanceId = normalizePositiveInt(data.attendance_id);
    const requestedShiftId = normalizePositiveInt(data.shift_id);
    const manualStatus = String(data.status || '').trim();

    if (!employeeId) {
      throw Object.assign(new Error('Vui lòng chọn nhân viên'), { status: 400 });
    }
    if (!workDate) {
      throw Object.assign(new Error('Ngày công không hợp lệ'), { status: 400 });
    }
    if (checkOutAt && !checkInAt) {
      throw Object.assign(new Error('Không thể nhập giờ ra khi chưa có giờ vào'), { status: 400 });
    }
    if (checkInAt && checkOutAt && parseDateTime(checkOutAt) <= parseDateTime(checkInAt)) {
      throw Object.assign(new Error('Giờ ra phải sau giờ vào'), { status: 400 });
    }
    if (!checkInAt && !checkOutAt && manualStatus && !MANUAL_EMPTY_STATUSES.has(manualStatus)) {
      throw Object.assign(new Error('Trạng thái thủ công không hợp lệ khi không có giờ vào/ra'), { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await ensureEmployeeExists(connection, employeeId);

      const existingById = attendanceId
        ? await Attendance.findById(attendanceId, connection, true)
        : null;

      if (attendanceId && !existingById) {
        throw Object.assign(new Error('Không tìm thấy bản ghi chấm công cần cập nhật'), { status: 404 });
      }

      const existingByDate = await Attendance.findByEmployeeAndDate(employeeId, workDate, connection, true);
      if (existingByDate && existingById && existingByDate.attendance_id !== existingById.attendance_id) {
        throw Object.assign(new Error('Nhân viên đã có bản ghi chấm công trong ngày này'), { status: 409 });
      }
      if (existingById && existingByDate && existingById.attendance_id !== existingByDate.attendance_id) {
        throw Object.assign(new Error('Ngày công mới trùng với bản ghi hiện có của nhân viên'), { status: 409 });
      }

      const targetExisting = existingById || existingByDate;
      const shift = requestedShiftId
        ? await getShiftById(requestedShiftId, connection)
        : targetExisting?.shift_id
          ? (await getShiftById(targetExisting.shift_id, connection))
          : await Attendance.getShiftForEmployee(employeeId, workDate, connection);

      if (!shift) {
        throw Object.assign(new Error('Ca làm việc không tồn tại'), { status: 400 });
      }

      const calculated = Attendance.recalculateRecord({
        work_date: workDate,
        check_in_at: checkInAt,
        check_out_at: checkOutAt,
        shift,
        manual_status: !checkInAt && !checkOutAt ? manualStatus || 'pending' : null,
      });

      let targetAttendanceId = targetExisting?.attendance_id;
      if (targetExisting) {
        await connection.query(
          `UPDATE attendance_records
           SET employee_id = ?,
               work_date = ?,
               shift_id = ?,
               check_in_at = ?,
               check_out_at = ?,
               source = 'manual',
               status = ?,
               minutes_late = ?,
               minutes_early_leave = ?,
               work_minutes = ?,
               overtime_minutes = ?,
               note = ?,
               verified_by = ?,
               verified_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE attendance_id = ?`,
          [
            employeeId,
            workDate,
            shift.shift_id,
            checkInAt,
            checkOutAt,
            calculated.status,
            calculated.minutes_late,
            calculated.minutes_early_leave,
            calculated.work_minutes,
            calculated.overtime_minutes,
            String(data.note || '').trim() || null,
            userId || null,
            targetExisting.attendance_id,
          ]
        );
      } else {
        const [result] = await connection.query(
          `INSERT INTO attendance_records (
             employee_id, work_date, shift_id, check_in_at, check_out_at, source, status,
             minutes_late, minutes_early_leave, work_minutes, overtime_minutes, note, verified_by, verified_at
           ) VALUES (?, ?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            employeeId,
            workDate,
            shift.shift_id,
            checkInAt,
            checkOutAt,
            calculated.status,
            calculated.minutes_late,
            calculated.minutes_early_leave,
            calculated.work_minutes,
            calculated.overtime_minutes,
            String(data.note || '').trim() || null,
            userId || null,
          ]
        );
        targetAttendanceId = result.insertId;
      }

      await connection.commit();
      return Attendance.findById(targetAttendanceId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  updateById: async (attendanceId, data = {}, userId) => {
    const current = await Attendance.findById(attendanceId);
    if (!current) {
      throw Object.assign(new Error('Không tìm thấy bản ghi chấm công'), { status: 404 });
    }

    return Attendance.upsertManual({
      attendance_id: attendanceId,
      employee_id: data.employee_id || current.employee_id,
      work_date: data.work_date || current.work_date,
      shift_id: data.shift_id || current.shift_id,
      check_in_at: data.check_in_at !== undefined ? data.check_in_at : current.check_in_at,
      check_out_at: data.check_out_at !== undefined ? data.check_out_at : current.check_out_at,
      note: data.note !== undefined ? data.note : current.note,
      status: data.status !== undefined ? data.status : current.status,
    }, userId);
  },

  delete: async (attendanceId) => {
    const [result] = await pool.query('DELETE FROM attendance_records WHERE attendance_id = ?', [attendanceId]);
    return result.affectedRows;
  },

  getSummary: async (filters = {}) => {
    const normalizedFilters = {
      employee_id: filters.employee_id ? Number(filters.employee_id) : null,
      status: filters.status || null,
      from_date: normalizeDateInput(filters.from_date),
      to_date: normalizeDateInput(filters.to_date),
    };
    const { where, params } = applyAttendanceFilters(normalizedFilters);

    const [summaryRows] = await pool.query(
      `SELECT COUNT(DISTINCT CASE WHEN ar.check_in_at IS NOT NULL THEN ar.employee_id END) AS total_employees_with_attendance,
              COUNT(DISTINCT ar.employee_id) AS total_employees_with_records,
              SUM(CASE WHEN ar.minutes_late > 0 THEN 1 ELSE 0 END) AS total_late,
              SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS explicit_absent_records,
              SUM(COALESCE(ar.work_minutes, 0)) AS total_work_minutes,
              SUM(COALESCE(ar.overtime_minutes, 0)) AS total_overtime_minutes
       FROM attendance_records ar
       WHERE ${where.join(' AND ')}`,
      params
    );

    let totalAbsent = Number(summaryRows[0]?.explicit_absent_records || 0);
    const isSingleDayRange = normalizedFilters.from_date
      && normalizedFilters.to_date
      && normalizedFilters.from_date === normalizedFilters.to_date;

    if (isSingleDayRange) {
      const [recordCoverageRows] = await pool.query(
        `SELECT COUNT(DISTINCT employee_id) AS total
         FROM attendance_records
         WHERE work_date = ?${normalizedFilters.employee_id ? ' AND employee_id = ?' : ''}`,
        normalizedFilters.employee_id
          ? [normalizedFilters.from_date, normalizedFilters.employee_id]
          : [normalizedFilters.from_date]
      );

      const [activeRows] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM employees
         WHERE deleted_at IS NULL
           AND status = 'active'${normalizedFilters.employee_id ? ' AND employee_id = ?' : ''}`,
        normalizedFilters.employee_id ? [normalizedFilters.employee_id] : []
      );

      const [leaveRows] = await pool.query(
        `SELECT COUNT(DISTINCT lr.employee_id) AS total
         FROM leave_requests lr
         WHERE lr.status = 'approved'
           AND lr.start_date <= ?
           AND lr.end_date >= ?${normalizedFilters.employee_id ? ' AND lr.employee_id = ?' : ''}
           AND NOT EXISTS (
             SELECT 1
             FROM attendance_records ar
             WHERE ar.employee_id = lr.employee_id
               AND ar.work_date = ?
           )`,
        normalizedFilters.employee_id
          ? [normalizedFilters.from_date, normalizedFilters.from_date, normalizedFilters.employee_id, normalizedFilters.from_date]
          : [normalizedFilters.from_date, normalizedFilters.from_date, normalizedFilters.from_date]
      );

      const activeEmployeeCount = Number(activeRows[0]?.total || 0);
      const employeesWithAnyRecord = Number(recordCoverageRows[0]?.total || 0);
      const leaveOnlyEmployees = Number(leaveRows[0]?.total || 0);
      totalAbsent += Math.max(0, activeEmployeeCount - employeesWithAnyRecord - leaveOnlyEmployees);
    }

    return {
      total_employees_with_attendance: Number(summaryRows[0]?.total_employees_with_attendance || 0),
      total_late: Number(summaryRows[0]?.total_late || 0),
      total_absent: totalAbsent,
      total_work_minutes: Number(summaryRows[0]?.total_work_minutes || 0),
      total_overtime_minutes: Number(summaryRows[0]?.total_overtime_minutes || 0),
      inferred_absent: isSingleDayRange,
    };
  },

  exportRows: async (filters = {}) => {
    const normalizedFilters = {
      employee_id: filters.employee_id ? Number(filters.employee_id) : null,
      status: filters.status || null,
      from_date: normalizeDateInput(filters.from_date),
      to_date: normalizeDateInput(filters.to_date),
    };
    const { where, params } = applyAttendanceFilters(normalizedFilters);

    const [rows] = await pool.query(
      `${ATTENDANCE_SELECT}
       WHERE ${where.join(' AND ')}
       ORDER BY ar.work_date DESC, e.full_name ASC`,
      params
    );

    return rows;
  },

  createAdjustmentRequest: async (employeeId, data = {}) => {
    const normalizedEmployeeId = normalizePositiveInt(employeeId);
    const workDate = normalizeDateInput(data.work_date);
    const requestedCheckInAt = normalizeDateTimeInput(data.requested_check_in_at);
    const requestedCheckOutAt = normalizeDateTimeInput(data.requested_check_out_at);
    const reason = String(data.reason || '').trim();

    if (!normalizedEmployeeId) {
      throw Object.assign(new Error('Không xác định được nhân viên'), { status: 400 });
    }
    if (!workDate) {
      throw Object.assign(new Error('Ngày công không hợp lệ'), { status: 400 });
    }
    if (!reason) {
      throw Object.assign(new Error('Lý do điều chỉnh là bắt buộc'), { status: 400 });
    }
    if (!requestedCheckInAt && !requestedCheckOutAt) {
      throw Object.assign(new Error('Vui lòng nhập ít nhất giờ vào hoặc giờ ra cần điều chỉnh'), { status: 400 });
    }
    if (requestedCheckInAt && requestedCheckOutAt && parseDateTime(requestedCheckOutAt) <= parseDateTime(requestedCheckInAt)) {
      throw Object.assign(new Error('Giờ ra đề nghị phải sau giờ vào đề nghị'), { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await ensureEmployeeExists(connection, normalizedEmployeeId);
      const currentAttendance = await Attendance.findByEmployeeAndDate(normalizedEmployeeId, workDate, connection, true);

      const [pendingRows] = await connection.query(
        `SELECT request_id
         FROM attendance_adjustment_requests
         WHERE employee_id = ?
           AND work_date = ?
           AND status = 'pending'
         LIMIT 1
         FOR UPDATE`,
        [normalizedEmployeeId, workDate]
      );
      if (pendingRows[0]) {
        throw Object.assign(new Error('Đã tồn tại yêu cầu điều chỉnh công đang chờ xử lý cho ngày này'), { status: 409 });
      }

      const [result] = await connection.query(
        `INSERT INTO attendance_adjustment_requests (
           employee_id, attendance_id, work_date, requested_check_in_at, requested_check_out_at, reason
         ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          normalizedEmployeeId,
          currentAttendance?.attendance_id || null,
          workDate,
          requestedCheckInAt,
          requestedCheckOutAt,
          reason,
        ]
      );

      await connection.commit();
      return Attendance.getAdjustmentRequestById(result.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getAdjustmentRequests: async (filters = {}) => {
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(filters.limit) || 20));
    const { where, params } = applyAdjustmentFilters(filters);
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `${ADJUSTMENT_SELECT}
       WHERE ${where.join(' AND ')}
       ORDER BY aar.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM attendance_adjustment_requests aar
       WHERE ${where.join(' AND ')}`,
      params
    );

    return {
      adjustments: rows,
      total: countRows[0]?.total || 0,
      page,
      limit,
    };
  },

  getAdjustmentRequestById: async (requestId, executor = pool) => {
    const [rows] = await executor.query(
      `${ADJUSTMENT_SELECT}
       WHERE aar.request_id = ?
       LIMIT 1`,
      [requestId]
    );

    return rows[0] || null;
  },

  approveAdjustmentRequest: async (requestId, reviewerUserId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [requestRows] = await connection.query(
        `SELECT request_id, employee_id, attendance_id,
                DATE_FORMAT(work_date, '%Y-%m-%d') AS work_date,
                DATE_FORMAT(requested_check_in_at, '%Y-%m-%d %H:%i:%s') AS requested_check_in_at,
                DATE_FORMAT(requested_check_out_at, '%Y-%m-%d %H:%i:%s') AS requested_check_out_at,
                reason, status
         FROM attendance_adjustment_requests
         WHERE request_id = ?
         LIMIT 1
         FOR UPDATE`,
        [requestId]
      );

      const request = requestRows[0];
      if (!request) {
        throw Object.assign(new Error('Không tìm thấy yêu cầu điều chỉnh công'), { status: 404 });
      }
      if (request.status !== 'pending') {
        throw Object.assign(new Error('Chỉ có thể duyệt yêu cầu đang chờ xử lý'), { status: 409 });
      }

      const existing = request.attendance_id
        ? await Attendance.findById(request.attendance_id, connection, true)
        : await Attendance.findByEmployeeAndDate(request.employee_id, request.work_date, connection, true);

      const mergedCheckIn = request.requested_check_in_at || existing?.check_in_at || null;
      const mergedCheckOut = request.requested_check_out_at || existing?.check_out_at || null;

      if (mergedCheckOut && !mergedCheckIn) {
        throw Object.assign(new Error('Không thể duyệt giờ ra khi chưa có giờ vào tương ứng'), { status: 400 });
      }
      if (mergedCheckIn && mergedCheckOut && parseDateTime(mergedCheckOut) <= parseDateTime(mergedCheckIn)) {
        throw Object.assign(new Error('Giờ ra sau điều chỉnh phải sau giờ vào'), { status: 400 });
      }

      const shift = existing?.shift_id
        ? (await getShiftById(existing.shift_id, connection)) || (await Attendance.getShiftForEmployee(request.employee_id, request.work_date, connection))
        : await Attendance.getShiftForEmployee(request.employee_id, request.work_date, connection);

      const calculated = Attendance.recalculateRecord({
        work_date: request.work_date,
        check_in_at: mergedCheckIn,
        check_out_at: mergedCheckOut,
        shift,
      });

      let attendanceId = existing?.attendance_id;
      if (existing) {
        await connection.query(
          `UPDATE attendance_records
           SET shift_id = ?,
               check_in_at = ?,
               check_out_at = ?,
               source = 'adjustment',
               status = ?,
               minutes_late = ?,
               minutes_early_leave = ?,
               work_minutes = ?,
               overtime_minutes = ?,
               note = ?,
               verified_by = ?,
               verified_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE attendance_id = ?`,
          [
            shift.shift_id,
            mergedCheckIn,
            mergedCheckOut,
            calculated.status,
            calculated.minutes_late,
            calculated.minutes_early_leave,
            calculated.work_minutes,
            calculated.overtime_minutes,
            appendNote(existing.note, `Điều chỉnh đã duyệt: ${request.reason}`),
            reviewerUserId || null,
            existing.attendance_id,
          ]
        );
      } else {
        const [result] = await connection.query(
          `INSERT INTO attendance_records (
             employee_id, work_date, shift_id, check_in_at, check_out_at, source, status,
             minutes_late, minutes_early_leave, work_minutes, overtime_minutes, note, verified_by, verified_at
           ) VALUES (?, ?, ?, ?, ?, 'adjustment', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            request.employee_id,
            request.work_date,
            shift.shift_id,
            mergedCheckIn,
            mergedCheckOut,
            calculated.status,
            calculated.minutes_late,
            calculated.minutes_early_leave,
            calculated.work_minutes,
            calculated.overtime_minutes,
            `Điều chỉnh đã duyệt: ${request.reason}`,
            reviewerUserId || null,
          ]
        );
        attendanceId = result.insertId;
      }

      await connection.query(
        `UPDATE attendance_adjustment_requests
         SET attendance_id = ?,
             status = 'approved',
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             reject_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE request_id = ?`,
        [attendanceId || existing?.attendance_id || null, reviewerUserId || null, requestId]
      );

      await connection.commit();
      return {
        request: await Attendance.getAdjustmentRequestById(requestId),
        attendance: await Attendance.findById(attendanceId || existing?.attendance_id),
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  rejectAdjustmentRequest: async (requestId, reviewerUserId, rejectReason) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [requestRows] = await connection.query(
        `SELECT request_id, status
         FROM attendance_adjustment_requests
         WHERE request_id = ?
         LIMIT 1
         FOR UPDATE`,
        [requestId]
      );

      if (!requestRows[0]) {
        throw Object.assign(new Error('Không tìm thấy yêu cầu điều chỉnh công'), { status: 404 });
      }
      if (requestRows[0].status !== 'pending') {
        throw Object.assign(new Error('Chỉ có thể từ chối yêu cầu đang chờ xử lý'), { status: 409 });
      }

      await connection.query(
        `UPDATE attendance_adjustment_requests
         SET status = 'rejected',
             reviewed_by = ?,
             reviewed_at = CURRENT_TIMESTAMP,
             reject_reason = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE request_id = ?`,
        [reviewerUserId || null, String(rejectReason || '').trim(), requestId]
      );

      await connection.commit();
      return Attendance.getAdjustmentRequestById(requestId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  getMonthlyWorkdaySummary: async (employeeId, month, year, executor = pool) => {
    if (!(await Attendance.hasAttendanceTable(executor))) {
      return null;
    }

    const [rows] = await executor.query(
      `SELECT COUNT(*) AS record_count,
              SUM(
                CASE
                  WHEN status IN ('present', 'late', 'early_leave', 'late_and_early') THEN 1
                  WHEN status = 'half_day' THEN 0.5
                  ELSE 0
                END
              ) AS work_days_actual
       FROM attendance_records
       WHERE employee_id = ?
         AND MONTH(work_date) = ?
         AND YEAR(work_date) = ?`,
      [employeeId, month, year]
    );

    const row = rows[0] || {};
    if (!Number(row.record_count || 0)) {
      return null;
    }

    return {
      record_count: Number(row.record_count || 0),
      work_days_actual: Number(row.work_days_actual || 0),
    };
  },
};

module.exports = Attendance;
