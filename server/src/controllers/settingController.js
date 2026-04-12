const Setting = require('../models/settingModel');
const SettingsCache = require('../utils/settingsCache');
const { exec } = require('child_process');
const path = require('path');

const settingController = {
  // GET /api/settings — admin only
  getAll: async (req, res) => {
    try {
      const { category } = req.query;
      const settings = await Setting.findAll(category);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy cấu hình', error: error.message });
    }
  },

  // GET /api/settings/:key
  getByKey: async (req, res) => {
    try {
      const setting = await Setting.findByKey(req.params.key);
      if (!setting) return res.status(404).json({ message: 'Không tìm thấy cấu hình' });
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy cấu hình', error: error.message });
    }
  },

  // PUT /api/settings/:key
  update: async (req, res) => {
    try {
      const { value } = req.body;
      if (value === undefined) return res.status(400).json({ message: 'Thiếu giá trị' });
      const result = await Setting.update(req.params.key, value, req.user?.user_id);
      if (!result) return res.status(404).json({ message: 'Không tìm thấy cấu hình' });
      SettingsCache.invalidate();
      res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật cấu hình', error: error.message });
    }
  },

  // PUT /api/settings — bulk update
  bulkUpdate: async (req, res) => {
    try {
      const { settings } = req.body;
      if (!Array.isArray(settings)) return res.status(400).json({ message: 'settings phải là array' });
      const count = await Setting.bulkUpdate(settings, req.user?.user_id);
      SettingsCache.invalidate();
      res.json({ message: `Cập nhật ${count} cấu hình thành công` });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật cấu hình', error: error.message });
    }
  },

  // POST /api/settings/backup — admin only
  backup: async (req, res) => {
    try {
      const scriptPath = path.join(__dirname, '../../../database/backup.sh');
      // Chạy script backup.sh
      exec(`bash "${scriptPath}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Backup error: ${error}`);
          return res.status(500).json({ message: 'Lỗi khi thực hiện sao lưu', error: stderr || error.message });
        }
        res.json({ 
          success: true,
          message: 'Sao lưu dữ liệu thành công', 
          output: stdout.split('\n').filter(line => line.trim() !== '')
        });
      });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi hệ thống khi sao lưu', error: error.message });
    }
  }
};

module.exports = settingController;
