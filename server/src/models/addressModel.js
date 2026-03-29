const { pool } = require('../config/db');

const Address = {
  findByCustomer: async (customerId) => {
    const [rows] = await pool.query(
      'SELECT * FROM customer_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC',
      [customerId]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM customer_addresses WHERE address_id = ?', [id]);
    return rows[0];
  },

  create: async (data) => {
    const { customer_id, label, recipient, phone, province, district, ward, street, is_default } = data;

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // If setting as default, unset others
      if (is_default) {
        await connection.query(
          'UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?',
          [customer_id]
        );
      }

      const [result] = await connection.query(
        `INSERT INTO customer_addresses (customer_id, label, recipient, phone, province, district, ward, street, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id, label || null, recipient, phone, province, district, ward || null, street, is_default || false]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  update: async (id, data) => {
    const { label, recipient, phone, province, district, ward, street } = data;
    const [result] = await pool.query(
      `UPDATE customer_addresses SET label = ?, recipient = ?, phone = ?, province = ?, district = ?, ward = ?, street = ?
       WHERE address_id = ?`,
      [label, recipient, phone, province, district, ward, street, id]
    );
    return result.affectedRows;
  },

  setDefault: async (addressId, customerId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query('UPDATE customer_addresses SET is_default = FALSE WHERE customer_id = ?', [customerId]);
      await connection.query('UPDATE customer_addresses SET is_default = TRUE WHERE address_id = ? AND customer_id = ?', [addressId, customerId]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM customer_addresses WHERE address_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Address;
