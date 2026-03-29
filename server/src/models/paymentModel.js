const { pool } = require('../config/db');

const Payment = {
  findByInvoice: async (invoiceId) => {
    const [rows] = await pool.query(
      'SELECT * FROM payment_transactions WHERE invoice_id = ? ORDER BY created_at DESC',
      [invoiceId]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT pt.*, u.username as confirmed_by_name
       FROM payment_transactions pt
       LEFT JOIN users u ON pt.confirmed_by = u.user_id
       WHERE pt.transaction_id = ?`,
      [id]
    );
    return rows[0];
  },

  findAll: async ({ page = 1, limit = 10, status, payment_method }) => {
    let query = `SELECT pt.*, i.final_total as invoice_total, c.full_name as customer_name
                 FROM payment_transactions pt
                 LEFT JOIN invoices i ON pt.invoice_id = i.invoice_id
                 LEFT JOIN customers c ON i.customer_id = c.customer_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM payment_transactions WHERE 1=1';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' AND pt.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
    }
    if (payment_method) {
      query += ' AND pt.payment_method = ?';
      countQuery += ' AND payment_method = ?';
      params.push(payment_method);
      countParams.push(payment_method);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY pt.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    return { transactions: rows, total: countResult[0].total };
  },

  create: async ({ invoice_id, amount, payment_method, status, transaction_ref, note }) => {
    const [result] = await pool.query(
      `INSERT INTO payment_transactions (invoice_id, amount, payment_method, status, transaction_ref, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [invoice_id, amount, payment_method, status || 'pending', transaction_ref || null, note || null]
    );
    return result.insertId;
  },

  confirm: async (transactionId, confirmedBy) => {
    const [result] = await pool.query(
      `UPDATE payment_transactions SET status = 'confirmed', confirmed_by = ?, confirmed_at = NOW()
       WHERE transaction_id = ? AND status = 'pending'`,
      [confirmedBy, transactionId]
    );
    return result.affectedRows;
  },

  markFailed: async (transactionId, note) => {
    const [result] = await pool.query(
      `UPDATE payment_transactions SET status = 'failed', note = CONCAT(COALESCE(note,''), '\n', ?)
       WHERE transaction_id = ? AND status = 'pending'`,
      [note || 'Payment failed', transactionId]
    );
    return result.affectedRows;
  },

  refund: async (transactionId, confirmedBy) => {
    const [result] = await pool.query(
      `UPDATE payment_transactions SET status = 'refunded', confirmed_by = ?, confirmed_at = NOW()
       WHERE transaction_id = ? AND status = 'confirmed'`,
      [confirmedBy, transactionId]
    );
    return result.affectedRows;
  }
};

module.exports = Payment;
