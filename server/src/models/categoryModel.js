const { pool } = require('../config/db');

const Category = {
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT c.*, c.parent_id, COUNT(p.product_id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
       GROUP BY c.category_id
       ORDER BY c.parent_id IS NULL DESC, c.category_name ASC`
    );
    return rows;
  },

  // Returns categories as a tree: parent categories with children array
  findTree: async () => {
    const [rows] = await pool.query(
      `SELECT c.category_id, c.parent_id, c.category_name, c.description,
              COUNT(p.product_id) as product_count
       FROM categories c
       LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = 1
       GROUP BY c.category_id
       ORDER BY c.category_name ASC`
    );

    const parents = rows.filter(c => !c.parent_id);
    const children = rows.filter(c => c.parent_id);

    return parents.map(parent => ({
      ...parent,
      // Sum product counts from all children + any direct products
      total_product_count: parent.product_count + children.filter(c => c.parent_id === parent.category_id).reduce((sum, c) => sum + c.product_count, 0),
      children: children.filter(c => c.parent_id === parent.category_id)
    }));
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM categories WHERE category_id = ?', [id]);
    return rows[0];
  },

  create: async ({ category_name, description, parent_id }) => {
    const [result] = await pool.query(
      'INSERT INTO categories (category_name, description, parent_id) VALUES (?, ?, ?)',
      [category_name, description || null, parent_id || null]
    );
    return result.insertId;
  },

  update: async (id, { category_name, description, parent_id }) => {
    const [result] = await pool.query(
      'UPDATE categories SET category_name = ?, description = ?, parent_id = ? WHERE category_id = ?',
      [category_name, description, parent_id || null, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Category;
