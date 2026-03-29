const Role = require('../models/roleModel');

const roleController = {
  // GET /api/roles
  getAll: async (req, res) => {
    try {
      const roles = await Role.findAll();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy danh sách vai trò', error: error.message });
    }
  },

  // GET /api/roles/:id
  getById: async (req, res) => {
    try {
      const role = await Role.findById(req.params.id);
      if (!role) return res.status(404).json({ message: 'Không tìm thấy vai trò' });
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy vai trò', error: error.message });
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

  // POST /api/roles
  create: async (req, res) => {
    try {
      const { role_name, description, permission_ids } = req.body;
      if (!role_name) return res.status(400).json({ message: 'Tên vai trò là bắt buộc' });

      const roleId = await Role.create({ role_name, description });
      if (permission_ids && permission_ids.length > 0) {
        await Role.setPermissions(roleId, permission_ids);
      }
      const role = await Role.findById(roleId);
      res.status(201).json(role);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ message: 'Tên vai trò đã tồn tại' });
      }
      res.status(500).json({ message: 'Lỗi khi tạo vai trò', error: error.message });
    }
  },

  // PUT /api/roles/:id
  update: async (req, res) => {
    try {
      const { role_name, description, permission_ids } = req.body;
      const result = await Role.update(req.params.id, { role_name, description });
      if (!result) return res.status(400).json({ message: 'Không thể sửa vai trò hệ thống hoặc không tồn tại' });

      if (permission_ids) {
        await Role.setPermissions(req.params.id, permission_ids);
      }
      const role = await Role.findById(req.params.id);
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật vai trò', error: error.message });
    }
  },

  // PUT /api/roles/:id/permissions
  setPermissions: async (req, res) => {
    try {
      const { permission_ids } = req.body;
      if (!Array.isArray(permission_ids)) return res.status(400).json({ message: 'permission_ids phải là array' });
      await Role.setPermissions(req.params.id, permission_ids);
      const role = await Role.findById(req.params.id);
      res.json(role);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật quyền', error: error.message });
    }
  },

  // DELETE /api/roles/:id
  delete: async (req, res) => {
    try {
      const result = await Role.delete(req.params.id);
      if (!result) return res.status(400).json({ message: 'Không thể xóa vai trò hệ thống' });
      res.json({ message: 'Xóa vai trò thành công' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi xóa vai trò', error: error.message });
    }
  }
};

module.exports = roleController;
