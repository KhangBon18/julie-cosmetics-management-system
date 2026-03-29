const { body, validationResult } = require('express-validator');

// Middleware chung: kiểm tra kết quả validation
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ', errors: errors.array() });
  }
  next();
};

// ── Invoice ──
const validateInvoice = [
  body('items').isArray({ min: 1 }).withMessage('Hóa đơn phải có ít nhất 1 sản phẩm'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('product_id phải là số nguyên dương'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải >= 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Đơn giá phải >= 0'),
  body('payment_method').optional().isIn(['cash', 'card', 'transfer']).withMessage('Phương thức thanh toán không hợp lệ'),
  body('customer_id').optional({ nullable: true }).isInt({ min: 1 }),
  handleValidation
];

// ── Import ──
const validateImport = [
  body('supplier_id').isInt({ min: 1 }).withMessage('supplier_id là bắt buộc'),
  body('items').isArray({ min: 1 }).withMessage('Phiếu nhập phải có ít nhất 1 sản phẩm'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('product_id phải là số nguyên dương'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải >= 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Đơn giá phải >= 0'),
  handleValidation
];

// ── Employee ──
const validateEmployee = [
  body('full_name').trim().notEmpty().withMessage('Họ tên là bắt buộc'),
  body('phone').trim().notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('gender').optional().isIn(['Nam', 'Nữ']).withMessage('Giới tính không hợp lệ'),
  body('base_salary').optional().isFloat({ min: 0 }).withMessage('Lương cơ bản phải >= 0'),
  handleValidation
];

// ── Salary ──
const validateSalaryGenerate = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Tháng phải từ 1-12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Năm không hợp lệ'),
  handleValidation
];

// ── Customer ──
const validateCustomer = [
  body('full_name').trim().notEmpty().withMessage('Họ tên là bắt buộc'),
  body('phone').trim().notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('gender').optional().isIn(['Nam', 'Nữ']).withMessage('Giới tính không hợp lệ'),
  body('email').optional({ nullable: true }).isEmail().withMessage('Email không hợp lệ'),
  handleValidation
];

// ── Product ──
const validateProduct = [
  body('product_name').trim().notEmpty().withMessage('Tên sản phẩm là bắt buộc'),
  body('brand_id').isInt({ min: 1 }).withMessage('brand_id là bắt buộc'),
  body('category_id').isInt({ min: 1 }).withMessage('category_id là bắt buộc'),
  body('sell_price').isFloat({ min: 0 }).withMessage('Giá bán phải >= 0'),
  handleValidation
];

// ── User ──
const validateUserCreate = [
  body('username').trim().notEmpty().withMessage('Username là bắt buộc').isLength({ min: 3 }),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải >= 6 ký tự'),
  body('role').isIn(['admin', 'manager', 'staff', 'warehouse']).withMessage('Role không hợp lệ'),
  handleValidation
];

// ── Leave ──
const validateLeave = [
  body('leave_type').isIn(['annual', 'sick', 'maternity', 'unpaid']).withMessage('Loại nghỉ không hợp lệ'),
  body('start_date').isDate().withMessage('Ngày bắt đầu không hợp lệ'),
  body('end_date').isDate().withMessage('Ngày kết thúc không hợp lệ'),
  body('reason').trim().notEmpty().withMessage('Lý do là bắt buộc'),
  handleValidation
];

// ── Auth ──
const validateLogin = [
  body('username').trim().notEmpty().withMessage('Username là bắt buộc'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc'),
  handleValidation
];

const validateChangePassword = [
  body('current_password').notEmpty().withMessage('Mật khẩu hiện tại là bắt buộc'),
  body('new_password').isLength({ min: 6 }).withMessage('Mật khẩu mới phải >= 6 ký tự'),
  handleValidation
];

module.exports = {
  validateInvoice,
  validateImport,
  validateEmployee,
  validateSalaryGenerate,
  validateCustomer,
  validateProduct,
  validateUserCreate,
  validateLeave,
  validateLogin,
  validateChangePassword
};
