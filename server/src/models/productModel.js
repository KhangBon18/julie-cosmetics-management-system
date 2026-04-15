const { pool } = require('../config/db');
const { normalizePriceRange } = require('../utils/priceRange');

const Product = {
  findAll: async ({
    page = 1,
    limit = 12,
    category_id,
    brand_id,
    search,
    sort,
    min_price,
    max_price,
    is_active,
    stock_status,
    is_public = false
  }) => {
    const normalizedPriceRange = normalizePriceRange(min_price, max_price);

    let query = `SELECT p.*, c.category_name, b.brand_name,
                        pc.category_name as parent_category_name, pc.category_id as parent_category_id
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.category_id
                 LEFT JOIN categories pc ON c.parent_id = pc.category_id
                 LEFT JOIN brands b ON p.brand_id = b.brand_id
                 WHERE p.deleted_at IS NULL`;
    let countQuery = `SELECT COUNT(*) as total FROM products p
                      LEFT JOIN categories c ON p.category_id = c.category_id
                      WHERE p.deleted_at IS NULL`;
    const params = [];
    const countParams = [];

    // Public queries only show active products
    if (is_public) {
      query += ' AND p.is_active = 1';
      countQuery += ' AND p.is_active = 1';
    } else if (is_active !== undefined && is_active !== null && is_active !== '') {
      query += ' AND p.is_active = ?';
      countQuery += ' AND p.is_active = ?';
      params.push(Number(is_active));
      countParams.push(Number(is_active));
    }

    // Category filter: if parent category, include all children
    if (category_id) {
      query += ' AND (p.category_id = ? OR c.parent_id = ?)';
      countQuery += ' AND (p.category_id = ? OR c.parent_id = ?)';
      params.push(category_id, category_id);
      countParams.push(category_id, category_id);
    }

    if (brand_id) {
      query += ' AND p.brand_id = ?';
      countQuery += ' AND p.brand_id = ?';
      params.push(brand_id);
      countParams.push(brand_id);
    }

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      // Chuyển đổi chuỗi thành các token bắt buộc cho BOOLEAN MODE: "+word1* +word2*"
      const searchTerms = cleanSearch.split(/\s+/).map(term => `+${term}*`).join(' ');

      query += ' AND (MATCH(p.product_name, p.description) AGAINST(? IN BOOLEAN MODE) OR b.brand_name LIKE ?)';
      countQuery += ' AND (MATCH(p.product_name, p.description) AGAINST(? IN BOOLEAN MODE))';
      params.push(searchTerms, `%${cleanSearch}%`);
      countParams.push(searchTerms);
    }

    if (normalizedPriceRange.min !== undefined) {
      query += ' AND p.sell_price >= ?';
      countQuery += ' AND p.sell_price >= ?';
      params.push(normalizedPriceRange.min);
      countParams.push(normalizedPriceRange.min);
    }

    if (normalizedPriceRange.max !== undefined) {
      query += ' AND p.sell_price <= ?';
      countQuery += ' AND p.sell_price <= ?';
      params.push(normalizedPriceRange.max);
      countParams.push(normalizedPriceRange.max);
    }

    if (stock_status === 'out') {
      query += ' AND p.stock_quantity = 0';
      countQuery += ' AND p.stock_quantity = 0';
    } else if (stock_status === 'low') {
      query += ' AND p.stock_quantity BETWEEN 1 AND 10';
      countQuery += ' AND p.stock_quantity BETWEEN 1 AND 10';
    } else if (stock_status === 'in_stock') {
      query += ' AND p.stock_quantity > 0';
      countQuery += ' AND p.stock_quantity > 0';
    }

    switch (sort) {
      case 'price_asc': query += ' ORDER BY p.sell_price ASC'; break;
      case 'price_desc': query += ' ORDER BY p.sell_price DESC'; break;
      case 'name': query += ' ORDER BY p.product_name ASC'; break;
      case 'name_desc': query += ' ORDER BY p.product_name DESC'; break;
      case 'stock_asc': query += ' ORDER BY p.stock_quantity ASC'; break;
      case 'stock_desc': query += ' ORDER BY p.stock_quantity DESC'; break;
      case 'oldest': query += ' ORDER BY p.created_at ASC'; break;
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
      `SELECT p.*, c.category_name, b.brand_name,
              pc.category_name as parent_category_name, pc.category_id as parent_category_id
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN categories pc ON c.parent_id = pc.category_id
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       WHERE p.product_id = ?`,
      [id]
    );
    return rows[0];
  },

  findByIds: async (ids = []) => {
    const normalizedIds = [...new Set(ids.map(Number).filter(Boolean))];
    if (!normalizedIds.length) return [];

    const placeholders = normalizedIds.map(() => '?').join(', ');
    const [rows] = await pool.query(
      `SELECT p.*, c.category_name, b.brand_name,
              pc.category_name as parent_category_name, pc.category_id as parent_category_id
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.category_id
       LEFT JOIN categories pc ON c.parent_id = pc.category_id
       LEFT JOIN brands b ON p.brand_id = b.brand_id
       WHERE p.product_id IN (${placeholders})`,
      normalizedIds
    );
    return rows;
  },

  create: async (data) => {
    const { product_name, brand_id, category_id, description, skin_type, volume, sell_price, image_url } = data;
    const [result] = await pool.query(
      `INSERT INTO products (product_name, brand_id, category_id, description, skin_type, volume, import_price, sell_price, stock_quantity, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product_name, brand_id, category_id, description || null, skin_type || null, volume || null, 0, sell_price || 0, 0, image_url || null]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const { product_name, brand_id, category_id, description, skin_type, volume, sell_price, image_url, is_active } = data;
    const [result] = await pool.query(
      `UPDATE products SET product_name = ?, brand_id = ?, category_id = ?, description = ?, skin_type = ?, volume = ?, sell_price = ?, image_url = ?, is_active = ?
       WHERE product_id = ?`,
      [product_name, brand_id, category_id, description, skin_type, volume, sell_price, image_url, is_active, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      'UPDATE products SET deleted_at = NOW(), is_active = 0 WHERE product_id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows;
  },

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
