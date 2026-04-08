const rateLimit = require('express-rate-limit');

// Rate limiting cho auth routes (chống brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Nới rộng ra 100
  message: { message: 'Quá nhiều yêu cầu đăng nhập, vui lòng thử lại sau 15 phút' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting toàn cục
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 phút
  max: 200, // 200 requests / phút
  message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' }
});

module.exports = { authLimiter, globalLimiter };
