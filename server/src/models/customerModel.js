const { pool } = require('../config/db');

const CUSTOMER_SAFE_FIELDS = `
  c.customer_id,
  c.full_name,
  c.phone,
  c.email,
  c.address,
  c.gender,
  c.date_of_birth,
  c.membership_tier,
  c.total_points,
  c.total_spent,
  c.created_at,
  c.updated_at,
  c.deleted_at
`;

const Customer = {
  findAll: async ({ page = 1, limit = 10, search, membership_tier }) => {
    let query = `SELECT ${CUSTOMER_SAFE_FIELDS},
                   (c.password_hash IS NOT NULL) as has_account,
                   COALESCE(oc.order_count, 0) as order_count
                 FROM customers c
                 LEFT JOIN (
                   SELECT customer_id, COUNT(*) as order_count
                   FROM invoices WHERE status NOT IN ('cancelled')
                   GROUP BY customer_id
                 ) oc ON oc.customer_id = c.customer_id
                 WHERE c.deleted_at IS NULL`;
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE deleted_at IS NULL';
    const params = [];
    const countParams = [];

    if (search) {
      query += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      countQuery += ' AND (full_name LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (membership_tier) {
      query += ' AND c.membership_tier = ?';
      countQuery += ' AND membership_tier = ?';
      params.push(membership_tier);
      countParams.push(membership_tier);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { customers: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query(
      `SELECT ${CUSTOMER_SAFE_FIELDS}, (c.password_hash IS NOT NULL) as has_account
       FROM customers c WHERE c.customer_id = ? AND c.deleted_at IS NULL`, [id]
    );
    return rows[0];
  },

  // Get full customer profile with recent orders (for admin detail view)
  findByIdWithOrders: async (id) => {
    const [custRows] = await pool.query(
      `SELECT ${CUSTOMER_SAFE_FIELDS},
              (c.password_hash IS NOT NULL) as has_account,
              COALESCE(oc.order_count, 0) as order_count
       FROM customers c
       LEFT JOIN (
         SELECT customer_id, COUNT(*) as order_count
         FROM invoices WHERE status NOT IN ('cancelled')
         GROUP BY customer_id
       ) oc ON oc.customer_id = c.customer_id
       WHERE c.customer_id = ? AND c.deleted_at IS NULL`, [id]
    );
    if (!custRows[0]) return null;

    // Get recent orders with items (last 20)
    const [orders] = await pool.query(
      `SELECT i.invoice_id, i.subtotal, i.discount_percent, i.discount_amount,
              i.final_total, i.points_earned, i.payment_method, i.status,
              i.created_at, i.note,
              (SELECT COUNT(*) FROM invoice_items ii WHERE ii.invoice_id = i.invoice_id) as item_count
       FROM invoices i
       WHERE i.customer_id = ?
       ORDER BY i.created_at DESC
       LIMIT 20`, [id]
    );

    // Fetch items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const [items] = await pool.query(
        `SELECT ii.product_id, ii.quantity, ii.unit_price, ii.subtotal,
                p.product_name, p.image_url, p.category_id,
                b.brand_name
         FROM invoice_items ii
         JOIN products p ON p.product_id = ii.product_id
         LEFT JOIN brands b ON b.brand_id = p.brand_id
         WHERE ii.invoice_id = ?`, [order.invoice_id]
      );
      return { ...order, items };
    }));

    return { ...custRows[0], orders: ordersWithItems };
  },

  findByPhone: async (phone) => {
    const [rows] = await pool.query(
      `SELECT ${CUSTOMER_SAFE_FIELDS}, (password_hash IS NOT NULL) as has_account
       FROM customers WHERE phone = ?`,
      [phone]
    );
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
  },

  // Admin: Reset customer password
  resetPassword: async (id, hashedPassword) => {
    const [result] = await pool.query(
      'UPDATE customers SET password_hash = ? WHERE customer_id = ?',
      [hashedPassword, id]
    );
    return result.affectedRows;
  },

  // Admin: Remove customer's password (effectively locking their online account)
  removePassword: async (id) => {
    const [result] = await pool.query(
      'UPDATE customers SET password_hash = NULL WHERE customer_id = ?',
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Customer;
