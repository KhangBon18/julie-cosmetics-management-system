const { pool } = require('../config/db');

const Shipping = {
  findByInvoice: async (invoiceId) => {
    const [rows] = await pool.query(
      'SELECT * FROM shipping_orders WHERE invoice_id = ?',
      [invoiceId]
    );
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT so.*, i.final_total, i.status as invoice_status,
              c.full_name as customer_name
       FROM shipping_orders so
       LEFT JOIN invoices i ON so.invoice_id = i.invoice_id
       LEFT JOIN customers c ON i.customer_id = c.customer_id
       WHERE so.shipping_id = ?`,
      [id]
    );
    return rows[0];
  },

  findAll: async ({ page = 1, limit = 10, status }) => {
    let query = `SELECT so.*, i.final_total, c.full_name as customer_name
                 FROM shipping_orders so
                 LEFT JOIN invoices i ON so.invoice_id = i.invoice_id
                 LEFT JOIN customers c ON i.customer_id = c.customer_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM shipping_orders WHERE 1=1';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' AND so.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY so.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    return { orders: rows, total: countResult[0].total };
  },

  create: async ({ invoice_id, address_id, recipient_name, recipient_phone, shipping_address, shipping_fee, note }) => {
    const [result] = await pool.query(
      `INSERT INTO shipping_orders (invoice_id, address_id, recipient_name, recipient_phone, shipping_address, shipping_fee, note)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [invoice_id, address_id || null, recipient_name, recipient_phone, shipping_address, shipping_fee || 0, note || null]
    );
    return result.insertId;
  },

  updateStatus: async (id, status) => {
    const statusTimestamps = {
      shipped: 'shipped_at = NOW(),',
      delivered: 'delivered_at = NOW(),',
    };
    const extra = statusTimestamps[status] || '';

    const [result] = await pool.query(
      `UPDATE shipping_orders SET ${extra} status = ? WHERE shipping_id = ?`,
      [status, id]
    );
    return result.affectedRows;
  },

  setTrackingCode: async (id, trackingCode) => {
    const [result] = await pool.query(
      'UPDATE shipping_orders SET tracking_code = ? WHERE shipping_id = ?',
      [trackingCode, id]
    );
    return result.affectedRows;
  }
};

module.exports = Shipping;
