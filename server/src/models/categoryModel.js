const { pool } = require('../config/db');

const Category = {
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(p.product_id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
       GROUP BY c.category_id
       ORDER BY c.category_name ASC`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [id]);
    return rows[0];
  },

  create: async ({ category_name, description }) => {
    const [result] = await pool.query(
      'INSERT INTO categories (category_name, description) VALUES (?, ?)',
      [category_name, description || null]
    );
    return result.insertId;
  },

  update: async (id, { category_name, description }) => {
    const [result] = await pool.query(
      'UPDATE categories SET category_name = ?, description = ? WHERE category_id = ?',
      [category_name, description, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Category;
