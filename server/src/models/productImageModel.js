const { pool } = require('../config/db');

const ProductImage = {
  findByProduct: async (productId) => {
    const [rows] = await pool.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order, image_id',
      [productId]
    );
    return rows;
  },

  create: async ({ product_id, image_url, alt_text, sort_order, is_primary }) => {
    // If this is primary, unset other primaries
    if (is_primary) {
      await pool.query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [product_id]
      );
    }
    const [result] = await pool.query(
      'INSERT INTO product_images (product_id, image_url, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?)',
      [product_id, image_url, alt_text || null, sort_order || 0, is_primary || false]
    );
    return result.insertId;
  },

  setPrimary: async (imageId, productId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'UPDATE product_images SET is_primary = FALSE WHERE product_id = ?',
        [productId]
      );
      await connection.query(
        'UPDATE product_images SET is_primary = TRUE WHERE image_id = ? AND product_id = ?',
        [imageId, productId]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  updateSortOrder: async (imageId, sortOrder) => {
    const [result] = await pool.query(
      'UPDATE product_images SET sort_order = ? WHERE image_id = ?',
      [sortOrder, imageId]
    );
    return result.affectedRows;
  },

  delete: async (imageId) => {
    const [result] = await pool.query('DELETE FROM product_images WHERE image_id = ?', [imageId]);
    return result.affectedRows;
  }
};

module.exports = ProductImage;
