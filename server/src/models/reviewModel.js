const { pool } = require('../config/db');

const Review = {
  findAll: async ({ page = 1, limit = 10, product_id }) => {
    let query = `SELECT r.*, p.product_name, c.full_name as customer_name
                 FROM reviews r
                 JOIN products p ON r.product_id = p.product_id
                 JOIN customers c ON r.customer_id = c.customer_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM reviews WHERE 1=1';
    const params = [];
    const countParams = [];

    if (product_id) {
      query += ' AND r.product_id = ?';
      countQuery += ' AND product_id = ?';
      params.push(product_id);
      countParams.push(product_id);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { reviews: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT r.*, p.product_name, c.full_name as customer_name
       FROM reviews r
       JOIN products p ON r.product_id = p.product_id
       JOIN customers c ON r.customer_id = c.customer_id
       WHERE r.review_id = ?`,
      [id]
    );
    return rows[0];
  },

  create: async ({ product_id, customer_id, rating, comment }) => {
    const [result] = await pool.query(
      'INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)',
      [product_id, customer_id, rating, comment || null]
    );
    return result.insertId;
  },

  toggleVisibility: async (id, isVisible) => {
    const [result] = await pool.query(
      'UPDATE reviews SET is_visible = ? WHERE review_id = ?',
      [isVisible, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM reviews WHERE review_id = ?', [id]);
    return result.affectedRows;
  },

  // Thống kê đánh giá theo sản phẩm
  getProductStats: async (productId) => {
    const [rows] = await pool.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE product_id = ? AND is_visible = 1`,
      [productId]
    );
    return rows[0];
  }
};

module.exports = Review;
