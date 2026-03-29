const Salary = require('../models/salaryModel');
const { calculateSalary, calculateAllSalaries } = require('../utils/salaryCalculation');

const salaryController = {
  getAll: async (req, res, next) => {
    try {
      const { page, limit, month, year, employee_id } = req.query;
      const result = await Salary.findAll({ page: parseInt(page) || 1, limit: parseInt(limit) || 10, month, year, employee_id });
      res.json(result);
    } catch (error) { next(error); }
  },
  getById: async (req, res, next) => {
    try {
      const item = await Salary.findById(req.params.id);
      if (!item) return res.status(404).json({ message: 'Không tìm thấy bảng lương' });
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
  }
};

module.exports = salaryController;

