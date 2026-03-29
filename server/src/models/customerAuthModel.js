const { pool } = require('../config/db');

const CustomerAuth = {
  // Find customer by phone (used for login)
  findByPhone: async (phone) => {
    const [rows] = await pool.query('SELECT * FROM customers WHERE phone = ?', [phone]);
    return rows[0];
  },

  // Find customer by email
  findByEmail: async (email) => {
    const [rows] = await pool.query('SELECT * FROM customers WHERE email = ?', [email]);
    return rows[0];
  },

  // Find customer by ID (for profile/token validation)
  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT customer_id, full_name, phone, email, address, gender, date_of_birth,
              membership_tier, total_points, total_spent, created_at
       FROM customers WHERE customer_id = ?`,
      [id]
    );
    return rows[0];
  },

  // Register new customer
  register: async (data) => {
    const { full_name, phone, email, password_hash, address, gender } = data;
    const [result] = await pool.query(
      `INSERT INTO customers (full_name, phone, email, password_hash, address, gender)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, phone, email || null, password_hash, address || null, gender || null]
    );
    return result.insertId;
  },

  // Update password
  updatePassword: async (id, hashedPassword) => {
    await pool.query('UPDATE customers SET password_hash = ? WHERE customer_id = ?', [hashedPassword, id]);
  }
};

module.exports = CustomerAuth;
