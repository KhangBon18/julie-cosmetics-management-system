const { pool } = require('../config/db');

const Supplier = {
  findAll: async () => {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY supplier_name ASC');
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE supplier_id = ?', [id]);
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
      'UPDATE suppliers SET supplier_name = ?, contact_person = ?, phone = ?, email = ?, address = ?, is_active = ? WHERE supplier_id = ?',
      [supplier_name, contact_person, phone, email, address, is_active, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Supplier;
