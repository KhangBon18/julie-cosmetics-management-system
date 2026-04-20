const { pool } = require('../config/db');

let supplierProductsTableExistsCache = null;

const hasSupplierProductsTable = async () => {
  if (supplierProductsTableExistsCache !== null) return supplierProductsTableExistsCache;

  try {
    const [rows] = await pool.query(
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

const PRODUCT_SELECT = `SELECT p.product_id, p.product_name, p.import_price, p.sell_price, p.stock_quantity,
                               p.is_active, b.brand_name, c.category_name
                        FROM products p
                        LEFT JOIN brands b ON b.brand_id = p.brand_id
                        LEFT JOIN categories c ON c.category_id = p.category_id`;

const Supplier = {
  findAll: async ({ page = 1, limit = 10, search, is_active, sort = 'name_asc' } = {}) => {
    let query = 'SELECT * FROM suppliers WHERE deleted_at IS NULL';
    let countQuery = 'SELECT COUNT(*) as total FROM suppliers WHERE deleted_at IS NULL';
    const params = [];
    const countParams = [];

    if (search?.trim()) {
      const keyword = `%${search.trim()}%`;
      query += ' AND (supplier_name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR email LIKE ?)';
      countQuery += ' AND (supplier_name LIKE ? OR contact_person LIKE ? OR phone LIKE ? OR email LIKE ?)';
      params.push(keyword, keyword, keyword, keyword);
      countParams.push(keyword, keyword, keyword, keyword);
    }

    if (is_active !== undefined && is_active !== null && is_active !== '') {
      query += ' AND is_active = ?';
      countQuery += ' AND is_active = ?';
      params.push(Number(is_active));
      countParams.push(Number(is_active));
    }

    switch (sort) {
      case 'name_desc':
        query += ' ORDER BY supplier_name DESC';
        break;
      case 'newest':
        query += ' ORDER BY created_at DESC';
        break;
      case 'oldest':
        query += ' ORDER BY created_at ASC';
        break;
      default:
        query += ' ORDER BY supplier_name ASC';
    }

    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    const [countResult] = await pool.query(countQuery, countParams);

    return { suppliers: rows, total: countResult[0].total };
  },

  findById: async (id) => {
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE supplier_id = ? AND deleted_at IS NULL', [id]);
    const supplier = rows[0];
    if (!supplier) return null;

    const mappingTableAvailable = await hasSupplierProductsTable();
    if (!mappingTableAvailable) {
      return {
        ...supplier,
        mapping_table_available: false,
        mapped_product_count: 0
      };
    }

    const [mappingRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM supplier_products
       WHERE supplier_id = ? AND is_active = 1`,
      [id]
    );

    return {
      ...supplier,
      mapping_table_available: true,
      mapped_product_count: Number(mappingRows[0]?.total || 0)
    };
  },

  getProductMappings: async (supplierId) => {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return null;

    const mappingTableAvailable = await hasSupplierProductsTable();

    if (!mappingTableAvailable) {
      const [availableProducts] = await pool.query(
        `${PRODUCT_SELECT}
         WHERE p.deleted_at IS NULL
         ORDER BY p.product_name ASC`
      );

      return {
        supplier,
        mapping_table_available: false,
        mapping_enabled: false,
        fallback_all_products: true,
        mapped_products: [],
        available_products: availableProducts
      };
    }

    const [mappedProducts] = await pool.query(
      `${PRODUCT_SELECT}
       JOIN supplier_products sp
         ON sp.product_id = p.product_id
        AND sp.supplier_id = ?
        AND sp.is_active = 1
       WHERE p.deleted_at IS NULL
       ORDER BY p.product_name ASC`,
      [supplierId]
    );

    const [availableProducts] = await pool.query(
      `${PRODUCT_SELECT}
       WHERE p.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1
           FROM supplier_products sp
           WHERE sp.supplier_id = ?
             AND sp.product_id = p.product_id
             AND sp.is_active = 1
         )
       ORDER BY p.product_name ASC`,
      [supplierId]
    );

    return {
      supplier: {
        ...supplier,
        mapped_product_count: mappedProducts.length
      },
      mapping_table_available: true,
      mapping_enabled: mappedProducts.length > 0,
      fallback_all_products: mappedProducts.length === 0,
      mapped_products: mappedProducts,
      available_products: availableProducts
    };
  },

  addProductMapping: async (supplierId, productId) => {
    const mappingTableAvailable = await hasSupplierProductsTable();
    if (!mappingTableAvailable) {
      throw Object.assign(
        new Error('CSDL chưa đồng bộ chức năng mapping nhà cung cấp - sản phẩm'),
        { status: 503 }
      );
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw Object.assign(new Error('Không tìm thấy nhà cung cấp'), { status: 404 });
    }

    const [productRows] = await pool.query(
      `SELECT product_id, product_name
       FROM products
       WHERE product_id = ? AND deleted_at IS NULL`,
      [productId]
    );

    if (!productRows.length) {
      throw Object.assign(new Error('Không tìm thấy sản phẩm để map'), { status: 404 });
    }

    const [existingRows] = await pool.query(
      `SELECT is_active
       FROM supplier_products
       WHERE supplier_id = ? AND product_id = ?`,
      [supplierId, productId]
    );

    if (existingRows[0]?.is_active) {
      throw Object.assign(
        new Error(`Sản phẩm "${productRows[0].product_name}" đã được map với nhà cung cấp này`),
        { status: 409 }
      );
    }

    if (existingRows.length) {
      await pool.query(
        `UPDATE supplier_products
         SET is_active = 1, updated_at = CURRENT_TIMESTAMP
         WHERE supplier_id = ? AND product_id = ?`,
        [supplierId, productId]
      );
    } else {
      await pool.query(
        `INSERT INTO supplier_products (supplier_id, product_id, is_active)
         VALUES (?, ?, 1)`,
        [supplierId, productId]
      );
    }

    return Supplier.getProductMappings(supplierId);
  },

  removeProductMapping: async (supplierId, productId) => {
    const mappingTableAvailable = await hasSupplierProductsTable();
    if (!mappingTableAvailable) {
      throw Object.assign(
        new Error('CSDL chưa đồng bộ chức năng mapping nhà cung cấp - sản phẩm'),
        { status: 503 }
      );
    }

    const [result] = await pool.query(
      `UPDATE supplier_products
       SET is_active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE supplier_id = ? AND product_id = ? AND is_active = 1`,
      [supplierId, productId]
    );

    if (!result.affectedRows) {
      throw Object.assign(
        new Error('Mapping nhà cung cấp - sản phẩm không tồn tại hoặc đã bị gỡ trước đó'),
        { status: 404 }
      );
    }

    return Supplier.getProductMappings(supplierId);
  },

  create: async ({ supplier_name, contact_person, phone, email, address }) => {
    const [result] = await pool.query(
      'INSERT INTO suppliers (supplier_name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [supplier_name, contact_person || null, phone || null, email || null, address || null]
    );
    return result.insertId;
  },

  update: async (id, { supplier_name, contact_person, phone, email, address, is_active }) => {
    const [result] = await pool.query(
      'UPDATE suppliers SET supplier_name = ?, contact_person = ?, phone = ?, email = ?, address = ?, is_active = ? WHERE supplier_id = ? AND deleted_at IS NULL',
      [supplier_name, contact_person, phone, email, address, is_active, id]
    );
    return result.affectedRows;
  },

  delete: async (id) => {
    const [result] = await pool.query(
      'UPDATE suppliers SET deleted_at = NOW(), is_active = 0 WHERE supplier_id = ? AND deleted_at IS NULL',
      [id]
    );
    return result.affectedRows;
  }
};

module.exports = Supplier;
