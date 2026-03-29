const { pool } = require('../config/db');
const { logInventoryMovement } = require('../utils/inventoryLogger');

const Invoice = {
  findAll: async ({ page = 1, limit = 10, customer_id, payment_method, status }) => {
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

    if (status) {
      query += ' AND i.status = ?';
      countQuery += ' AND status = ?';
      params.push(status);
      countParams.push(status);
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
    const SettingsCache = require('../utils/settingsCache');
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { customer_id, created_by, payment_method, note, items, promotion_id } = data;

      if (!items || !items.length) {
        throw Object.assign(new Error('Hóa đơn phải có ít nhất 1 sản phẩm'), { status: 400 });
      }

      // Kiểm tra tồn kho trước khi tạo (SELECT ... FOR UPDATE để lock rows)
      for (const item of items) {
        const [rows] = await connection.query(
          'SELECT product_id, product_name, stock_quantity FROM products WHERE product_id = ? FOR UPDATE',
          [item.product_id]
        );
        if (!rows.length) {
          throw Object.assign(new Error(`Sản phẩm ID ${item.product_id} không tồn tại`), { status: 400 });
        }
        if (rows[0].stock_quantity < item.quantity) {
          throw Object.assign(
            new Error(`Sản phẩm "${rows[0].product_name}" chỉ còn ${rows[0].stock_quantity} trong kho, không đủ ${item.quantity}`),
            { status: 400 }
          );
        }
      }

      // Tính tổng subtotal
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.quantity * item.unit_price;
      }

      // Load CRM settings from DB (no hardcode)
      const settings = await SettingsCache.getAll();
      const silverDiscount = settings['crm.silver_discount'] || 2;
      const goldDiscount = settings['crm.gold_discount'] || 5;
      const pointsPer = settings['crm.points_per_1000'] || 1;

      // Tính discount server-side dựa trên membership tier
      let discountPct = 0;
      if (customer_id) {
        const [custRows] = await connection.query(
          'SELECT membership_tier FROM customers WHERE customer_id = ?', [customer_id]
        );
        if (custRows.length) {
          const tier = custRows[0].membership_tier;
          if (tier === 'gold') discountPct = goldDiscount;
          else if (tier === 'silver') discountPct = silverDiscount;
        }
      }

      // Apply promotion if provided
      let promoId = null;
      if (promotion_id) {
        const [promoRows] = await connection.query(
          `SELECT * FROM promotions WHERE promotion_id = ? AND is_active = TRUE
           AND NOW() BETWEEN start_date AND end_date
           AND (usage_limit IS NULL OR usage_count < usage_limit)`,
          [promotion_id]
        );
        if (promoRows[0]) {
          const promo = promoRows[0];
          if (subtotal >= promo.min_order) {
            let promoDiscount = 0;
            if (promo.discount_type === 'percent') {
              promoDiscount = subtotal * promo.discount_value / 100;
              if (promo.max_discount && promoDiscount > promo.max_discount) {
                promoDiscount = promo.max_discount;
              }
            } else {
              promoDiscount = promo.discount_value;
            }
            // Use whichever discount is greater: tier-based or promotion
            const tierDiscount = subtotal * discountPct / 100;
            if (promoDiscount > tierDiscount) {
              discountPct = Math.round(promoDiscount / subtotal * 100 * 100) / 100;
            }
            promoId = promo.promotion_id;
            // Increment usage count atomically
            await connection.query(
              'UPDATE promotions SET usage_count = usage_count + 1 WHERE promotion_id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)',
              [promo.promotion_id]
            );
          }
        }
      }

      const discountAmount = Math.round(subtotal * discountPct / 100);
      const finalTotal = subtotal - discountAmount;
      const pointsEarned = Math.floor(finalTotal / 1000) * pointsPer;

      // Insert hóa đơn
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoices (customer_id, created_by, subtotal, discount_percent, discount_amount, final_total, points_earned, payment_method, status, promotion_id, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id || null, created_by || null, subtotal, discountPct, discountAmount, finalTotal, pointsEarned, payment_method || 'cash', 'paid', promoId, note || null]
      );

      const invoiceId = invoiceResult.insertId;

      // Create payment transaction
      const pmMethod = payment_method || 'cash';
      const paymentStatus = (pmMethod === 'cash') ? 'confirmed' : 'pending';
      await connection.query(
        `INSERT INTO payment_transactions (invoice_id, amount, payment_method, status, confirmed_at)
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceId, finalTotal, pmMethod, paymentStatus, paymentStatus === 'confirmed' ? new Date() : null]
      );

      // Insert chi tiết hóa đơn (trigger sẽ trừ tồn kho)
      for (const item of items) {
        // Log inventory movement BEFORE trigger fires
        await logInventoryMovement(connection, {
          productId: item.product_id,
          movementType: 'sale',
          quantity: -item.quantity,
          referenceType: 'invoice',
          referenceId: invoiceId,
          unitCost: item.unit_price,
          createdBy: created_by
        });

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

  // Update invoice status
  updateStatus: async (id, status) => {
    const [result] = await pool.query(
      'UPDATE invoices SET status = ? WHERE invoice_id = ?',
      [status, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query('DELETE FROM invoices WHERE invoice_id = ?', [id]);
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

module.exports = Invoice;
