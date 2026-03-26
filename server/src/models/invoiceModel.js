const { pool } = require('../config/db');

const Invoice = {
  findAll: async ({ page = 1, limit = 10, customer_id, payment_method }) => {
    let query = `SELECT i.*, c.full_name as customer_name, c.phone as customer_phone, u.username as created_by_name
                 FROM invoices i
                 LEFT JOIN customers c ON i.customer_id = c.customer_id
                 LEFT JOIN users u ON i.created_by = u.user_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM invoices WHERE 1=1';
    const params = [];
    const countParams = [];

    if (customer_id) {
      query += ' AND i.customer_id = ?';
      countQuery += ' AND customer_id = ?';
      params.push(customer_id);
      countParams.push(customer_id);
    }

    if (payment_method) {
      query += ' AND i.payment_method = ?';
      countQuery += ' AND payment_method = ?';
      params.push(payment_method);
      countParams.push(payment_method);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { invoices: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [invoices] = await pool.query(
      `SELECT i.*, c.full_name as customer_name, c.phone as customer_phone, c.membership_tier, u.username as created_by_name
       FROM invoices i
       LEFT JOIN customers c ON i.customer_id = c.customer_id
       LEFT JOIN users u ON i.created_by = u.user_id
       WHERE i.invoice_id = ?`,
      [id]
    );
    if (!invoices[0]) return null;

    const [items] = await pool.query(
      `SELECT ii.*, p.product_name
       FROM invoice_items ii
       JOIN products p ON ii.product_id = p.product_id
       WHERE ii.invoice_id = ?`,
      [id]
    );

    return { ...invoices[0], items };
  },

  create: async (data) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { customer_id, created_by, discount_percent, payment_method, note, items } = data;

      // Tính tổng subtotal
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.unit_price;
      }

      const discountPct = discount_percent || 0;
      const discountAmount = Math.round(subtotal * discountPct / 100);
      const finalTotal = subtotal - discountAmount;
      const pointsEarned = Math.floor(finalTotal / 10000); // 1 điểm / 10,000 VND

      // Insert hóa đơn (trigger sẽ cập nhật customer points/tier)
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoices (customer_id, created_by, subtotal, discount_percent, discount_amount, final_total, points_earned, payment_method, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id || null, created_by || null, subtotal, discountPct, discountAmount, finalTotal, pointsEarned, payment_method || 'cash', note || null]
      );

      const invoiceId = invoiceResult.insertId;

      // Insert chi tiết hóa đơn (trigger sẽ trừ tồn kho)
      for (const item of items) {
        await connection.query(
          'INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [invoiceId, item.product_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
        );
      }

      await connection.commit();
      return invoiceId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Thống kê doanh thu theo thời gian
  getRevenueStats: async (startDate, endDate) => {
    const [rows] = await pool.query(
      `SELECT DATE(created_at) as date, COUNT(*) as invoice_count, SUM(final_total) as total_revenue
       FROM invoices
       WHERE created_at BETWEEN ? AND ?
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [startDate, endDate]
    );
    return rows;
  },

  delete: async (id) => {
    const [result] = await pool.query('DELETE FROM invoices WHERE invoice_id = ?', [id]);
    return result.affectedRows;
  }
};

module.exports = Invoice;
