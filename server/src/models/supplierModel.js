const { pool } = require('../config/db');

const Supplier = {
  findAll: async ({ page = 1, limit = 10, search, is_active, sort = 'name_asc' } = {}) => {
    let query = 'SELECT * FROM suppliers WHERE deleted_at IS NULL';
    let countQuery = 'SELECT COUNT(*) as total FROM suppliers WHERE deleted_at IS NULL';
    const params = [];
    const countParams = [];

    if (search?.trim()) {
      const keyword = `%${search.trim()}%`;
      query += ' AND (supplier_name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR email LIKE ?)';
      countQuery += ' AND (supplier_name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(keyword, keyword, keyword, keyword);
      countParams.push(keyword, keyword, keyword, keyword);
    }

    if (is_active !== undefined && is_active !== null && is_active !== '') {
      query += ' AND is_active = ?';
      countQuery += ' AND is_active = ?';
      params.push(Number(is_active));
      countParams.push(Number(is_active));
    }

    switch (sort) {
      case 'name_desc':
        query += ' ORDER BY supplier_name DESC';
        break;
      case 'newest':
        query += ' ORDER BY created_at DESC';
        break;
      case 'oldest':
        query += ' ORDER BY created_at ASC';
        break;
      default:
        query += ' ORDER BY supplier_name ASC';
    }

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { suppliers: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE supplier_id = ? AND deleted_at IS NULL', [id]);
    return rows[0];
  },

  create: async ({ supplier_name, contact_person, phone, email, address }) => {
    const [result] = await pool.query(
      'INSERT INTO suppliers (supplier_name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [supplier_name, contact_person || null, phone || null, email || null, address || null]
    );
    return result.insertId;
  },

  update: async (id, { supplier_name, contact_person, phone, email, address, is_active }) => {
    const [result] = await pool.query(
      'UPDATE suppliers SET supplier_name = ?, contact_person = ?, phone = ?, email = ?, address = ?, is_active = ? WHERE supplier_id = ? AND deleted_at IS NULL',
      [supplier_name, contact_person, phone, email, address, is_active, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      'UPDATE suppliers SET deleted_at = NOW(), is_active = 0 WHERE supplier_id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Supplier;
