const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { generateToken, generateAccessToken, generateRefreshToken, verifyRefreshToken, revokeRefreshToken, revokeAllUserTokens } = require('../utils/generateToken');
const LoginThrottler = require('../utils/loginThrottler');
const { logAudit } = require('../utils/auditLogger');

const authController = {
  // POST /api/auth/login
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập username và mật khẩu' });
      }

      // Check throttle
      const throttle = await LoginThrottler.check(username);
      if (throttle.throttled) {
        await LoginThrottler.log({
          identifier: username, ipAddress: req.ip,
          userAgent: req.get('User-Agent'), success: false, failureReason: 'throttled'
        });
        return res.status(429).json({
          message: `Tài khoản bị tạm khóa do đăng nhập sai quá nhiều. Thử lại sau ${throttle.minutesLeft} phút.`
        });
      }

      // Tìm user
      const user = await User.findByUsername(username);
      if (!user) {
        await LoginThrottler.log({
          identifier: username, ipAddress: req.ip,
          userAgent: req.get('User-Agent'), success: false, failureReason: 'user_not_found'
        });
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }

      // Kiểm tra active
      if (!user.is_active) {
        await LoginThrottler.log({
          identifier: username, ipAddress: req.ip,
          userAgent: req.get('User-Agent'), success: false, failureReason: 'account_locked'
        });
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
      }

      // So sánh password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        await LoginThrottler.log({
          identifier: username, ipAddress: req.ip,
          userAgent: req.get('User-Agent'), success: false, failureReason: 'wrong_password'
        });
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }

      // Success — clear failed attempts
      await LoginThrottler.clearFailed(username);
      await LoginThrottler.log({
        identifier: username, ipAddress: req.ip,
        userAgent: req.get('User-Agent'), success: true
      });

      // Cập nhật last_login
      await User.updateLastLogin(user.user_id);

      // Generate tokens
      const accessToken = generateAccessToken(user.user_id, 'staff');
      const refreshToken = await generateRefreshToken(user.user_id, 'staff', req);

      // Audit log
      await logAudit({
        userId: user.user_id, action: 'LOGIN', entityType: 'user',
        entityId: user.user_id, req
      });

      // Lấy thông tin đầy đủ (kèm employee)
      const fullUser = await User.findById(user.user_id);

      res.json({
        message: 'Đăng nhập thành công',
        user: {
          user_id: fullUser.user_id,
          username: fullUser.username,
          role: fullUser.role,
          employee_id: fullUser.employee_id,
          full_name: fullUser.full_name || fullUser.username,
          email: fullUser.email,
          phone: fullUser.phone
        },
        token: accessToken,         // short-lived access token
        refreshToken,               // long-lived refresh token
        // backward compat: also provide 'token' key that old clients use
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/refresh — get new access token using refresh token
  refresh: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token là bắt buộc' });
      }

      const tokenData = await verifyRefreshToken(refreshToken);
      if (!tokenData) {
        return res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
      }

      // Issue new access token
      const accessToken = generateAccessToken(tokenData.user_id, tokenData.user_type);

      res.json({ token: accessToken });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/logout — revoke refresh token
  logout: async (req, res, next) => {
    try {
      const { refreshToken, logoutAll } = req.body;

      if (logoutAll && req.user) {
        await revokeAllUserTokens(req.user.user_id, 'staff');
        await logAudit({
          userId: req.user.user_id, action: 'LOGOUT', entityType: 'user',
          entityId: req.user.user_id, newValues: { logoutAll: true }, req
        });
        return res.json({ message: 'Đã đăng xuất tất cả thiết bị' });
      }

      if (refreshToken) {
        await revokeRefreshToken(refreshToken);
      }

      if (req.user) {
        await logAudit({
          userId: req.user.user_id, action: 'LOGOUT', entityType: 'user',
          entityId: req.user.user_id, req
        });
      }

      res.json({ message: 'Đăng xuất thành công' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/profile
  getProfile: async (req, res, next) => {
    try {
      const user = await User.findById(req.user.user_id);
      if (!user) {
        return res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/auth/change-password
  changePassword: async (req, res, next) => {
    try {
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
      }

      if (new_password.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
      }

      const user = await User.findByUsername(req.user.username);

      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      await User.updatePassword(req.user.user_id, hashedPassword);

      // Revoke all refresh tokens (force re-login on all devices)
      await revokeAllUserTokens(req.user.user_id, 'staff');

      await logAudit({
        userId: req.user.user_id, action: 'UPDATE', entityType: 'user',
        entityId: req.user.user_id, newValues: { password_changed: true }, req
      });

      res.json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
