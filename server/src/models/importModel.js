const { pool } = require('../config/db');
const { logInventoryMovement } = require('../utils/inventoryLogger');

const roundMoney = (value) => Number((Number(value) || 0).toFixed(2));
let supplierProductsTableExistsCache = null;

const hasSupplierProductsTable = async (connection) => {
  if (supplierProductsTableExistsCache !== null) return supplierProductsTableExistsCache;

  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM information_schema.tables
       WHERE table_schema = DATABASE()
         AND table_name = 'supplier_products'`
    );
    supplierProductsTableExistsCache = Number(rows[0]?.total || 0) > 0;
  } catch {
    supplierProductsTableExistsCache = false;
  }

  return supplierProductsTableExistsCache;
};

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

      const [supplierRows] = await connection.query(
        `SELECT supplier_id
         FROM suppliers
         WHERE supplier_id = ? AND deleted_at IS NULL AND is_active = 1`,
        [supplier_id]
      );
      if (!supplierRows.length) {
        throw Object.assign(new Error('Nhà cung cấp không tồn tại hoặc đã ngừng hoạt động'), { status: 400 });
      }

      const supplierMappingTableAvailable = await hasSupplierProductsTable(connection);
      const [supplierMappingCountRows] = await connection.query(
        supplierMappingTableAvailable
          ? `SELECT COUNT(*) AS total
             FROM supplier_products
             WHERE supplier_id = ? AND is_active = 1`
          : 'SELECT 0 AS total',
        supplierMappingTableAvailable ? [supplier_id] : []
      );
      const supplierHasMappedCatalog = supplierMappingTableAvailable
        && Number(supplierMappingCountRows[0]?.total || 0) > 0;
      let allowedProductIds = null;

      if (supplierHasMappedCatalog) {
        const [mappingRows] = await connection.query(
          `SELECT product_id
           FROM supplier_products
           WHERE supplier_id = ? AND is_active = 1`,
          [supplier_id]
        );
        allowedProductIds = new Set(mappingRows.map((row) => Number(row.product_id)));
      }

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
          'SELECT product_id, product_name FROM products WHERE product_id = ? AND deleted_at IS NULL', [item.product_id]
        );
        if (!pRows.length) {
          throw Object.assign(new Error(`Sản phẩm ID ${item.product_id} không tồn tại`), { status: 400 });
        }
        if (supplierHasMappedCatalog && !allowedProductIds.has(Number(item.product_id))) {
          throw Object.assign(
            new Error(`Sản phẩm "${pRows[0].product_name}" không thuộc danh mục đã cấu hình cho nhà cung cấp này`),
            { status: 400 }
          );
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

  delete: async (id, userId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [receiptRows] = await connection.query(
        `SELECT receipt_id, status
         FROM import_receipts
         WHERE receipt_id = ?
         FOR UPDATE`,
        [id]
      );
      const receipt = receiptRows[0];
      if (!receipt) {
        throw Object.assign(new Error('Không tìm thấy phiếu nhập'), { status: 404 });
      }
      if (receipt.status === 'cancelled') {
        throw Object.assign(new Error('Phiếu nhập đã bị hủy trước đó'), { status: 409 });
      }

      const [items] = await connection.query(
        `SELECT
            iri.product_id,
            p.product_name,
            SUM(iri.quantity) AS total_quantity,
            SUM(iri.quantity * iri.unit_price) AS total_cost
         FROM import_receipt_items iri
         JOIN products p ON p.product_id = iri.product_id
         WHERE iri.receipt_id = ?
         GROUP BY iri.product_id, p.product_name
         ORDER BY iri.product_id`,
        [id]
      );

      const recalculatedCosts = new Map();

      for (const item of items) {
        const totalQuantity = Number(item.total_quantity) || 0;
        const [productRows] = await connection.query(
          `SELECT stock_quantity, import_price
           FROM products
           WHERE product_id = ?
           FOR UPDATE`,
          [item.product_id]
        );
        const currentStock = Number(productRows[0]?.stock_quantity || 0);
        const currentImportPrice = Number(productRows[0]?.import_price || 0);
        const totalCost = Number(item.total_cost) || 0;
        const receiptUnitCost = totalQuantity > 0 ? roundMoney(totalCost / totalQuantity) : 0;

        if (currentStock < totalQuantity) {
          throw Object.assign(
            new Error(`Không thể hủy phiếu nhập vì sản phẩm "${item.product_name}" chỉ còn ${currentStock}, nhỏ hơn số lượng đã nhập ${totalQuantity}`),
            { status: 409 }
          );
        }

        const [latestMovementRows] = await connection.query(
          `SELECT movement_id, reference_type, reference_id
           FROM inventory_movements
           WHERE product_id = ?
           ORDER BY movement_id DESC
           LIMIT 1`,
          [item.product_id]
        );
        const [receiptMovementRows] = await connection.query(
          `SELECT MAX(movement_id) AS movement_id
           FROM inventory_movements
           WHERE product_id = ? AND reference_type = 'import_receipt' AND reference_id = ?`,
          [item.product_id, id]
        );

        const latestMovement = latestMovementRows[0];
        const receiptMovementId = Number(receiptMovementRows[0]?.movement_id || 0);
        const isLatestReceiptMovement = latestMovement
          && Number(latestMovement.movement_id) === receiptMovementId
          && latestMovement.reference_type === 'import_receipt'
          && Number(latestMovement.reference_id) === Number(id);

        if (!isLatestReceiptMovement) {
          throw Object.assign(
            new Error(`Không thể hủy phiếu nhập vì sản phẩm "${item.product_name}" đã có biến động kho phát sinh sau phiếu nhập này`),
            { status: 409 }
          );
        }

        const previousStock = currentStock - totalQuantity;
        const previousImportPrice = previousStock > 0
          ? roundMoney(((currentImportPrice * currentStock) - totalCost) / previousStock)
          : 0;

        recalculatedCosts.set(item.product_id, Math.max(0, previousImportPrice));

        await logInventoryMovement(connection, {
          productId: item.product_id,
          movementType: 'import',
          quantity: -totalQuantity,
          referenceType: 'import_receipt_cancel',
          referenceId: id,
          unitCost: receiptUnitCost,
          note: 'Hủy phiếu nhập kho',
          createdBy: userId || null
        });
      }

      const [result] = await connection.query(
        "UPDATE import_receipts SET status = 'cancelled' WHERE receipt_id = ? AND status = 'completed'",
        [id]
      );

      for (const [productId, importPrice] of recalculatedCosts.entries()) {
        await connection.query(
          'UPDATE products SET import_price = ? WHERE product_id = ?',
          [importPrice, productId]
        );
      }

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
