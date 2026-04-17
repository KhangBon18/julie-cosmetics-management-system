const Role = require('../models/roleModel');
const { logAudit } = require('../utils/auditLogger');
const { clearPermissionCache } = require('../middleware/authMiddleware');
const { MODULES, ACTION_LABELS } = require('../config/moduleRegistry');

const SYSTEM_ONLY_MODULE_KEYS = new Set(
  MODULES.filter(moduleItem => moduleItem.systemOnly).map(moduleItem => moduleItem.key)
);

const sanitizePermissionIdsForRole = async (roleName, permissionIds = []) => {
  const normalizedRoleName = String(roleName || '').trim().toLowerCase();
  if (normalizedRoleName === 'admin') return permissionIds;

  const permissions = await Role.getAllPermissions();
  const allowedIds = new Set(
    permissions
      .filter(permission => !SYSTEM_ONLY_MODULE_KEYS.has(permission.module))
      .map(permission => permission.permission_id)
  );

  return permissionIds.filter(id => allowedIds.has(id));
};

const roleController = {
  // GET /api/roles — danh sách nhóm quyền kèm user_count
  getAll: async (req, res) => {
    try {
      const roles = await Role.findAll();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách nhóm quyền', error: error.message });
    }
  },

  // GET /api/roles/modules — trả module registry cho frontend
  getModules: async (req, res) => {
    try {
      // Trả danh sách modules có actions (bỏ dashboard vì isPublic)
      const modules = MODULES
        .filter(m => m.actions.length > 0)
        .map(m => ({
          key: m.key,
          name: m.name,
          section: m.section,
          path: m.path,
          icon: m.icon,
          sortOrder: m.sortOrder,
          actions: m.actions,
        }));
      res.json({ modules, actionLabels: ACTION_LABELS });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách modules', error: error.message });
    }
  },

  // GET /api/roles/permissions/all — list all available permissions
  getAllPermissions: async (req, res) => {
    try {
      const permissions = await Role.getAllPermissions();
      // Group by module for easier UI rendering
      const grouped = {};
      for (const p of permissions) {
        if (!grouped[p.module]) grouped[p.module] = [];
        grouped[p.module].push(p);
      }
      res.json({ permissions, grouped });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách quyền', error: error.message });
    }
  },

  // GET /api/roles/:id
  getById: async (req, res) => {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) return res.status(404).json({ message: 'Không tìm thấy nhóm quyền' });
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy nhóm quyền', error: error.message });
    }
  },

  // POST /api/roles — tạo nhóm quyền mới
  create: async (req, res) => {
    try {
      const { role_name, description, permission_ids } = req.body;

      // Validation
      if (!role_name || !role_name.trim()) {
        return res.status(400).json({ message: 'Tên nhóm quyền là bắt buộc' });
      }

      if (role_name.trim().length < 2 || role_name.trim().length > 50) {
        return res.status(400).json({ message: 'Tên nhóm quyền phải từ 2-50 ký tự' });
      }

      // Validate permission_ids are valid integers
      if (permission_ids && !Array.isArray(permission_ids)) {
        return res.status(400).json({ message: 'permission_ids phải là array' });
      }

      const roleId = await Role.create({ role_name: role_name.trim(), description: description?.trim() });

      if (permission_ids && permission_ids.length > 0) {
        const validIds = permission_ids.filter(id => Number.isInteger(id) && id > 0);
        const sanitizedIds = await sanitizePermissionIdsForRole(role_name.trim(), validIds);
        await Role.setPermissions(roleId, sanitizedIds);
      }

      const role = await Role.findById(roleId);

      // Audit log
      await logAudit({
        userId: req.user.user_id,
        action: 'CREATE',
        entityType: 'role',
        entityId: roleId,
        newValues: { role_name: role_name.trim(), permission_count: permission_ids?.length || 0 },
        req,
      });

      res.status(201).json(role);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Tên nhóm quyền đã tồn tại' });
      }
      res.status(500).json({ message: 'Lỗi khi tạo nhóm quyền', error: error.message });
    }
  },

  // PUT /api/roles/:id — sửa nhóm quyền
  update: async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { role_name, description, permission_ids } = req.body;

      // Load current role
      const currentRole = await Role.findById(roleId);
      if (!currentRole) {
        return res.status(404).json({ message: 'Không tìm thấy nhóm quyền' });
      }

      // Validation
      if (role_name !== undefined) {
        if (!role_name || !role_name.trim()) {
          return res.status(400).json({ message: 'Tên nhóm quyền là bắt buộc' });
        }
        if (role_name.trim().length < 2 || role_name.trim().length > 50) {
          return res.status(400).json({ message: 'Tên nhóm quyền phải từ 2-50 ký tự' });
        }
      }

      // Không cho đổi tên nhóm system
      if (currentRole.is_system && role_name && role_name.trim() !== currentRole.role_name) {
        return res.status(400).json({ message: 'Không thể đổi tên nhóm quyền hệ thống' });
      }

      // Safety check: admin không tự khóa permissions quan trọng
      if (permission_ids && Array.isArray(permission_ids)) {
        const validIds = permission_ids.filter(id => Number.isInteger(id) && id > 0);
        const sanitizedIds = await sanitizePermissionIdsForRole(role_name?.trim() || currentRole.role_name, validIds);
        const safety = await Role.checkAdminSafety(roleId, sanitizedIds);
        if (!safety.safe) {
          return res.status(400).json({ message: safety.reason });
        }
      }

      // Update role info (cho cả system role update description)
      if (role_name || description !== undefined) {
        await Role.update(roleId, {
          role_name: role_name?.trim() || currentRole.role_name,
          description: description !== undefined ? description?.trim() : currentRole.description,
        });
      }

      // Update permissions
      if (permission_ids && Array.isArray(permission_ids)) {
        const validIds = permission_ids.filter(id => Number.isInteger(id) && id > 0);
        const sanitizedIds = await sanitizePermissionIdsForRole(role_name?.trim() || currentRole.role_name, validIds);
        await Role.setPermissions(roleId, sanitizedIds);

        // Clear permission cache cho tất cả user thuộc role này
        clearPermissionCache(); // clear all — safe & simple
      }

      const updatedRole = await Role.findById(roleId);

      // Audit log
      const oldPermIds = currentRole.permissions.map(p => p.permission_id);
      await logAudit({
        userId: req.user.user_id,
        action: 'UPDATE',
        entityType: 'role',
        entityId: roleId,
        oldValues: {
          role_name: currentRole.role_name,
          description: currentRole.description,
          permission_ids: oldPermIds,
        },
        newValues: {
          role_name: updatedRole.role_name,
          description: updatedRole.description,
          permission_ids: updatedRole.permissions.map(p => p.permission_id),
        },
        req,
      });

      res.json(updatedRole);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Tên nhóm quyền đã tồn tại' });
      }
      res.status(500).json({ message: 'Lỗi khi cập nhật nhóm quyền', error: error.message });
    }
  },

  // PUT /api/roles/:id/permissions
  setPermissions: async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);
      const { permission_ids } = req.body;

      if (!Array.isArray(permission_ids)) {
        return res.status(400).json({ message: 'permission_ids phải là array' });
      }

      const validIds = permission_ids.filter(id => Number.isInteger(id) && id > 0);
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ message: 'Không tìm thấy nhóm quyền' });
      }
      const sanitizedIds = await sanitizePermissionIdsForRole(role.role_name, validIds);

      // Safety check
      const safety = await Role.checkAdminSafety(roleId, sanitizedIds);
      if (!safety.safe) {
        return res.status(400).json({ message: safety.reason });
      }

      await Role.setPermissions(roleId, sanitizedIds);
      clearPermissionCache();

      const updatedRole = await Role.findById(roleId);
      res.json(updatedRole);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật quyền', error: error.message });
    }
  },

  // DELETE /api/roles/:id — xóa nhóm quyền
  delete: async (req, res) => {
    try {
      const roleId = parseInt(req.params.id);

      // Check role exists
      const role = await Role.findById(roleId);
      if (!role) {
        return res.status(404).json({ message: 'Không tìm thấy nhóm quyền' });
      }

      // Cannot delete system roles
      if (role.is_system) {
        return res.status(400).json({ message: 'Không thể xóa nhóm quyền hệ thống' });
      }

      // Cannot delete role with active users
      const userCount = await Role.getUserCount(roleId);
      if (userCount > 0) {
        return res.status(400).json({
          message: `Không thể xóa nhóm quyền đang có ${userCount} người dùng. Vui lòng chuyển người dùng sang nhóm khác trước.`,
          userCount,
        });
      }

      const result = await Role.delete(roleId);
      if (!result) {
        return res.status(400).json({ message: 'Không thể xóa nhóm quyền' });
      }

      // Audit log
      await logAudit({
        userId: req.user.user_id,
        action: 'DELETE',
        entityType: 'role',
        entityId: roleId,
        oldValues: { role_name: role.role_name, description: role.description },
        req,
      });

      res.json({ message: 'Xóa nhóm quyền thành công' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi xóa nhóm quyền', error: error.message });
    }
  },
};

module.exports = roleController;
