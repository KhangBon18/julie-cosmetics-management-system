const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Xác thực JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// Kiểm tra quyền theo role (hỗ trợ nhiều role)
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }
  };
};

// Shortcut: chỉ admin
const adminOnly = roleCheck('admin');

// Shortcut: admin hoặc manager
const managerUp = roleCheck('admin', 'manager');

module.exports = { protect, roleCheck, adminOnly, managerUp };
