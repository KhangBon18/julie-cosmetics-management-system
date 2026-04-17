const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const CustomerAuth = require('../models/customerAuthModel');

// Generate token with customer type
const generateCustomerToken = (customerId) => {
  return jwt.sign({ id: customerId, type: 'customer' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/customer-auth/register
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const { full_name, phone, email, password, address, gender } = req.body;

    if (!full_name || !phone || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập họ tên, số điện thoại và mật khẩu' });
    }

    if (!/^0\d{9,10}$/.test(phone)) {
      return res.status(400).json({ message: 'Số điện thoại không hợp lệ' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // Check if phone already exists
    const existing = await CustomerAuth.findByPhone(phone);
    if (existing) {
      if (existing.password_hash) {
        return res.status(400).json({ message: 'Số điện thoại đã được đăng ký. Vui lòng đăng nhập.' });
      }
      // Existing customer without password — set password for them
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      await CustomerAuth.updatePassword(existing.customer_id, password_hash);

      const token = generateCustomerToken(existing.customer_id);
      const customer = await CustomerAuth.findById(existing.customer_id);
      return res.status(200).json({
        message: 'Tài khoản đã được kích hoạt thành công',
        user: { ...customer, role: 'customer' },
        token
      });
    }

    // Check email uniqueness if provided
    if (email) {
      const emailExists = await CustomerAuth.findByEmail(email);
      if (emailExists) {
        return res.status(400).json({ message: 'Email đã được sử dụng' });
      }
    }

    // Create new customer
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const customerId = await CustomerAuth.register({ full_name, phone, email, password_hash, address, gender });

    const token = generateCustomerToken(customerId);
    const customer = await CustomerAuth.findById(customerId);

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: { ...customer, role: 'customer' },
      token
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'Số điện thoại hoặc email đã tồn tại' });
    }
    next(error);
  }
});

// POST /api/customer-auth/login
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const LoginThrottler = require('../utils/loginThrottler');

    if (!phone || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập số điện thoại và mật khẩu' });
    }

    // Check throttle
    const throttle = await LoginThrottler.check(phone);
    if (throttle.throttled) {
      await LoginThrottler.log({ identifier: phone, ipAddress: req.ip, userAgent: req.get('User-Agent'), success: false, failureReason: 'throttled' });
      return res.status(429).json({ message: `Tài khoản bị tạm khóa. Thử lại sau ${throttle.minutesLeft} phút.` });
    }

    const customer = await CustomerAuth.findByPhone(phone);
    if (!customer || !customer.password_hash) {
      await LoginThrottler.log({ identifier: phone, ipAddress: req.ip, userAgent: req.get('User-Agent'), success: false, failureReason: 'user_not_found' });
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, customer.password_hash);
    if (!isMatch) {
      await LoginThrottler.log({ identifier: phone, ipAddress: req.ip, userAgent: req.get('User-Agent'), success: false, failureReason: 'wrong_password' });
      return res.status(401).json({ message: 'Số điện thoại hoặc mật khẩu không đúng' });
    }

    // Success
    await LoginThrottler.clearFailed(phone);
    await LoginThrottler.log({ identifier: phone, ipAddress: req.ip, userAgent: req.get('User-Agent'), success: true });

    const token = generateCustomerToken(customer.customer_id);
    const profile = await CustomerAuth.findById(customer.customer_id);

    res.json({
      message: 'Đăng nhập thành công',
      user: { ...profile, role: 'customer' },
      token
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/customer-auth/profile (protected)
router.get('/profile', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    const customer = await CustomerAuth.findById(decoded.id);
    if (!customer) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    res.json({ ...customer, role: 'customer' });
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
});

// GET /api/customer-auth/orders (protected)
router.get('/orders', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Vui lòng đăng nhập' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== 'customer') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    // We can use the Customer model's findByIdWithOrders which fetches the last 20 orders
    const Customer = require('../models/customerModel');
    const customer = await Customer.findByIdWithOrders(decoded.id);
    if (!customer) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });

    res.json(customer.orders || []);
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    next(error);
  }
});

module.exports = router;
