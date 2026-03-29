const { pool } = require('../config/db');
const { logInventoryMovement } = require('../utils/inventoryLogger');

const Return = {
  findAll: async ({ page = 1, limit = 10, status }) => {
    let query = `SELECT r.*, c.full_name as customer_name, i.final_total as invoice_total,
                        u.username as approved_by_name
                 FROM returns r
                 LEFT JOIN customers c ON r.customer_id = c.customer_id
                 LEFT JOIN invoices i ON r.invoice_id = i.invoice_id
                 LEFT JOIN users u ON r.approved_by = u.user_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM returns WHERE 1=1';
    const params = [];
    const countParams = [];

    if (status) {
      query += ' AND r.status = ?'; countQuery += ' AND status = ?';
      params.push(status); countParams.push(status);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);
    return { returns: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [returns] = await pool.query(
      `SELECT r.*, c.full_name as customer_name, u.username as approved_by_name
       FROM returns r
       LEFT JOIN customers c ON r.customer_id = c.customer_id
       LEFT JOIN users u ON r.approved_by = u.user_id
       WHERE r.return_id = ?`, [id]
    );
    if (!returns[0]) return null;

    const [items] = await pool.query(
      `SELECT ri.*, p.product_name FROM return_items ri
       JOIN products p ON ri.product_id = p.product_id
       WHERE ri.return_id = ?`, [id]
    );

    return { ...returns[0], items };
  },

  create: async ({ invoice_id, customer_id, return_type, reason, items }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      let totalRefund = 0;
      for (const item of items) {
        totalRefund += item.quantity * item.unit_price;
      }

      const [result] = await connection.query(
        `INSERT INTO returns (invoice_id, customer_id, return_type, reason, total_refund)
         VALUES (?, ?, ?, ?, ?)`,
        [invoice_id, customer_id || null, return_type || 'refund', reason, totalRefund]
      );
      const returnId = result.insertId;

      for (const item of items) {
        await connection.query(
          'INSERT INTO return_items (return_id, product_id, quantity, unit_price, reason) VALUES (?, ?, ?, ?, ?)',
          [returnId, item.product_id, item.quantity, item.unit_price, item.reason || null]
        );
      }

      await connection.commit();
      return returnId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  approve: async (id, approvedBy) => {
    const [result] = await pool.query(
      `UPDATE returns SET status = 'approved', approved_by = ?, approved_at = NOW()
       WHERE return_id = ? AND status = 'requested'`,
      [approvedBy, id]
    );
    return result.affectedRows;
  },

  complete: async (id, userId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Get return details
      const [returns] = await connection.query('SELECT * FROM returns WHERE return_id = ? AND status = ?', [id, 'approved']);
      if (!returns[0]) throw Object.assign(new Error('Return not found or not approved'), { status: 400 });

      const [items] = await connection.query('SELECT * FROM return_items WHERE return_id = ?', [id]);

      // Restore stock for returned items
      for (const item of items) {
        await logInventoryMovement(connection, {
          productId: item.product_id,
          movementType: 'return',
          quantity: item.quantity,  // positive = stock in
          referenceType: 'return',
          referenceId: id,
          unitCost: item.unit_price,
          createdBy: userId
        });

        await connection.query(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE product_id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Mark return as completed
      await connection.query(
        `UPDATE returns SET status = 'completed', completed_at = NOW() WHERE return_id = ?`, [id]
      );

      // Update invoice status
      await connection.query(
        `UPDATE invoices SET status = 'refunded' WHERE invoice_id = ?`, [returns[0].invoice_id]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  reject: async (id, approvedBy, note) => {
    const [result] = await pool.query(
      `UPDATE returns SET status = 'rejected', approved_by = ?, approved_at = NOW(), note = ?
       WHERE return_id = ? AND status = 'requested'`,
      [approvedBy, note || null, id]
    );
    return result.affectedRows;
  }
};

module.exports = Return;
