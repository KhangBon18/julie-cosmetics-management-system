const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Role = require('../models/roleModel');
const { syncApprovedResignations } = require('../utils/employeeLifecycle');

// ─── Cache permissions per user (in-memory, cleared on role change) ───
const _permCache = new Map();
const PERM_CACHE_TTL = 5 * 60 * 1000; // 5 phút

const clearPermissionCache = (userId) => {
  if (userId) _permCache.delete(userId);
  else _permCache.clear();
};

/**
 * Load permissions cho user từ DB (có cache).
 * Trả về Set<string> các permission_name.
 */
const loadPermissions = async (userId) => {
  const cached = _permCache.get(userId);
  if (cached && Date.now() - cached.ts < PERM_CACHE_TTL) {
    return cached.perms;
  }
  const rows = await Role.getUserPermissions(userId);
  const perms = new Set(rows.map(r => r.permission_name));
  _permCache.set(userId, { perms, ts: Date.now() });
  return perms;
};

// ─── Xác thực JWT token ───
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
    let user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    if (user.employee_id) {
      await syncApprovedResignations(undefined, user.employee_id);
      user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Token không hợp lệ' });
      }
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    // Gắn permissions vào req.user
    user.permissions = await loadPermissions(user.user_id);
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

// ─── Kiểm tra quyền theo role ENUM (backward compat) ───
const roleCheck = (...roles) => {
  return (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }
  };
};

// ─── Shortcut: chỉ admin ───
const adminOnly = roleCheck('admin');

// ─── Shortcut: admin hoặc manager ───
const managerUp = roleCheck('admin', 'manager');

/**
 * requirePermission — Middleware kiểm tra permission cụ thể.
 * Dùng cho fine-grained access control thay vì role-based.
 *
 * Cách dùng:
 *   router.get('/', protect, requirePermission('invoices.read'), controller.getAll);
 *   router.post('/', protect, requirePermission('invoices.create'), controller.create);
 *
 * Admin (role ENUM = 'admin') luôn bypass permission check.
 */
const requirePermission = (...permissionNames) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập' });
    }

    // Admin ENUM role luôn bypass (safety net)
    if (req.user.role === 'admin') {
      return next();
    }

    // Check from loaded permissions
    const userPerms = req.user.permissions;
    if (!userPerms || userPerms.size === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập chức năng này' });
    }

    const hasPermission = permissionNames.some(perm => userPerms.has(perm));
    if (!hasPermission) {
      return res.status(403).json({
        message: 'Bạn không có quyền truy cập chức năng này',
        required: permissionNames,
      });
    }

    next();
  };
};

/**
 * Helper function — check permission in controller/service code.
 * Returns boolean.
 */
const can = (user, permissionName) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!user.permissions) return false;
  return user.permissions.has(permissionName);
};

module.exports = {
  protect,
  roleCheck,
  adminOnly,
  managerUp,
  requirePermission,
  can,
  clearPermissionCache,
  loadPermissions,
};
