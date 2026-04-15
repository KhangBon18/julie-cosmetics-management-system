const Salary = require('../models/salaryModel');
const { calculateSalary, calculateAllSalaries } = require('../utils/salaryCalculation');
const { pool } = require('../config/db');

const salaryController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, month, year, employee_id } = req.query;
      const normalizedLimit = limit === 'all' ? 'all' : (parseInt(limit, 10) || 10);
      const result = await Salary.findAll({
        page: parseInt(page, 10) || 1,
        limit: normalizedLimit,
        month,
        year,
        employee_id
      });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Salary.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy bảng lương' });

      // IDOR protection: Ngăn staff xem lương người khác (trừ khi là admin/manager)
      const role = req.user.role;
      if (role !== 'admin' && role !== 'manager' && item.employee_id !== req.user.employee_id) {
        return res.status(403).json({ message: 'Không có quyền xem bảng lương của người này' });
      }

      res.json(item);
    } catch (error) { next(error); }
  },
  create: async (req, res, next) => {
    try {
      const id = await Salary.create({ ...req.body, generated_by: req.user.user_id });
      res.status(201).json({ message: 'Tạo bảng lương thành công', salary: await Salary.findById(id) });
    } catch (error) { next(error); }
  },
  update: async (req, res, next) => {
    try {
      await Salary.update(req.params.id, req.body);
      res.json({ message: 'Cập nhật bảng lương thành công', salary: await Salary.findById(req.params.id) });
    } catch (error) { next(error); }
  },
  delete: async (req, res, next) => {
    try {
      await Salary.delete(req.params.id);
      res.json({ message: 'Xóa bảng lương thành công' });
    } catch (error) { next(error); }
  },

  // POST /api/salaries/calculate — Tính lương cho 1 NV
  calculate: async (req, res, next) => {
    try {
      const { employee_id, month, year } = req.body;
      if (!employee_id || !month || !year) {
        return res.status(400).json({ message: 'Vui lòng cung cấp employee_id, month, year' });
      }
      const result = await calculateSalary(employee_id, month, year);
      res.json(result);
    } catch (error) { next(error); }
  },

  // POST /api/salaries/generate — Tính lương tất cả NV và lưu vào DB
  generateAll: async (req, res, next) => {
    try {
      const { month, year, bonus_map } = req.body; // bonus_map: { employee_id: bonus_amount }
      if (!month || !year) {
        return res.status(400).json({ message: 'Vui lòng cung cấp month và year' });
      }

      const salaries = await calculateAllSalaries(month, year);
      let created = 0;
      let skipped = 0;

      for (const s of salaries) {
        try {
          // Áp dụng bonus nếu có
          const bonus = (bonus_map && bonus_map[s.employee_id]) || 0;
          s.bonus = bonus;
          s.net_salary = s.gross_salary + bonus - s.deductions;

          await Salary.create({ ...s, generated_by: req.user.user_id });
          created++;
        } catch (err) {
          // Duplicate (already exists for this month/year/employee)
          skipped++;
        }
      }

      res.json({
        message: `Đã tạo ${created} bảng lương, bỏ qua ${skipped} (đã tồn tại)`,
        created,
        skipped,
        total: salaries.length
      });
    } catch (error) { next(error); }
  },

  // GET /api/salaries/export — In bảng lương theo tháng, năm (CSV)
  exportSalaries: async (req, res, next) => {
    try {
      const { month, year } = req.query;
      let query = `SELECT s.salary_id, e.full_name as employee_name, s.month, s.year,
                          s.work_days_standard, s.work_days_actual, s.unpaid_leave_days,
                          s.base_salary, s.gross_salary, s.bonus, s.deductions, s.net_salary, s.notes
                   FROM salaries s
                   JOIN employees e ON s.employee_id = e.employee_id
                   WHERE 1=1`;
      const params = [];
      if (month) { query += ' AND s.month = ?'; params.push(month); }
      if (year) { query += ' AND s.year = ?'; params.push(year); }
      query += ' ORDER BY s.year DESC, s.month DESC, e.full_name ASC';

      const [rows] = await pool.query(query, params);

      const headers = ['Mã Lương', 'Nhân viên', 'Tháng', 'Năm', 'Ngày công chuẩn', 'Ngày công thực tế', 'Nghỉ không lương', 'Lương cơ bản', 'Lương Gross', 'Thưởng', 'Khấu trừ', 'Thực nhận', 'Ghi chú'];
      const csvRows = rows.map(r => [
        r.salary_id, r.employee_name, r.month, r.year,
        r.work_days_standard, r.work_days_actual, r.unpaid_leave_days,
        r.base_salary, r.gross_salary, r.bonus, r.deductions, r.net_salary, r.notes || ''
      ]);

      const csv = '\uFEFF' + [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=bang-luong${month ? '-T'+month : ''}${year ? '-'+year : ''}.csv`);
      res.send(csv);
    } catch (error) { next(error); }
  }
};

module.exports = salaryController;
