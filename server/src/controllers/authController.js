const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const { generateToken } = require('../utils/generateToken');

const authController = {
  // POST /api/auth/login
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập username và mật khẩu' });
      }

      // Tìm user
      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }

      // Kiểm tra active
      if (!user.is_active) {
        return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
      }

      // So sánh password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }

      // Cập nhật last_login
      await User.updateLastLogin(user.user_id);

      const token = generateToken(user.user_id);

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
        token
      });
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
      const user = await User.findByUsername(req.user.username);

      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      await User.updatePassword(req.user.user_id, hashedPassword);

      res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
