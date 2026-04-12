const { pool } = require('../config/db');
const { logInventoryMovement } = require('../utils/inventoryLogger');
const SettingsCache = require('../utils/settingsCache');

const moneyToCents = (value) => Math.round((Number(value) || 0) * 100);
const centsToMoney = (value) => Number((value / 100).toFixed(2));

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const calculateReversedPoints = (invoicePoints, invoiceFinalTotal, refundedAmount) => {
  const totalPoints = Number(invoicePoints) || 0;
  const finalTotal = Number(invoiceFinalTotal) || 0;
  const refund = Number(refundedAmount) || 0;
  if (totalPoints <= 0 || finalTotal <= 0 || refund <= 0) return 0;
  if (refund >= finalTotal) return totalPoints;
  return clamp(Math.floor((totalPoints * refund) / finalTotal), 0, totalPoints);
};

const determineMembershipTier = (points, settings) => {
  const silverThreshold = Number(settings['crm.silver_threshold'] || 100);
  const goldThreshold = Number(settings['crm.gold_threshold'] || 500);

  if (points >= goldThreshold) return 'gold';
  if (points >= silverThreshold) return 'silver';
  return 'standard';
};

const allocateDiscountByLine = (invoiceItems, discountAmount) => {
  const totalDiscountCents = moneyToCents(discountAmount);
  const totalSubtotalCents = invoiceItems.reduce((sum, item) => sum + moneyToCents(item.subtotal), 0);

  if (totalDiscountCents <= 0 || totalSubtotalCents <= 0) {
    return new Map(invoiceItems.map((item) => [item.product_id, 0]));
  }

  const lineAllocations = invoiceItems.map((item, index) => {
    const lineSubtotalCents = moneyToCents(item.subtotal);
    const rawDiscount = (totalDiscountCents * lineSubtotalCents) / totalSubtotalCents;
    const baseDiscount = Math.floor(rawDiscount);

    return {
      product_id: item.product_id,
      index,
      baseDiscount,
      remainder: rawDiscount - baseDiscount
    };
  });

  let allocated = lineAllocations.reduce((sum, item) => sum + item.baseDiscount, 0);
  let remaining = totalDiscountCents - allocated;

  lineAllocations.sort((a, b) => {
    if (b.remainder !== a.remainder) return b.remainder - a.remainder;
    return a.index - b.index;
  });

  for (let i = 0; i < lineAllocations.length && remaining > 0; i += 1) {
    lineAllocations[i].baseDiscount += 1;
    remaining -= 1;
  }

  return new Map(lineAllocations.map((item) => [item.product_id, item.baseDiscount]));
};

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

      const [invoiceRows] = await connection.query(
        `SELECT invoice_id, customer_id, status, subtotal, discount_amount, final_total, points_earned
         FROM invoices
         WHERE invoice_id = ?
         FOR UPDATE`,
        [invoice_id]
      );
      if (!invoiceRows.length) {
        throw Object.assign(new Error('Không tìm thấy hóa đơn'), { status: 404 });
      }

      const invoice = invoiceRows[0];
      if (!['paid', 'completed'].includes(invoice.status)) {
        throw Object.assign(new Error('Chỉ hóa đơn đã thanh toán/hoàn tất mới được tạo yêu cầu đổi trả'), { status: 400 });
      }

      if (customer_id && invoice.customer_id && Number(customer_id) !== Number(invoice.customer_id)) {
        throw Object.assign(new Error('Khách hàng không khớp với hóa đơn'), { status: 400 });
      }

      const [invoiceItems] = await connection.query(
        'SELECT product_id, quantity, unit_price, subtotal FROM invoice_items WHERE invoice_id = ? FOR UPDATE',
        [invoice_id]
      );
      if (!invoiceItems.length) {
        throw Object.assign(new Error('Hóa đơn không có sản phẩm để đổi/trả'), { status: 400 });
      }

      const invoiceItemMap = new Map();
      const discountAllocation = allocateDiscountByLine(invoiceItems, invoice.discount_amount);
      for (const row of invoiceItems) {
        const productId = Number(row.product_id);
        const lineSubtotalCents = moneyToCents(row.subtotal);
        const lineDiscountCents = discountAllocation.get(productId) || 0;
        const lineNetSubtotalCents = Math.max(0, lineSubtotalCents - lineDiscountCents);
        invoiceItemMap.set(row.product_id, {
          quantity: Number(row.quantity) || 0,
          unit_price: Number(row.unit_price) || 0,
          subtotal_cents: lineSubtotalCents,
          net_subtotal_cents: lineNetSubtotalCents
        });
      }

      const [returnedRows] = await connection.query(
        `SELECT ri.product_id,
                SUM(ri.quantity) as returned_qty,
                SUM(CASE WHEN r.return_type = 'refund' THEN ri.refund_subtotal ELSE 0 END) as refunded_amount
         FROM return_items ri
         JOIN returns r ON r.return_id = ri.return_id
         WHERE r.invoice_id = ? AND r.status != 'rejected'
         GROUP BY ri.product_id`,
        [invoice_id]
      );
      const returnedMap = new Map();
      for (const row of returnedRows) {
        returnedMap.set(row.product_id, {
          returned_qty: Number(row.returned_qty) || 0,
          refunded_amount_cents: moneyToCents(row.refunded_amount)
        });
      }

      const normalizedItemsMap = new Map();
      for (const item of items) {
        const productId = Number(item.product_id);
        const quantity = Number(item.quantity);
        const existing = normalizedItemsMap.get(productId);
        normalizedItemsMap.set(productId, {
          product_id: productId,
          quantity: (existing?.quantity || 0) + quantity,
          reason: existing?.reason || item.reason || null
        });
      }

      const resolvedItems = [];
      let totalRefundCents = 0;
      for (const item of normalizedItemsMap.values()) {
        const invoiceItem = invoiceItemMap.get(item.product_id);
        if (!invoiceItem) {
          throw Object.assign(new Error(`Sản phẩm ID ${item.product_id} không nằm trong hóa đơn`), { status: 400 });
        }
        const returnedInfo = returnedMap.get(item.product_id) || { returned_qty: 0, refunded_amount_cents: 0 };
        const returnedQty = returnedInfo.returned_qty;
        const remainingQty = invoiceItem.quantity - returnedQty;
        if (item.quantity > remainingQty) {
          throw Object.assign(
            new Error(`Sản phẩm ID ${item.product_id} chỉ còn có thể trả ${remainingQty}`),
            { status: 400 }
          );
        }

        let refundSubtotal = 0;
        if ((return_type || 'refund') === 'refund') {
          const remainingRefundableCents = Math.max(0, invoiceItem.net_subtotal_cents - returnedInfo.refunded_amount_cents);
          const proportionalRefundCents = Math.round((invoiceItem.net_subtotal_cents * item.quantity) / invoiceItem.quantity);
          const refundSubtotalCents = item.quantity === remainingQty
            ? remainingRefundableCents
            : Math.min(remainingRefundableCents, proportionalRefundCents);
          refundSubtotal = centsToMoney(refundSubtotalCents);
          totalRefundCents += refundSubtotalCents;
        }

        resolvedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: invoiceItem.unit_price,
          refund_subtotal: refundSubtotal,
          reason: item.reason
        });
      }

      const safeCustomerId = customer_id || invoice.customer_id || null;
      const [result] = await connection.query(
        `INSERT INTO returns (invoice_id, customer_id, return_type, reason, total_refund)
         VALUES (?, ?, ?, ?, ?)`,
        [invoice_id, safeCustomerId, return_type || 'refund', reason, centsToMoney(totalRefundCents)]
      );
      const returnId = result.insertId;

      for (const item of resolvedItems) {
        await connection.query(
          `INSERT INTO return_items (return_id, product_id, quantity, unit_price, refund_subtotal, reason)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [returnId, item.product_id, item.quantity, item.unit_price, item.refund_subtotal, item.reason || null]
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
      const [returns] = await connection.query(
        'SELECT * FROM returns WHERE return_id = ? AND status = ? FOR UPDATE',
        [id, 'approved']
      );
      if (!returns[0]) throw Object.assign(new Error('Return not found or not approved'), { status: 400 });
      const ret = returns[0];

      const [invoiceRows] = await connection.query(
        `SELECT invoice_id, customer_id, status, final_total, points_earned
         FROM invoices
         WHERE invoice_id = ?
         FOR UPDATE`,
        [ret.invoice_id]
      );
      if (!invoiceRows.length) {
        throw Object.assign(new Error('Không tìm thấy hóa đơn của yêu cầu đổi trả'), { status: 404 });
      }
      const invoice = invoiceRows[0];
      if (invoice.status === 'cancelled') {
        throw Object.assign(new Error('Hóa đơn đã hủy, không thể hoàn tất yêu cầu đổi trả này'), { status: 400 });
      }

      const [items] = await connection.query('SELECT * FROM return_items WHERE return_id = ? FOR UPDATE', [id]);

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

      let pointsReversed = 0;
      let invoiceStatus = invoice.status;
      let isFullRefund = false;

      if (ret.return_type === 'refund') {
        const settings = await SettingsCache.getAll();
        const [refundProgressRows] = await connection.query(
          `SELECT
              COALESCE(SUM(total_refund), 0) as completed_refund_amount
           FROM returns
           WHERE invoice_id = ? AND return_type = 'refund' AND status = 'completed'`,
          [ret.invoice_id]
        );
        const completedRefundAmount = Number(refundProgressRows[0]?.completed_refund_amount || 0);
        const previousCompletedRefundAmount = Math.max(0, completedRefundAmount - Number(ret.total_refund || 0));

        const targetReversedPoints = calculateReversedPoints(invoice.points_earned, invoice.final_total, completedRefundAmount);
        const previousReversedPoints = calculateReversedPoints(invoice.points_earned, invoice.final_total, previousCompletedRefundAmount);
        pointsReversed = Math.max(0, targetReversedPoints - previousReversedPoints);

        if (ret.customer_id || invoice.customer_id) {
          const targetCustomerId = ret.customer_id || invoice.customer_id;
          const [customerRows] = await connection.query(
            'SELECT total_points, total_spent FROM customers WHERE customer_id = ? FOR UPDATE',
            [targetCustomerId]
          );
          if (customerRows.length) {
            const currentPoints = Number(customerRows[0].total_points || 0);
            const currentSpent = Number(customerRows[0].total_spent || 0);
            const nextPoints = Math.max(0, currentPoints - pointsReversed);
            const nextSpent = Math.max(0, currentSpent - Number(ret.total_refund || 0));

            await connection.query(
              `UPDATE customers
               SET total_points = ?, total_spent = ?, membership_tier = ?
               WHERE customer_id = ?`,
              [nextPoints, nextSpent, determineMembershipTier(nextPoints, settings), targetCustomerId]
            );
          }
        }

        const [invoiceRefundCoverage] = await connection.query(
          `SELECT ii.product_id,
                  ii.quantity as sold_qty,
                  COALESCE(SUM(CASE WHEN r.return_type = 'refund' AND r.status = 'completed' THEN ri.quantity ELSE 0 END), 0) as refunded_qty
           FROM invoice_items ii
           LEFT JOIN return_items ri ON ii.product_id = ri.product_id
           LEFT JOIN returns r ON ri.return_id = r.return_id AND r.invoice_id = ii.invoice_id
           WHERE ii.invoice_id = ?
           GROUP BY ii.product_id, ii.quantity`,
          [ret.invoice_id]
        );

        isFullRefund = invoiceRefundCoverage.length > 0
          && invoiceRefundCoverage.every((row) => Number(row.refunded_qty || 0) >= Number(row.sold_qty || 0));

        if (isFullRefund) {
          await connection.query(
            `UPDATE invoices SET status = 'refunded' WHERE invoice_id = ?`,
            [ret.invoice_id]
          );
          await connection.query(
            `UPDATE payment_transactions
             SET status = 'refunded', confirmed_by = ?, confirmed_at = NOW()
             WHERE invoice_id = ? AND status = 'confirmed'`,
            [userId, ret.invoice_id]
          );
          invoiceStatus = 'refunded';
        }
      }

      await connection.commit();
      return {
        return_id: Number(id),
        invoice_id: ret.invoice_id,
        return_type: ret.return_type,
        total_refund: Number(ret.total_refund || 0),
        points_reversed: pointsReversed,
        invoice_status: invoiceStatus,
        is_full_refund: isFullRefund
      };
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
