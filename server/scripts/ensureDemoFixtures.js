const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const serverDir = path.join(__dirname, '..');
const projectRoot = path.join(serverDir, '..');

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    Object.assign(process.env, dotenv.parse(fs.readFileSync(filePath)));
  }
};

loadEnv(path.join(projectRoot, '.env'));
loadEnv(path.join(serverDir, '.env'));

const { pool } = require('../src/config/db');
const Invoice = require('../src/models/invoiceModel');
const Leave = require('../src/models/leaveModel');
const Salary = require('../src/models/salaryModel');
const SalaryBonus = require('../src/models/salaryBonusModel');
const { calculateAllSalaries, calculateSalary } = require('../src/utils/salaryCalculation');

const DEMO_PENDING_INVOICE_NOTE = '[DEMO] Hóa đơn chờ xác nhận thanh toán';
const DEMO_PENDING_LEAVE_REASON = '[DEMO] Nghỉ phép chờ duyệt để trình bày giữa kỳ';
const DEMO_BONUS_REASON = '[DEMO] Thưởng KPI giữa kỳ';
const DEMO_ATTENDANCE_PERIOD_NOTE = '[DEMO] Kỳ công hiện tại khóa sẵn để kiểm thử guard backend';
const SMOKE_LOCK_ATTENDANCE_NOTE = '[SMOKE] locked attendance write must be blocked';
const FALLBACK_SUPPLIER_NAME = 'Nhà cung cấp fallback demo';

const toDateOnly = (value) => {
  return new Date(value).toISOString().slice(0, 10);
};

const addDays = (value, amount) => {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
};

async function hasTable(tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.tables
     WHERE table_schema = DATABASE()
       AND table_name = ?`,
    [tableName]
  );

  return Number(rows[0]?.total || 0) > 0;
}

async function cleanupSmokeAttendanceArtifacts() {
  if (!(await hasTable('attendance_records'))) {
    return;
  }

  const [result] = await pool.query(
    `DELETE FROM attendance_records
     WHERE source = 'self'
       AND note = ?`,
    [SMOKE_LOCK_ATTENDANCE_NOTE]
  );

  if (Number(result.affectedRows || 0) > 0) {
    console.log(`✅ Đã dọn ${result.affectedRows} bản ghi chấm công smoke bị tạo dở.`);
  }
}

async function ensureCurrentAttendancePeriodLockedFixture() {
  if (!(await hasTable('attendance_periods'))) {
    console.log('⚠️  Bỏ qua attendance period fixture vì DB chưa có bảng attendance_periods (migration 039).');
    return;
  }

  const [[currentPeriod]] = await pool.query(
    `SELECT
       MONTH(CURDATE()) AS month,
       YEAR(CURDATE()) AS year,
       DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL DAYOFMONTH(CURDATE()) - 1 DAY), '%Y-%m-%d') AS start_date,
       DATE_FORMAT(LAST_DAY(CURDATE()), '%Y-%m-%d') AS end_date`
  );

  const [[adminUser]] = await pool.query(
    `SELECT user_id
     FROM users
     WHERE username = 'admin' AND deleted_at IS NULL
     LIMIT 1`
  );

  await pool.query(
    `INSERT INTO attendance_periods (month, year, start_date, end_date, status, locked_by, locked_at, note)
     VALUES (?, ?, ?, ?, 'locked', ?, NOW(), ?)
     ON DUPLICATE KEY UPDATE
       start_date = VALUES(start_date),
       end_date = VALUES(end_date),
       status = 'locked',
       locked_by = COALESCE(attendance_periods.locked_by, VALUES(locked_by)),
       locked_at = COALESCE(attendance_periods.locked_at, NOW()),
       note = COALESCE(attendance_periods.note, VALUES(note))`,
    [
      currentPeriod.month,
      currentPeriod.year,
      currentPeriod.start_date,
      currentPeriod.end_date,
      adminUser?.user_id || null,
      DEMO_ATTENDANCE_PERIOD_NOTE,
    ]
  );

  console.log(`✅ Đã khóa kỳ công demo hiện tại ${currentPeriod.month}/${currentPeriod.year}.`);
}

async function syncFinancialHeaderTotals() {
  const [importResult] = await pool.query(
    `UPDATE import_receipts ir
     JOIN (
       SELECT receipt_id, SUM(quantity * unit_price) AS line_total
       FROM import_receipt_items
       GROUP BY receipt_id
     ) totals ON totals.receipt_id = ir.receipt_id
     SET ir.total_amount = totals.line_total
     WHERE ABS(COALESCE(ir.total_amount, 0) - totals.line_total) > 0.009`
  );

  const [settingsRows] = await pool.query(
    `SELECT setting_value
     FROM settings
     WHERE setting_key = 'crm.points_per_10000'
     LIMIT 1`
  );
  const pointsPerBase = Number(settingsRows[0]?.setting_value || 1) > 0
    ? Number(settingsRows[0].setting_value)
    : 1;

  const invoiceTotalSql = `
    GREATEST(
      0,
      totals.line_subtotal - ROUND(totals.line_subtotal * COALESCE(i.discount_percent, 0) / 100)
    )
  `;
  const pointsSql = `
    CASE
      WHEN i.customer_id IS NULL OR i.status IN ('cancelled', 'refunded') THEN 0
      ELSE FLOOR(${invoiceTotalSql} / 10000) * ?
    END
  `;

  const [invoiceResult] = await pool.query(
    `UPDATE invoices i
     JOIN (
       SELECT invoice_id, SUM(subtotal) AS line_subtotal
       FROM invoice_items
       GROUP BY invoice_id
     ) totals ON totals.invoice_id = i.invoice_id
     SET i.subtotal = totals.line_subtotal,
         i.discount_amount = ROUND(totals.line_subtotal * COALESCE(i.discount_percent, 0) / 100),
         i.final_total = ${invoiceTotalSql},
         i.points_earned = ${pointsSql}
     WHERE ABS(COALESCE(i.subtotal, 0) - totals.line_subtotal) > 0.009
        OR ABS(COALESCE(i.discount_amount, 0) - ROUND(totals.line_subtotal * COALESCE(i.discount_percent, 0) / 100)) > 0.009
        OR ABS(COALESCE(i.final_total, 0) - ${invoiceTotalSql}) > 0.009
        OR COALESCE(i.points_earned, 0) <> ${pointsSql}`,
    [pointsPerBase, pointsPerBase]
  );

  const [paymentResult] = await pool.query(
    `UPDATE payment_transactions pt
     JOIN invoices i ON i.invoice_id = pt.invoice_id
     SET pt.amount = i.final_total
     WHERE pt.status IN ('pending', 'confirmed')
       AND ABS(COALESCE(pt.amount, 0) - COALESCE(i.final_total, 0)) > 0.009`
  );

  console.log(`✅ Đồng bộ tổng tiền demo: ${importResult.affectedRows} phiếu nhập, ${invoiceResult.affectedRows} hóa đơn, ${paymentResult.affectedRows} giao dịch thanh toán.`);
}

async function ensureSupplierFallbackFixture() {
  if (!(await hasTable('supplier_products'))) {
    console.log('⚠️  Bỏ qua supplier mapping fixture vì DB chưa có bảng supplier_products (migration 033).');
    return;
  }

  const [[supplier3]] = await pool.query(
    `SELECT supplier_id, supplier_name
     FROM suppliers
     WHERE supplier_id = 3 AND deleted_at IS NULL
     LIMIT 1`
  );

  let fallbackSupplierId = supplier3?.supplier_id || null;

  if (!fallbackSupplierId) {
    const [existing] = await pool.query(
      `SELECT supplier_id
       FROM suppliers
       WHERE supplier_name = ? AND deleted_at IS NULL
       LIMIT 1`,
      [FALLBACK_SUPPLIER_NAME]
    );

    if (existing[0]?.supplier_id) {
      fallbackSupplierId = existing[0].supplier_id;
    } else {
      const [insertResult] = await pool.query(
        `INSERT INTO suppliers (supplier_name, contact_person, phone, email, address, is_active)
         VALUES (?, 'Demo Fixture', '0289999999', 'fallback-demo@julie.local', 'NCC dùng để demo legacy fallback', 1)`,
        [FALLBACK_SUPPLIER_NAME]
      );
      fallbackSupplierId = insertResult.insertId;
      console.log(`✅ Đã tạo NCC fallback demo mới (#${fallbackSupplierId}).`);
    }
  }

  const mappedPairs = [
    [1, 1],
    [1, 5],
    [2, 3],
    [2, 4],
    [2, 6]
  ];

  for (const [supplierId, productId] of mappedPairs) {
    await pool.query(
      `INSERT INTO supplier_products (supplier_id, product_id, is_active)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE is_active = 1, updated_at = CURRENT_TIMESTAMP`,
      [supplierId, productId]
    );
  }

  const [deactivated] = await pool.query(
    `UPDATE supplier_products
     SET is_active = 0, updated_at = CURRENT_TIMESTAMP
     WHERE supplier_id = ? AND is_active = 1`,
    [fallbackSupplierId]
  );

  if (deactivated.affectedRows > 0) {
    console.log(`✅ Đã đưa NCC #${fallbackSupplierId} về chế độ fallback toàn catalog (${deactivated.affectedRows} mapping bị tắt).`);
  } else {
    console.log(`✅ NCC #${fallbackSupplierId} đang ở chế độ fallback toàn catalog.`);
  }
}

async function ensurePendingLeaveFixture() {
  const [existing] = await pool.query(
    `SELECT request_id
     FROM leave_requests
     WHERE reason = ? AND status = 'pending'
     LIMIT 1`,
    [DEMO_PENDING_LEAVE_REASON]
  );

  if (existing[0]?.request_id) {
    console.log(`✅ Đã có đơn nghỉ demo chờ duyệt (#${existing[0].request_id}).`);
    return;
  }

  const [employees] = await pool.query(
    `SELECT employee_id
     FROM employees
     WHERE status = 'active' AND deleted_at IS NULL
       AND employee_id NOT IN (1, 4)
     ORDER BY employee_id ASC
     LIMIT 1`
  );

  const employeeId = employees[0]?.employee_id;
  if (!employeeId) {
    throw new Error('Không tìm thấy nhân sự active phù hợp để tạo đơn nghỉ demo.');
  }

  const now = new Date();
  const startDate = toDateOnly(addDays(now, 5));
  const endDate = toDateOnly(addDays(now, 6));
  const requestId = await Leave.create({
    employee_id: employeeId,
    leave_type: 'annual',
    start_date: startDate,
    end_date: endDate,
    reason: DEMO_PENDING_LEAVE_REASON
  });

  console.log(`✅ Đã tạo đơn nghỉ demo chờ duyệt (#${requestId}) cho employee #${employeeId}.`);
}

async function ensureCurrentPayrollFixture() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [existingRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM salaries
     WHERE month = ? AND year = ?`,
    [month, year]
  );

  if (!Number(existingRows[0]?.total || 0)) {
    const salaryRows = await calculateAllSalaries(month, year);
    let created = 0;

    for (const salary of salaryRows) {
      try {
        await Salary.create({ ...salary, generated_by: 1 });
        created += 1;
      } catch (error) {
        if (!String(error.message || '').toLowerCase().includes('duplicate')) {
          throw error;
        }
      }
    }

    console.log(`✅ Đã tạo ${created} bảng lương demo cho kỳ ${month}/${year}.`);
  } else {
    console.log(`✅ Đã có sẵn bảng lương demo cho kỳ ${month}/${year}.`);
  }

  const [staffUserRows] = await pool.query(
    `SELECT employee_id
     FROM users
     WHERE username = 'staff01' AND deleted_at IS NULL
     LIMIT 1`
  );

  const employeeId = staffUserRows[0]?.employee_id;
  if (!employeeId) {
    console.log('⚠️  Không tìm thấy employee gắn với staff01 để đồng bộ thưởng demo.');
    return;
  }

  const [salaryRow] = await pool.query(
    `SELECT salary_id
     FROM salaries
     WHERE employee_id = ? AND month = ? AND year = ?
     LIMIT 1`,
    [employeeId, month, year]
  );

  if (!salaryRow[0]?.salary_id) {
    const salary = await calculateSalary(employeeId, month, year);
    await Salary.create({ ...salary, generated_by: 1 });
    console.log(`✅ Đã tạo bảng lương riêng cho staff01 ở kỳ ${month}/${year}.`);
  }

  if (!(await SalaryBonus.hasTable())) {
    console.log('⚠️  Bỏ qua bonus fixture vì DB chưa có bảng salary_bonus_adjustments (migration 032).');
    return;
  }

  await SalaryBonus.upsert({
    employee_id: employeeId,
    month,
    year,
    amount: 500000,
    reason: DEMO_BONUS_REASON,
    user_id: 1
  });

  console.log(`✅ Đã đồng bộ thưởng demo cho staff01 ở kỳ ${month}/${year}.`);
}

async function ensurePendingInvoiceFixture() {
  const [existing] = await pool.query(
    `SELECT i.invoice_id
     FROM invoices i
     JOIN payment_transactions pt ON pt.invoice_id = i.invoice_id
     WHERE i.note = ?
       AND i.status = 'confirmed'
       AND pt.status = 'pending'
     LIMIT 1`,
    [DEMO_PENDING_INVOICE_NOTE]
  );

  if (existing[0]?.invoice_id) {
    console.log(`✅ Đã có hóa đơn demo chờ xác nhận thanh toán (#${existing[0].invoice_id}).`);
    return;
  }

  const [userRows] = await pool.query(
    `SELECT user_id
     FROM users
     WHERE username = 'staff01' AND deleted_at IS NULL
     LIMIT 1`
  );
  const [customerRows] = await pool.query(
    `SELECT customer_id
     FROM customers
     WHERE deleted_at IS NULL
     ORDER BY total_spent DESC, customer_id ASC
     LIMIT 1`
  );
  const [productRows] = await pool.query(
    `SELECT product_id
     FROM products
     WHERE is_active = 1 AND deleted_at IS NULL AND stock_quantity >= 3
     ORDER BY stock_quantity DESC, product_id ASC
     LIMIT 1`
  );

  const userId = userRows[0]?.user_id;
  const customerId = customerRows[0]?.customer_id;
  const productId = productRows[0]?.product_id;

  if (!userId || !customerId || !productId) {
    throw new Error('Không đủ dữ liệu để tạo hóa đơn demo chờ xác nhận thanh toán.');
  }

  const invoiceId = await Invoice.create({
    customer_id: customerId,
    created_by: userId,
    payment_method: 'transfer',
    note: DEMO_PENDING_INVOICE_NOTE,
    items: [
      {
        product_id: productId,
        quantity: 1
      }
    ]
  });

  console.log(`✅ Đã tạo hóa đơn demo chờ xác nhận thanh toán (#${invoiceId}).`);
}

async function main() {
  try {
    console.log('🎯 Ensuring demo fixtures...\n');

    await ensureSupplierFallbackFixture();
    await cleanupSmokeAttendanceArtifacts();
    await ensureCurrentAttendancePeriodLockedFixture();
    await ensurePendingLeaveFixture();
    await ensureCurrentPayrollFixture();
    await ensurePendingInvoiceFixture();
    await syncFinancialHeaderTotals();

    console.log('\n✅ Demo fixtures are ready.');
  } catch (error) {
    console.error(`\n❌ Failed to ensure demo fixtures: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
