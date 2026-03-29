const Notification = require('../models/notificationModel');

const notificationController = {
  // GET /api/notifications
  getMyNotifications: async (req, res) => {
    try {
      const { page = 1, limit = 20, unread_only } = req.query;
      const result = await Notification.findByUser({
        userId: req.user.user_id,
        userType: 'staff',
        page: Number(page),
        limit: Number(limit),
        unreadOnly: unread_only === 'true'
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi lấy thông báo', error: error.message });
    }
  },

  // PUT /api/notifications/:id/read
  markRead: async (req, res) => {
    try {
      await Notification.markRead(req.params.id, req.user.user_id);
      res.json({ message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật thông báo', error: error.message });
    }
  },

  // PUT /api/notifications/read-all
  markAllRead: async (req, res) => {
    try {
      const count = await Notification.markAllRead(req.user.user_id, 'staff');
      res.json({ message: `Đã đánh dấu ${count} thông báo đã đọc` });
    } catch (error) {
      res.status(500).json({ message: 'Lỗi khi cập nhật thông báo', error: error.message });
    }
  }
};

module.exports = notificationController;
