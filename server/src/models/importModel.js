const { pool } = require('../config/db');
const { logInventoryMovement } = require('../utils/inventoryLogger');

const Import = {
  findAll: async ({ page = 1, limit = 10, supplier_id }) => {
    let query = `SELECT ir.*, s.supplier_name, u.username as created_by_name
                 FROM import_receipts ir
                 LEFT JOIN suppliers s ON ir.supplier_id = s.supplier_id
                 LEFT JOIN users u ON ir.created_by = u.user_id
                 WHERE 1=1`;
    let countQuery = 'SELECT COUNT(*) as total FROM import_receipts WHERE 1=1';
    const params = [];
    const countParams = [];

    if (supplier_id) {
      query += ' AND ir.supplier_id = ?';
      countQuery += ' AND supplier_id = ?';
      params.push(supplier_id);
      countParams.push(supplier_id);
    }

    const offset = (page - 1) * limit;
    query += ' ORDER BY ir.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { imports: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [receipts] = await pool.query(
      `SELECT ir.*, s.supplier_name, u.username as created_by_name
       FROM import_receipts ir
       LEFT JOIN suppliers s ON ir.supplier_id = s.supplier_id
       LEFT JOIN users u ON ir.created_by = u.user_id
       WHERE ir.receipt_id = ?`,
      [id]
    );
    if (!receipts[0]) return null;

    const [items] = await pool.query(
      `SELECT iri.*, p.product_name
       FROM import_receipt_items iri
       JOIN products p ON iri.product_id = p.product_id
       WHERE iri.receipt_id = ?`,
      [id]
    );

    return { ...receipts[0], items };
  },

  create: async (data) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const { supplier_id, created_by, note, items } = data;
      let totalAmount = 0;

      // Tính tổng tiền
      for (const item of items) {
        totalAmount += item.quantity * item.unit_price;
      }

      // Insert phiếu nhập
      const [receiptResult] = await connection.query(
        'INSERT INTO import_receipts (supplier_id, created_by, total_amount, note) VALUES (?, ?, ?, ?)',
        [supplier_id, created_by || null, totalAmount, note || null]
      );

      const receiptId = receiptResult.insertId;

      // Validate tất cả product_id tồn tại
      for (const item of items) {
        const [pRows] = await connection.query(
          'SELECT product_id, product_name FROM products WHERE product_id = ?', [item.product_id]
        );
        if (!pRows.length) {
          throw Object.assign(new Error(`Sản phẩm ID ${item.product_id} không tồn tại`), { status: 400 });
        }
      }

      // Insert chi tiết (triggers sẽ tự cập nhật tồn kho)
      for (const item of items) {
        // Log inventory movement BEFORE trigger fires
        await logInventoryMovement(connection, {
          productId: item.product_id,
          movementType: 'import',
          quantity: item.quantity,
          referenceType: 'import_receipt',
          referenceId: receiptId,
          unitCost: item.unit_price,
          createdBy: created_by
        });

        await connection.query(
          'INSERT INTO import_receipt_items (receipt_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [receiptId, item.product_id, item.quantity, item.unit_price]
        );
      }

      await connection.commit();
      return receiptId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  delete: async (id) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.query('DELETE FROM import_receipts WHERE receipt_id = ?', [id]);
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

module.exports = Import;
