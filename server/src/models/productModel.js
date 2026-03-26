const { pool } = require('../config/db');

const Product = {
  findAll: async ({ page = 1, limit = 12, category_id, brand_id, search, sort }) => {
    let query = `SELECT p.*, c.category_name, b.brand_name
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.category_id
                 LEFT JOIN brands b ON p.brand_id = b.brand_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    const params = [];
    const countParams = [];

    if (category_id) {
      query += ' AND p.category_id = ?';
      countQuery += ' AND p.category_id = ?';
      params.push(category_id);
      countParams.push(category_id);
    }

    if (brand_id) {
      query += ' AND p.brand_id = ?';
      countQuery += ' AND p.brand_id = ?';
      params.push(brand_id);
      countParams.push(brand_id);
    }

    if (search) {
      query += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
      countQuery += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`);
    }

    switch (sort) {
      case 'price_asc': query += ' ORDER BY p.sell_price ASC'; break;
      case 'price_desc': query += ' ORDER BY p.sell_price DESC'; break;
      case 'name': query += ' ORDER BY p.product_name ASC'; break;
      case 'stock_asc': query += ' ORDER BY p.stock_quantity ASC'; break;
      default: query += ' ORDER BY p.created_at DESC';
    }

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return {
      products: rows,
      total: countResult[0].total,
      page,
      totalPages: Math.ceil(countResult[0].total / limit)
    };
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT p.*, c.category_name, b.brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       WHERE p.product_id = ?`,
      [id]
    );
    return rows[0];
  },

  create: async (data) => {
    const { product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity, image_url } = data;
    const [result] = await pool.query(
      `INSERT INTO products (product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_name, brand_id, category_id, description || null, skin_type || null, volume || null, import_price || 0, sell_price || 0, stock_quantity || 0, image_url || null]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const { product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity, image_url, is_active } = data;
    const [result] = await pool.query(
      `UPDATE products SET product_name = ?, brand_id = ?, category_id = ?, description = ?, skin_type = ?, volume = ?, import_price = ?, sell_price = ?, stock_quantity = ?, image_url = ?, is_active = ?
       WHERE product_id = ?`,
      [product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity, image_url, is_active, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
    return result.affectedRows;
  },

  // Lấy sản phẩm tồn kho thấp
  getLowStock: async (threshold = 10) => {
    const [rows] = await pool.query(
      `SELECT p.*, c.category_name, b.brand_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       WHERE p.stock_quantity <= ? AND p.is_active = 1
       ORDER BY p.stock_quantity ASC`,
      [threshold]
    );
    return rows;
  }
};

module.exports = Product;
