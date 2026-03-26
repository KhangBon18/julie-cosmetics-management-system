/**
 * Validate email
 */
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate phone (Việt Nam)
 */
export const isValidPhone = (phone) => {
  const re = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return re.test(phone);
};

/**
 * Validate password (tối thiểu 6 ký tự)
 */
export const isValidPassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Validate form fields
 */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} không được để trống`;
  }
  return null;
};

/**
 * Validate register form
 */
export const validateRegisterForm = ({ full_name, email, password, confirmPassword }) => {
  const errors = {};

  if (!full_name || full_name.trim() === '') errors.full_name = 'Vui lòng nhập họ tên';
  if (!email) errors.email = 'Vui lòng nhập email';
  else if (!isValidEmail(email)) errors.email = 'Email không hợp lệ';
  if (!password) errors.password = 'Vui lòng nhập mật khẩu';
  else if (!isValidPassword(password)) errors.password = 'Mật khẩu tối thiểu 6 ký tự';
  if (password !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';

  return errors;
};
