const { pool } = require('../config/db');

const Customer = {
  findAll: async ({ page = 1, limit = 10, search, membership_tier }) => {
    let query = 'SELECT * FROM customers WHERE deleted_at IS NULL';
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE deleted_at IS NULL';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      countQuery += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (membership_tier) {
      query += ' AND membership_tier = ?';
      countQuery += ' AND membership_tier = ?';
      params.push(membership_tier);
      countParams.push(membership_tier);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { customers: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM customers WHERE customer_id = ? AND deleted_at IS NULL', [id]);
    return rows[0];
  },

  findByPhone: async (phone) => {
    const [rows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [phone]);
    return rows[0];
  },

  create: async (data) => {
    const { full_name, phone, email, address, gender, date_of_birth } = data;
    const [result] = await pool.query(
      'INSERT INTO customers (full_name, phone, email, address, gender, date_of_birth) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, phone, email || null, address || null, gender || null, date_of_birth || null]
    );
    return result.insertId;
  },

  update: async (id, data) => {
    const { full_name, phone, email, address, gender, date_of_birth } = data;
    const [result] = await pool.query(
      'UPDATE customers SET full_name = ?, phone = ?, email = ?, address = ?, gender = ?, date_of_birth = ? WHERE customer_id = ?',
      [full_name, phone, email, address, gender, date_of_birth, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      'UPDATE customers SET deleted_at = NOW() WHERE customer_id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Customer;
