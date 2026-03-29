const { pool } = require('../config/db');

const Notification = {
  // Get notifications for a user (with unread count)
  findByUser: async ({ userId, userType = 'staff', page = 1, limit = 20, unreadOnly = false }) => {
    let query = `SELECT * FROM notifications
                 WHERE user_id = ? AND user_type = ?`;
    let countQuery = `SELECT COUNT(*) as total FROM notifications
                      WHERE user_id = ? AND user_type = ?`;
    const params = [userId, userType];
    const countParams = [userId, userType];

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
      countQuery += ' AND is_read = FALSE';
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    // Get unread count
    const [unreadResult] = await pool.query(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND user_type = ? AND is_read = FALSE',
      [userId, userType]
    );

    return {
      notifications: rows,
      total: countResult[0].total,
      unread: unreadResult[0].unread
    };
  },

  // Create notification
  create: async ({ userId, userType = 'staff', title, message, type = 'info', link }) => {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, user_type, title, message, type, link)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId || null, userType, title, message, type, link || null]
    );
    return result.insertId;
  },

  // Mark single notification as read
  markRead: async (notificationId, userId) => {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows;
  },

  // Mark all notifications as read for a user
  markAllRead: async (userId, userType = 'staff') => {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND user_type = ? AND is_read = FALSE',
      [userId, userType]
    );
    return result.affectedRows;
  },

  // Delete old notifications (cleanup job)
  deleteOld: async (daysOld = 90) => {
    const [result] = await pool.query(
      'DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [daysOld]
    );
    return result.affectedRows;
  }
};

module.exports = Notification;
