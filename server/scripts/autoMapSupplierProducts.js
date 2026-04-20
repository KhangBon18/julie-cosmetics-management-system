const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

const serverDir = path.join(__dirname, '..');
const projectRoot = path.join(serverDir, '..');

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    Object.assign(process.env, dotenv.parse(fs.readFileSync(filePath)));
  }
};

loadEnv(path.join(projectRoot, '.env'));
loadEnv(path.join(serverDir, '.env'));

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const supplierArg = args.find((arg) => arg.startsWith('--supplier='));
const supplierId = supplierArg ? Number(supplierArg.split('=')[1]) : null;

const formatSupplierLabel = (row) => `NCC ${row.supplier_id} - ${row.supplier_name}`;

async function ensureMappingTable(connection) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = 'supplier_products'`
  );

  if (!Number(rows[0]?.total || 0)) {
    throw new Error('Chưa tìm thấy bảng supplier_products. Hãy chạy migration 033 trước.');
  }
}

async function loadInferredMappings(connection, onlySupplierId = null) {
  const params = [];
  let supplierFilter = '';

  if (onlySupplierId) {
    supplierFilter = ' AND ir.supplier_id = ?';
    params.push(onlySupplierId);
  }

  const [rows] = await connection.query(
    `SELECT DISTINCT
        ir.supplier_id,
        s.supplier_name,
        iri.product_id,
        p.product_name
     FROM import_receipts ir
     JOIN import_receipt_items iri ON iri.receipt_id = ir.receipt_id
     JOIN suppliers s ON s.supplier_id = ir.supplier_id
     JOIN products p ON p.product_id = iri.product_id
     WHERE ir.status = 'completed'
       AND s.deleted_at IS NULL
       AND p.deleted_at IS NULL
       ${supplierFilter}
     ORDER BY ir.supplier_id ASC, p.product_name ASC`,
    params
  );

  return rows;
}

async function loadExistingMappings(connection, supplierIds) {
  if (!supplierIds.length) return new Map();

  const placeholders = supplierIds.map(() => '?').join(', ');
  const [rows] = await connection.query(
    `SELECT supplier_id, product_id, is_active
     FROM supplier_products
     WHERE supplier_id IN (${placeholders})`,
    supplierIds
  );

  return new Map(
    rows.map((row) => [`${row.supplier_id}:${row.product_id}`, Boolean(row.is_active)])
  );
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'julie_cosmetics',
    charset: 'utf8mb4'
  });

  try {
    await ensureMappingTable(connection);

    const inferredMappings = await loadInferredMappings(connection, supplierId);
    if (!inferredMappings.length) {
      console.log('ℹ️ Không tìm thấy quan hệ NCC - sản phẩm nào từ lịch sử phiếu nhập completed.');
      return;
    }

    const supplierIds = [...new Set(inferredMappings.map((row) => row.supplier_id))];
    const existingMap = await loadExistingMappings(connection, supplierIds);
    const summary = new Map();

    const touchSummary = (row, key) => {
      if (!summary.has(row.supplier_id)) {
        summary.set(row.supplier_id, {
          supplier_id: row.supplier_id,
          supplier_name: row.supplier_name,
          inferred: 0,
          inserted: 0,
          reactivated: 0,
          skipped: 0
        });
      }
      summary.get(row.supplier_id)[key] += 1;
    };

    if (!isDryRun) {
      await connection.beginTransaction();
    }

    for (const row of inferredMappings) {
      const mapKey = `${row.supplier_id}:${row.product_id}`;
      const existingState = existingMap.get(mapKey);
      touchSummary(row, 'inferred');

      if (existingState === true) {
        touchSummary(row, 'skipped');
        continue;
      }

      if (existingState === false) {
        if (!isDryRun) {
          await connection.query(
            `UPDATE supplier_products
             SET is_active = 1, updated_at = CURRENT_TIMESTAMP
             WHERE supplier_id = ? AND product_id = ?`,
            [row.supplier_id, row.product_id]
          );
        }
        existingMap.set(mapKey, true);
        touchSummary(row, 'reactivated');
        continue;
      }

      if (!isDryRun) {
        await connection.query(
          `INSERT INTO supplier_products (supplier_id, product_id, is_active)
           VALUES (?, ?, 1)`,
          [row.supplier_id, row.product_id]
        );
      }
      existingMap.set(mapKey, true);
      touchSummary(row, 'inserted');
    }

    if (!isDryRun) {
      await connection.commit();
    }

    console.log(isDryRun
      ? '🧪 Dry-run auto map nhà cung cấp - sản phẩm'
      : '✅ Đã auto map nhà cung cấp - sản phẩm từ lịch sử phiếu nhập');
    console.log('');

    for (const row of summary.values()) {
      console.log(`${formatSupplierLabel(row)}`);
      console.log(`   • Suy ra từ lịch sử: ${row.inferred}`);
      console.log(`   • Thêm mới: ${row.inserted}`);
      console.log(`   • Kích hoạt lại: ${row.reactivated}`);
      console.log(`   • Bỏ qua (đã active): ${row.skipped}`);
    }
  } catch (error) {
    try {
      if (!isDryRun) await connection.rollback();
    } catch {
    }
    console.error(`❌ Auto map thất bại: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

main();
