/**
 * Log inventory movements for stock audit and reconciliation.
 * IMPORTANT: This must be called BEFORE the trigger fires (i.e., before
 * inserting into invoice_items or import_receipt_items) to capture
 * the correct stock_before value.
 *
 * If used inside a transaction, pass the connection object.
 * If used standalone, it will use the pool.
 */
const { pool } = require('../config/db');

/**
 * @param {Object} conn - MySQL connection (from transaction) or null for pool
 * @param {Object} params
 * @param {number} params.productId - Product being affected
 * @param {string} params.movementType - 'import' | 'sale' | 'return' | 'adjustment' | 'damage' | 'transfer'
 * @param {number} params.quantity - Positive = stock in, Negative = stock out
 * @param {string|null} params.referenceType - 'invoice' | 'import_receipt' | 'manual'
 * @param {number|null} params.referenceId - PK of source document
 * @param {number|null} params.unitCost - Cost per unit at time of movement
 * @param {string|null} params.note - Optional note
 * @param {number|null} params.createdBy - user_id who initiated the movement
 */
const logInventoryMovement = async (conn, { productId, movementType, quantity, referenceType, referenceId, unitCost, note, createdBy }) => {
  const db = conn || pool;
  try {
    // Get current stock BEFORE the trigger changes it
    const [rows] = await db.query(
      'SELECT stock_quantity FROM products WHERE product_id = ?',
      [productId]
    );
    const stockBefore = rows[0]?.stock_quantity || 0;
    const stockAfter = stockBefore + quantity;

    await db.query(
      `INSERT INTO inventory_movements
       (product_id, movement_type, quantity, stock_before, stock_after,
        reference_type, reference_id, unit_cost, note, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productId,
        movementType,
        quantity,
        stockBefore,
        stockAfter,
        referenceType || null,
        referenceId || null,
        unitCost || null,
        note || null,
        createdBy || null
      ]
    );
  } catch (error) {
    // Log but don't crash — inventory movement logging is supplementary
    console.error('[InventoryLog] Failed to log movement:', error.message);
  }
};

module.exports = { logInventoryMovement };
