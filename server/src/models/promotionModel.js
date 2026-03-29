const { pool } = require('../config/db');

const Promotion = {
  findAll: async ({ page = 1, limit = 10, is_active, search }) => {
    let query = 'SELECT p.*, u.username as created_by_name FROM promotions p LEFT JOIN users u ON p.created_by = u.user_id WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM promotions WHERE 1=1';
    const params = [];
    const countParams = [];

    if (is_active !== undefined) {
      query += ' AND p.is_active = ?';
      countQuery += ' AND is_active = ?';
      params.push(is_active);
      countParams.push(is_active);
    }

    if (search) {
      query += ' AND (p.title LIKE ? OR p.code LIKE ?)';
      countQuery += ' AND (title LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    return { promotions: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      'SELECT p.*, u.username as created_by_name FROM promotions p LEFT JOIN users u ON p.created_by = u.user_id WHERE p.promotion_id = ?',
      [id]
    );
    return rows[0];
  },

  // Find valid promotion by code (for checkout)
  findByCode: async (code) => {
    const [rows] = await pool.query(
      `SELECT * FROM promotions
       WHERE code = ? AND is_active = TRUE
       AND NOW() BETWEEN start_date AND end_date
       AND (usage_limit IS NULL OR usage_count < usage_limit)`,
      [code]
    );
    return rows[0];
  },

  // Get auto-apply promotions for a given order total
  findAutoApply: async (orderTotal) => {
    const [rows] = await pool.query(
      `SELECT * FROM promotions
       WHERE code IS NULL AND is_active = TRUE
       AND NOW() BETWEEN start_date AND end_date
       AND min_order <= ?
       AND (usage_limit IS NULL OR usage_count < usage_limit)
       ORDER BY discount_value DESC`,
      [orderTotal]
    );
    return rows;
  },

  create: async (data) => {
    const { code, title, description, discount_type, discount_value, min_order, max_discount, usage_limit, start_date, end_date, created_by } = data;
    const [result] = await pool.query(
      `INSERT INTO promotions (code, title, description, discount_type, discount_value, min_order, max_discount, usage_limit, start_date, end_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code || null, title, description || null, discount_type || 'percent', discount_value, min_order || 0, max_discount || null, usage_limit || null, start_date, end_date, created_by || null]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const { code, title, description, discount_type, discount_value, min_order, max_discount, usage_limit, start_date, end_date, is_active } = data;
    const [result] = await pool.query(
      `UPDATE promotions SET code = ?, title = ?, description = ?, discount_type = ?, discount_value = ?,
       min_order = ?, max_discount = ?, usage_limit = ?, start_date = ?, end_date = ?, is_active = ?
       WHERE promotion_id = ?`,
      [code || null, title, description, discount_type, discount_value, min_order, max_discount, usage_limit, start_date, end_date, is_active, id]
    );
    return result.affectedRows;
  },

  // Increment usage count when a promotion is applied
  incrementUsage: async (id) => {
    const [result] = await pool.query(
      'UPDATE promotions SET usage_count = usage_count + 1 WHERE promotion_id = ?',
      [id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM promotions WHERE promotion_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Promotion;
