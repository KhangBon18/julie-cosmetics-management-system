const { pool } = require('../config/db');

const Brand = {
  findAll: async () => {
    const [rows] = await pool.query(
      `SELECT b.*, COUNT(p.product_id) as product_count
       FROM brands b
       LEFT JOIN products p ON b.brand_id = p.brand_id
       GROUP BY b.brand_id
       ORDER BY b.brand_name ASC`
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM brands WHERE brand_id = ?', [id]);
    return rows[0];
  },

  create: async ({ brand_name, origin_country, description }) => {
    const [result] = await pool.query(
      'INSERT INTO brands (brand_name, origin_country, description) VALUES (?, ?, ?)',
      [brand_name, origin_country || null, description || null]
    );
    return result.insertId;
  },

  update: async (id, { brand_name, origin_country, description }) => {
    const [result] = await pool.query(
      'UPDATE brands SET brand_name = ?, origin_country = ?, description = ? WHERE brand_id = ?',
      [brand_name, origin_country, description, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM brands WHERE brand_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Brand;
