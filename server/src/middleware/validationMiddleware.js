const { body, param, query, validationResult } = require('express-validator');

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

const validateSalaryBonus = [
  body('employee_id').isInt({ min: 1 }).withMessage('employee_id là bắt buộc'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Tháng phải từ 1-12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Năm không hợp lệ'),
  body('amount').isFloat({ min: 0 }).withMessage('Thưởng phải là số >= 0'),
  body('reason').trim().notEmpty().withMessage('Lý do thưởng là bắt buộc').isLength({ max: 255 }).withMessage('Lý do thưởng tối đa 255 ký tự'),
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

const attendanceStatuses = ['present', 'late', 'early_leave', 'late_and_early', 'absent', 'half_day', 'leave', 'holiday', 'pending', 'incomplete'];
const adjustmentStatuses = ['pending', 'approved', 'rejected'];
const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?$/;

const isValidDateTime = (value) => {
  if (!value || typeof value !== 'string' || !dateTimeRegex.test(value.trim())) {
    return false;
  }
  const normalized = value.trim().replace(' ', 'T');
  return !Number.isNaN(new Date(normalized).getTime());
};

const ensureDateOrder = (startValue, endValue, errorMessage) => {
  if (!startValue || !endValue) return true;
  const start = new Date(String(startValue).trim().replace(' ', 'T'));
  const end = new Date(String(endValue).trim().replace(' ', 'T'));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error(errorMessage);
  }
  return true;
};

const validateAttendanceListQuery = [
  query('page').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('page phải là số nguyên dương'),
  query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 200 }).withMessage('limit phải từ 1 đến 200'),
  query('employee_id').optional({ values: 'falsy' }).isInt({ min: 1 }).withMessage('employee_id không hợp lệ'),
  query('from_date').optional({ values: 'falsy' }).isDate().withMessage('from_date không hợp lệ'),
  query('to_date').optional({ values: 'falsy' }).isDate().withMessage('to_date không hợp lệ'),
  query('status').optional({ values: 'falsy' }).isIn([...attendanceStatuses, ...adjustmentStatuses]).withMessage('status không hợp lệ'),
  query('to_date').custom((toDate, { req }) => {
    if (!req.query.from_date || !toDate) return true;
    if (new Date(toDate) < new Date(req.query.from_date)) {
      throw new Error('to_date phải sau hoặc bằng from_date');
    }
    return true;
  }),
  handleValidation
];

const validateAttendanceManual = [
  body('employee_id').isInt({ min: 1 }).withMessage('employee_id là bắt buộc'),
  body('work_date').isDate().withMessage('work_date không hợp lệ'),
  body('shift_id').optional({ values: 'falsy', nullable: true }).isInt({ min: 1 }).withMessage('shift_id không hợp lệ'),
  body('status').optional({ nullable: true }).isIn(attendanceStatuses).withMessage('Trạng thái chấm công không hợp lệ'),
  body('note').optional({ nullable: true }).isString().withMessage('Ghi chú không hợp lệ').isLength({ max: 5000 }).withMessage('Ghi chú tối đa 5000 ký tự'),
  body('check_in_at').optional({ nullable: true }).custom((value) => {
    if (!value) return true;
    if (!isValidDateTime(value)) throw new Error('check_in_at không hợp lệ');
    return true;
  }),
  body('check_out_at').optional({ nullable: true }).custom((value) => {
    if (!value) return true;
    if (!isValidDateTime(value)) throw new Error('check_out_at không hợp lệ');
    return true;
  }),
  body().custom((value) => {
    if (value.check_out_at && !value.check_in_at) {
      throw new Error('Không thể nhập giờ ra khi chưa có giờ vào');
    }
    ensureDateOrder(value.check_in_at, value.check_out_at, 'Giờ ra phải sau giờ vào');
    return true;
  }),
  handleValidation
];

const validateAttendanceCheckAction = [
  body('note').optional({ nullable: true }).isString().withMessage('Ghi chú không hợp lệ').isLength({ max: 1000 }).withMessage('Ghi chú tối đa 1000 ký tự'),
  handleValidation
];

const validateAttendanceAdjustment = [
  body('work_date').isDate().withMessage('work_date không hợp lệ'),
  body('requested_check_in_at').optional({ nullable: true }).custom((value) => {
    if (!value) return true;
    if (!isValidDateTime(value)) throw new Error('requested_check_in_at không hợp lệ');
    return true;
  }),
  body('requested_check_out_at').optional({ nullable: true }).custom((value) => {
    if (!value) return true;
    if (!isValidDateTime(value)) throw new Error('requested_check_out_at không hợp lệ');
    return true;
  }),
  body('reason').trim().notEmpty().withMessage('Lý do điều chỉnh là bắt buộc').isLength({ max: 5000 }).withMessage('Lý do tối đa 5000 ký tự'),
  body().custom((value) => {
    if (!value.requested_check_in_at && !value.requested_check_out_at) {
      throw new Error('Phải nhập ít nhất giờ vào hoặc giờ ra cần điều chỉnh');
    }
    ensureDateOrder(value.requested_check_in_at, value.requested_check_out_at, 'Giờ ra đề nghị phải sau giờ vào đề nghị');
    return true;
  }),
  handleValidation
];

const validateAttendanceAdjustmentReviewId = [
  param('id').isInt({ min: 1 }).withMessage('ID yêu cầu điều chỉnh không hợp lệ'),
  handleValidation
];

const validateAttendanceAdjustmentReject = [
  param('id').isInt({ min: 1 }).withMessage('ID yêu cầu điều chỉnh không hợp lệ'),
  body('reject_reason').trim().notEmpty().withMessage('Lý do từ chối là bắt buộc').isLength({ max: 5000 }).withMessage('Lý do từ chối tối đa 5000 ký tự'),
  handleValidation
];

module.exports = {
  validateInvoice,
  validateImport,
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateSalaryGenerate,
  validateSalaryBonus,
  validatePositionAssignment,
  validateCustomer,
  validateProduct,
  validateUserCreate,
  validateUserUpdate,
  validateLeave,
  validateLeaveReject,
  validateReturn,
  validateLogin,
  validateChangePassword,
  validateAttendanceListQuery,
  validateAttendanceManual,
  validateAttendanceCheckAction,
  validateAttendanceAdjustment,
  validateAttendanceAdjustmentReviewId,
  validateAttendanceAdjustmentReject
};
