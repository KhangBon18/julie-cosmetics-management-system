const Employee = require('../models/employeeModel');
const Salary = require('../models/salaryModel');
const Leave = require('../models/leaveModel');
const { pool } = require('../config/db');

const staffController = {
  // GET /api/staff/profile — Lấy thông tin nhân viên gắn với user
  getProfile: async (req, res, next) => {
    try {
      if (!req.user.employee_id) {
        return res.status(400).json({ message: 'Tài khoản không liên kết với nhân viên nào' });
      }
      const employee = await Employee.findById(req.user.employee_id);
      if (!employee) return res.status(404).json({ message: 'Không tìm thấy thông tin nhân viên' });

      // Lấy lịch sử chức vụ
      const positionHistory = await Employee.getPositionHistory(req.user.employee_id);

      res.json({ ...employee, position_history: positionHistory });
    } catch (error) { next(error); }
  },

  // PUT /api/staff/profile — NV cập nhật thông tin cá nhân (giới hạn fields)
  updateProfile: async (req, res, next) => {
    try {
      if (!req.user.employee_id) {
        return res.status(400).json({ message: 'Tài khoản không liên kết với nhân viên nào' });
      }
      const { phone, address } = req.body; // Chỉ cho sửa phone, address
      const employee = await Employee.findById(req.user.employee_id);
      if (!employee) return res.status(404).json({ message: 'Không tìm thấy thông tin nhân viên' });

      await pool.query(
        'UPDATE employees SET phone = ?, address = ? WHERE employee_id = ?',
        [phone || employee.phone, address || employee.address, req.user.employee_id]
      );
      const updated = await Employee.findById(req.user.employee_id);
      res.json({ message: 'Cập nhật thông tin thành công', employee: updated });
    } catch (error) { next(error); }
  },

  // GET /api/staff/salaries — Lương cá nhân
  getMySalaries: async (req, res, next) => {
    try {
      if (!req.user.employee_id) {
        return res.status(400).json({ message: 'Tài khoản không liên kết với nhân viên nào' });
      }
      const { month, year, page, limit } = req.query;
      const result = await Salary.findAll({
        page: parseInt(page) || 1, limit: parseInt(limit) || 20,
        employee_id: req.user.employee_id,
        month, year
      });
      res.json(result);
    } catch (error) { next(error); }
  },

  // GET /api/staff/salary-formula — Xem cách tính lương
  getSalaryFormula: async (req, res, next) => {
    try {
      res.json({
        formula: 'Lương thực nhận = Lương cơ bản × (Ngày công thực tế / 22) + Thưởng − Khấu trừ',
        details: [
          'Ngày công chuẩn: 22 ngày/tháng',
          'Nghỉ phép năm (annual leave) đã duyệt: không trừ lương',
          'Nghỉ không phép (unpaid): trừ theo ngày',
          'Nghỉ ốm (sick): tùy quy định, có thể trừ 50%',
          'Thưởng doanh số: do Manager nhập cuối tháng',
          'Khấu trừ: bảo hiểm, thuế (nếu có)'
        ]
      });
    } catch (error) { next(error); }
  },

  // GET /api/staff/leaves — Đơn nghỉ phép cá nhân
  getMyLeaves: async (req, res, next) => {
    try {
      if (!req.user.employee_id) {
        return res.status(400).json({ message: 'Tài khoản không liên kết với nhân viên nào' });
      }
      const { status, page, limit } = req.query;
      const result = await Leave.findAll({
        page: parseInt(page) || 1, limit: parseInt(limit) || 20,
        employee_id: req.user.employee_id,
        status
      });
      res.json(result);
    } catch (error) { next(error); }
  },

  // POST /api/staff/leaves — NV tạo đơn nghỉ phép
  createLeave: async (req, res, next) => {
    try {
      if (!req.user.employee_id) {
        return res.status(400).json({ message: 'Tài khoản không liên kết với nhân viên nào' });
      }
      const { leave_type, start_date, end_date, reason } = req.body;

      if (!start_date || !end_date || !reason) {
        return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
      }

      // Tính số ngày nghỉ
      const start = new Date(start_date);
      const end = new Date(end_date);
      const diffTime = Math.abs(end - start);
      const total_days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const id = await Leave.create({
        employee_id: req.user.employee_id,
        leave_type: leave_type || 'annual',
        start_date,
        end_date,
        total_days,
        reason
      });

      const leave = await Leave.findById(id);
      res.status(201).json({ message: 'Nộp đơn nghỉ phép thành công', leave });
    } catch (error) { next(error); }
  },

  // GET /api/staff/dashboard — Tổng quan cho nhân viên
  getDashboard: async (req, res, next) => {
    try {
      if (!req.user.employee_id) {
        return res.json({ pending_leaves: 0, approved_leaves: 0, current_salary: null });
      }
      const empId = req.user.employee_id;

      // Đếm đơn nghỉ phép
      const [pendingResult] = await pool.query(
        'SELECT COUNT(*) as count FROM leave_requests WHERE employee_id = ? AND status = "pending"', [empId]
      );
      const [approvedResult] = await pool.query(
        'SELECT COUNT(*) as count FROM leave_requests WHERE employee_id = ? AND status = "approved"', [empId]
      );

      // Lương tháng gần nhất
      const [salaryResult] = await pool.query(
        'SELECT * FROM salaries WHERE employee_id = ? ORDER BY year DESC, month DESC LIMIT 1', [empId]
      );

      // Thông tin nhân viên
      const employee = await Employee.findById(empId);

      res.json({
        employee,
        pending_leaves: pendingResult[0].count,
        approved_leaves: approvedResult[0].count,
        latest_salary: salaryResult[0] || null
      });
    } catch (error) { next(error); }
  }
};

module.exports = staffController;
