const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const { pool } = require('../config/db');

const LEGACY_ROLES = new Set(['admin', 'manager', 'staff', 'warehouse']);

async function resolveRoleAssignment(input = {}) {
  const parsedRoleId = input.role_id ? parseInt(input.role_id, 10) : null;
  const requestedRole = typeof input.role === 'string' ? input.role.trim() : '';

  let selectedRole = null;
  if (parsedRoleId) {
    selectedRole = await Role.findById(parsedRoleId);
  } else if (requestedRole) {
    selectedRole = await Role.findByName(requestedRole);
  }

  if ((parsedRoleId || requestedRole) && !selectedRole) {
    const error = new Error('Nhóm quyền không tồn tại');
    error.status = 400;
    throw error;
  }

  const resolvedRoleName = selectedRole?.role_name || requestedRole || 'staff';
  const legacyRole = LEGACY_ROLES.has(resolvedRoleName)
    ? resolvedRoleName
    : (LEGACY_ROLES.has(requestedRole) ? requestedRole : 'staff');

  return {
    role: legacyRole,
    role_id: selectedRole?.role_id || null
  };
}

const userController = {
  // GET /api/users
  getAll: async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await User.findAll(parseInt(page) || 1, parseInt(limit) || 10);
      res.json(result);
    } catch (error) { next(error); }
  },

  // GET /api/users/:id
  getById: async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
      res.json(user);
    } catch (error) { next(error); }
  },

  // POST /api/users (admin tạo tài khoản)
  create: async (req, res, next) => {
    try {
      const { username, password, employee_id } = req.body;

      const existing = await User.findByUsername(username);
      if (existing) return res.status(400).json({ message: 'Username đã tồn tại' });

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      const roleAssignment = await resolveRoleAssignment(req.body);

      const id = await User.create({
        username,
        password_hash,
        role: roleAssignment.role,
        role_id: roleAssignment.role_id,
        employee_id
      });
      const user = await User.findById(id);
      res.status(201).json({ message: 'Tạo tài khoản thành công', user });
    } catch (error) { next(error); }
  },

  // PUT /api/users/:id
  update: async (req, res, next) => {
    try {
      const currentUser = await User.findById(req.params.id);
      if (!currentUser) {
        return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
      }

      const hasRoleChange = req.body.role || req.body.role_id;
      const roleAssignment = hasRoleChange
        ? await resolveRoleAssignment(req.body)
        : { role: currentUser.role, role_id: currentUser.role_id };

      await User.update(req.params.id, {
        ...req.body,
        role: roleAssignment.role,
        role_id: roleAssignment.role_id
      });
      const user = await User.findById(req.params.id);
      res.json({ message: 'Cập nhật tài khoản thành công', user });
    } catch (error) { next(error); }
  },

  // PUT /api/users/:id/reset-password
  resetPassword: async (req, res, next) => {
    try {
      const { new_password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      await User.updatePassword(req.params.id, hashedPassword);
      res.json({ message: 'Reset mật khẩu thành công' });
    } catch (error) { next(error); }
  },

  // PUT /api/users/:id/toggle-active
  toggleActive: async (req, res, next) => {
    try {
      const { is_active } = req.body;
      const targetId = parseInt(req.params.id);

      // Prevent admin from deactivating themselves
      if (!is_active && targetId === req.user.user_id) {
        return res.status(400).json({ message: 'Không thể khóa tài khoản của chính bạn' });
      }

      // Prevent deactivating the last active admin
      if (!is_active) {
        const target = await User.findById(targetId);
        if (target && target.role === 'admin') {
          const [rows] = await pool.query(
            'SELECT COUNT(*) as cnt FROM users WHERE role = "admin" AND is_active = 1 AND user_id != ?', [targetId]
          );
          if (rows[0].cnt === 0) {
            return res.status(400).json({ message: 'Không thể khóa admin cuối cùng. Hệ thống cần ít nhất 1 admin hoạt động.' });
          }
        }
      }

      await User.toggleActive(targetId, is_active);
      res.json({ message: is_active ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản' });
    } catch (error) { next(error); }
  },

  // DELETE /api/users/:id
  delete: async (req, res, next) => {
    try {
      const targetId = parseInt(req.params.id);

      // Prevent admin from deleting themselves
      if (targetId === req.user.user_id) {
        return res.status(400).json({ message: 'Không thể xóa tài khoản của chính bạn' });
      }

      await User.delete(targetId);
      res.json({ message: 'Xóa tài khoản thành công' });
    } catch (error) { next(error); }
  }
};

module.exports = userController;
