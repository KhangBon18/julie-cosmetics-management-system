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
const validateEmployeeCreate = [
  body('full_name').trim().notEmpty().withMessage('Họ tên là bắt buộc'),
  body('phone').trim().notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('hire_date').isDate().withMessage('Ngày vào làm không hợp lệ'),
  body('position_id').isInt({ min: 1 }).withMessage('Chức vụ ban đầu là bắt buộc'),
  body('gender').optional().isIn(['Nam', 'Nữ']).withMessage('Giới tính không hợp lệ'),
  body('base_salary').optional().isFloat({ min: 0 }).withMessage('Lương cơ bản phải >= 0'),
  handleValidation
];

const validateEmployeeUpdate = [
  body('full_name').trim().notEmpty().withMessage('Họ tên là bắt buộc'),
  body('phone').trim().notEmpty().withMessage('Số điện thoại là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('hire_date').isDate().withMessage('Ngày vào làm không hợp lệ'),
  body('gender').optional().isIn(['Nam', 'Nữ']).withMessage('Giới tính không hợp lệ'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Trạng thái nhân sự không hợp lệ'),
  handleValidation
];

// ── Salary ──
const validateSalaryGenerate = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Tháng phải từ 1-12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Năm không hợp lệ'),
  handleValidation
];

const validatePositionAssignment = [
  body('position_id').isInt({ min: 1 }).withMessage('position_id là bắt buộc'),
  body('effective_date').isDate().withMessage('effective_date không hợp lệ'),
  body('salary_at_time').isFloat({ min: 0 }).withMessage('salary_at_time phải >= 0'),
  body('note').optional({ nullable: true }).isString(),
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
  body('role_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('role_id không hợp lệ'),
  body('role')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2 })
    .withMessage('Role không hợp lệ'),
  body().custom((value) => {
    if (!value.role && !value.role_id) {
      throw new Error('Vui lòng chọn nhóm quyền');
    }
    return true;
  }),
  body('employee_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('employee_id không hợp lệ'),
  handleValidation
];

const validateUserUpdate = [
  body('username').optional().trim().isLength({ min: 3 }).withMessage('Username không hợp lệ'),
  body('role_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('role_id không hợp lệ'),
  body('role')
    .optional({ values: 'falsy' })
    .trim()
    .isLength({ min: 2 })
    .withMessage('Role không hợp lệ'),
  body('employee_id').optional({ values: 'falsy', nullable: true }).isInt({ min: 1 }).withMessage('employee_id không hợp lệ'),
  body('is_active').optional().isBoolean().withMessage('is_active không hợp lệ'),
  handleValidation
];

// ── Leave ──
const validateLeave = [
  body('employee_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('employee_id không hợp lệ'),
  body('leave_type').isIn(['annual', 'sick', 'maternity', 'unpaid', 'resignation']).withMessage('Loại nghỉ không hợp lệ'),
  body('start_date').isDate().withMessage('Ngày bắt đầu không hợp lệ'),
  body('end_date').isDate().withMessage('Ngày kết thúc không hợp lệ'),
  body('reason').trim().notEmpty().withMessage('Lý do là bắt buộc'),
  body('start_date').custom((startDate, { req }) => {
    if (!req.body.end_date) return true;
    if (new Date(req.body.end_date) < new Date(startDate)) {
      throw new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    }
    return true;
  }),
  handleValidation
];

const validateLeaveReject = [
  body('reject_reason').trim().notEmpty().withMessage('Lý do từ chối là bắt buộc'),
  handleValidation
];

// ── Return / Refund ──
const validateReturn = [
  body('invoice_id').isInt({ min: 1 }).withMessage('invoice_id là bắt buộc'),
  body('return_type').optional().isIn(['refund', 'exchange']).withMessage('Loại đổi trả không hợp lệ'),
  body('reason').trim().notEmpty().withMessage('Lý do là bắt buộc'),
  body('items').isArray({ min: 1 }).withMessage('Đơn đổi trả phải có ít nhất 1 sản phẩm'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('product_id không hợp lệ'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Số lượng phải >= 1'),
  body('items.*.reason').optional().isLength({ max: 255 }).withMessage('Lý do sản phẩm quá dài'),
  body('customer_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('customer_id không hợp lệ'),
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
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateSalaryGenerate,
  validatePositionAssignment,
  validateCustomer,
  validateProduct,
  validateUserCreate,
  validateUserUpdate,
  validateLeave,
  validateLeaveReject,
  validateReturn,
  validateLogin,
  validateChangePassword
};
