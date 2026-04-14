const { pool } = require('../config/db');
const SettingsCache = require('../utils/settingsCache');
const { determineMembershipTier } = require('../utils/crmRules');

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
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [txRows] = await connection.query(
        `SELECT pt.transaction_id, pt.invoice_id, pt.status,
                i.customer_id, i.final_total, i.points_earned
         FROM payment_transactions pt
         JOIN invoices i ON i.invoice_id = pt.invoice_id
         WHERE pt.transaction_id = ?
         FOR UPDATE`,
        [transactionId]
      );

      const tx = txRows[0];
      if (!tx || tx.status !== 'pending') {
        await connection.rollback();
        return 0;
      }

      const [result] = await connection.query(
        `UPDATE payment_transactions
         SET status = 'confirmed', confirmed_by = ?, confirmed_at = NOW()
         WHERE transaction_id = ? AND status = 'pending'`,
        [confirmedBy, transactionId]
      );

      await connection.query(
        `UPDATE invoices
         SET status = 'paid'
         WHERE invoice_id = ?
           AND status = 'confirmed'`,
        [tx.invoice_id]
      );

      if (tx.customer_id) {
        const settings = await SettingsCache.getAll();
        const [customerRows] = await connection.query(
          'SELECT total_points, total_spent FROM customers WHERE customer_id = ? FOR UPDATE',
          [tx.customer_id]
        );

        if (customerRows.length) {
          const currentPoints = Number(customerRows[0].total_points || 0);
          const currentSpent = Number(customerRows[0].total_spent || 0);
          const nextPoints = currentPoints + Number(tx.points_earned || 0);
          const nextSpent = currentSpent + Number(tx.final_total || 0);

          await connection.query(
            `UPDATE customers
             SET total_points = ?, total_spent = ?, membership_tier = ?
             WHERE customer_id = ?`,
            [nextPoints, nextSpent, determineMembershipTier(nextPoints, settings), tx.customer_id]
          );
        }
      }

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  markFailed: async (transactionId, note) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [txRows] = await connection.query(
        `SELECT transaction_id, invoice_id, status
         FROM payment_transactions
         WHERE transaction_id = ?
         FOR UPDATE`,
        [transactionId]
      );

      const tx = txRows[0];
      if (!tx || tx.status !== 'pending') {
        await connection.rollback();
        return 0;
      }

      const [result] = await connection.query(
        `UPDATE payment_transactions
         SET status = 'failed', note = CONCAT(COALESCE(note, ''), CASE WHEN COALESCE(note, '') = '' THEN '' ELSE '\n' END, ?)
         WHERE transaction_id = ? AND status = 'pending'`,
        [note || 'Payment failed', transactionId]
      );

      await connection.query(
        `UPDATE invoices
         SET status = 'cancelled'
         WHERE invoice_id = ?
           AND status = 'confirmed'`,
        [tx.invoice_id]
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  refund: async (transactionId, confirmedBy) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [txRows] = await connection.query(
        `SELECT pt.transaction_id, pt.invoice_id, pt.status, i.status as invoice_status
         FROM payment_transactions pt
         JOIN invoices i ON i.invoice_id = pt.invoice_id
         WHERE pt.transaction_id = ?
         FOR UPDATE`,
        [transactionId]
      );

      const tx = txRows[0];
      if (!tx || tx.status !== 'confirmed' || tx.invoice_status !== 'refunded') {
        await connection.rollback();
        return 0;
      }

      const [result] = await connection.query(
        `UPDATE payment_transactions
         SET status = 'refunded', confirmed_by = ?, confirmed_at = NOW()
         WHERE transaction_id = ? AND status = 'confirmed'`,
        [confirmedBy, transactionId]
      );

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = Payment;
