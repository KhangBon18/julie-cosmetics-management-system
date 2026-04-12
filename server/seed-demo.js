/**
 * Seed demo data: invoices, import receipts, and reviews
 * Run: cd server && node seed-demo.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), override: true });
const mysql = require('mysql2/promise');
const { calculateLoyaltyPoints } = require('./src/utils/crmRules');
const { logInventoryMovement } = require('./src/utils/inventoryLogger');

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const forceSeed = process.env.SEED_DEMO_FORCE === '1' || process.argv.includes('--force');

function castSettingValue(value, dataType) {
  switch (dataType) {
    case 'number':
      return Number(value);
    case 'boolean':
      return value === 'true' || value === '1';
    case 'json':
      try { return JSON.parse(value); }
      catch { return value; }
    default:
      return value;
  }
}

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'julie_cosmetics',
    waitForConnections: true
  });

  let conn;

  try {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      try {
        conn = await pool.getConnection();
        break;
      } catch (error) {
        if (attempt === 10) throw error;
        console.log(`⏳ Waiting for database... (${attempt}/10)`);
        await wait(3000);
      }
    }

    console.log('🌱 Seeding demo data...\n');

    const [settingRows] = await conn.query(
      'SELECT setting_key, setting_value, data_type FROM settings WHERE category = ?',
      ['crm']
    );
    const crmSettings = {};
    for (const row of settingRows) {
      crmSettings[row.setting_key] = castSettingValue(row.setting_value, row.data_type);
    }

    const [existingCounts] = await conn.query(`
      SELECT
        (SELECT COUNT(*) FROM invoices) AS invoice_count,
        (SELECT COUNT(*) FROM import_receipts) AS import_count,
        (SELECT COUNT(*) FROM reviews) AS review_count
    `);

    const alreadySeeded = (existingCounts[0]?.invoice_count || 0) > 0
      && (existingCounts[0]?.import_count || 0) > 0
      && (existingCounts[0]?.review_count || 0) > 0;

    if (alreadySeeded && !forceSeed) {
      console.log('ℹ️ Demo data already exists. Skip seeding. Use --force to reseed.');
      return;
    }

    // Get products with stock
    const [products] = await conn.query(
      'SELECT product_id, product_name, sell_price, import_price, stock_quantity FROM products WHERE is_active = 1 AND stock_quantity > 5 ORDER BY RAND() LIMIT 30'
    );
    // Get customers
    const [customers] = await conn.query('SELECT customer_id, membership_tier FROM customers LIMIT 8');
    // Get suppliers
    const [suppliers] = await conn.query('SELECT supplier_id FROM suppliers LIMIT 3');

    console.log(`📦 Products: ${products.length}, 👥 Customers: ${customers.length}, 🚚 Suppliers: ${suppliers.length}\n`);

    // ══════════════════════════════════════════════
    // 1. SEED IMPORT RECEIPTS (Jan-Mar 2026)
    // ══════════════════════════════════════════════
    console.log('📥 Creating import receipts...');
    const importMonths = [
      { month: '2026-01-05', note: 'Nhập hàng đầu năm' },
      { month: '2026-01-20', note: 'Bổ sung hàng Tết' },
      { month: '2026-02-10', note: 'Nhập hàng tháng 2' },
      { month: '2026-03-01', note: 'Nhập hàng tháng 3' },
      { month: '2026-03-15', note: 'Bổ sung tồn kho' },
    ];

    for (const imp of importMonths) {
      const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
      const itemCount = 3 + Math.floor(Math.random() * 4); // 3-6 items
      const items = [];
      let totalAmount = 0;

      const shuffled = [...products].sort(() => Math.random() - 0.5).slice(0, itemCount);
      for (const p of shuffled) {
        const qty = 10 + Math.floor(Math.random() * 40); // 10-50
        const price = parseFloat(p.import_price) || 50000;
        items.push({ product_id: p.product_id, quantity: qty, unit_price: price });
        totalAmount += qty * price;
      }

      // Insert receipt (bypass trigger by using direct stock update later)
      const [result] = await conn.query(
        `INSERT INTO import_receipts (supplier_id, created_by, total_amount, note, created_at) VALUES (?, 1, ?, ?, ?)`,
        [supplier.supplier_id, totalAmount, imp.note, imp.month + ' 10:00:00']
      );
      const receiptId = result.insertId;

      for (const item of items) {
        await logInventoryMovement(conn, {
          productId: item.product_id,
          movementType: 'import',
          quantity: item.quantity,
          referenceType: 'import_receipt',
          referenceId: receiptId,
          unitCost: item.unit_price,
          createdBy: 1
        });

        await conn.query(
          'INSERT INTO import_receipt_items (receipt_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [receiptId, item.product_id, item.quantity, item.unit_price]
        );
        // Trigger handles stock update
      }
      console.log(`  ✅ Import #${receiptId} — ${items.length} items, ${new Intl.NumberFormat('vi-VN').format(totalAmount)}đ (${imp.month})`);
    }

    // ══════════════════════════════════════════════
    // 2. SEED INVOICES (Jan-Mar 2026)
    // ══════════════════════════════════════════════
    console.log('\n🧾 Creating invoices...');
    const invoiceDates = [
      // January
      '2026-01-08 09:30:00', '2026-01-12 14:15:00', '2026-01-18 11:00:00', '2026-01-22 16:45:00', '2026-01-28 10:20:00',
      // February
      '2026-02-03 09:00:00', '2026-02-08 13:30:00', '2026-02-14 10:00:00', '2026-02-19 15:00:00', '2026-02-25 11:30:00',
      // March
      '2026-03-02 09:45:00', '2026-03-05 14:00:00', '2026-03-10 11:15:00', '2026-03-15 16:30:00', '2026-03-20 10:00:00',
      '2026-03-22 13:00:00', '2026-03-25 09:30:00', '2026-03-27 15:45:00',
    ];
    const payMethods = ['cash', 'card', 'transfer'];

    // Re-fetch stock after imports
    const [freshProducts] = await conn.query(
      'SELECT product_id, product_name, sell_price, import_price, stock_quantity FROM products WHERE is_active = 1 AND stock_quantity > 3 ORDER BY RAND() LIMIT 30'
    );

    for (const dateStr of invoiceDates) {
      const customer = Math.random() > 0.2 ? customers[Math.floor(Math.random() * customers.length)] : null;
      const itemCount = 1 + Math.floor(Math.random() * 3); // 1-3 items
      const shuffled = [...freshProducts].sort(() => Math.random() - 0.5).slice(0, itemCount);

      // Check stock
      const items = [];
      for (const p of shuffled) {
        const [stockCheck] = await conn.query('SELECT stock_quantity FROM products WHERE product_id = ?', [p.product_id]);
        const available = stockCheck[0]?.stock_quantity || 0;
        if (available < 1) continue;
        const qty = Math.min(1 + Math.floor(Math.random() * 2), available); // 1-2
        items.push({
          product_id: p.product_id,
          product_name: p.product_name,
          quantity: qty,
          unit_price: parseFloat(p.sell_price),
          unit_cost: parseFloat(p.import_price) || 0
        });
      }
      if (items.length === 0) continue;

      let subtotal = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
      let discountPct = 0;
      if (customer) {
        if (customer.membership_tier === 'gold') discountPct = 5;
        else if (customer.membership_tier === 'silver') discountPct = 2;
      }
      const discountAmount = Math.round(subtotal * discountPct / 100);
      const finalTotal = subtotal - discountAmount;
      const pointsEarned = customer ? calculateLoyaltyPoints(finalTotal, crmSettings) : 0;
      const payMethod = payMethods[Math.floor(Math.random() * payMethods.length)];

      const [invResult] = await conn.query(
        `INSERT INTO invoices (customer_id, created_by, subtotal, discount_percent, discount_amount, final_total, points_earned, payment_method, created_at)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?)`,
        [customer?.customer_id || null, subtotal, discountPct, discountAmount, finalTotal, pointsEarned, payMethod, dateStr]
      );
      const invoiceId = invResult.insertId;

      for (const item of items) {
        await logInventoryMovement(conn, {
          productId: item.product_id,
          movementType: 'sale',
          quantity: -item.quantity,
          referenceType: 'invoice',
          referenceId: invoiceId,
          unitCost: item.unit_cost,
          createdBy: 1
        });

        await conn.query(
          'INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [invoiceId, item.product_id, item.quantity, item.unit_price, item.unit_price * item.quantity]
        );
        // Trigger handles stock deduction
      }

      console.log(`  ✅ Invoice #${invoiceId} — ${items.length} items, ${new Intl.NumberFormat('vi-VN').format(finalTotal)}đ (${dateStr.split(' ')[0]})`);
    }

    // ══════════════════════════════════════════════
    // 3. SEED REVIEWS
    // ══════════════════════════════════════════════
    console.log('\n⭐ Creating reviews...');
    const reviewComments = [
      'Sản phẩm rất tốt, da mình mịn hẳn sau 2 tuần sử dụng!',
      'Mùi hương dễ chịu, thấm nhanh, không nhớt.',
      'Đã mua lần 3 rồi, rất hài lòng.',
      'Giao hàng nhanh, đóng gói cẩn thận.',
      'Chất lượng tuyệt vời, xứng đáng với giá tiền.',
      'Sản phẩm okay, nhưng hơi đắt.',
      'Dùng rất phù hợp với da dầu, cảm ơn shop!',
      'Lần đầu thử, thấy khá ổn. Sẽ mua thêm.',
      'Da mình nhạy cảm nhưng dùng không bị kích ứng.',
      'Son lên màu chuẩn, giữ màu lâu, mua nữa!',
      'Kem chống nắng dùng rất thích, không trôi.',
      'Sản phẩm chính hãng, yên tâm dùng.',
    ];

    const reviewProducts = [...freshProducts].sort(() => Math.random() - 0.5).slice(0, 12);
    const usedPairs = new Set();

    for (let i = 0; i < reviewProducts.length; i++) {
      const p = reviewProducts[i];
      const custIdx = i % customers.length;
      const c = customers[custIdx];
      const pairKey = `${c.customer_id}-${p.product_id}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      const rating = 3 + Math.floor(Math.random() * 3); // 3-5
      const comment = reviewComments[i % reviewComments.length];

      await conn.query(
        'INSERT INTO reviews (product_id, customer_id, rating, comment, is_visible, created_at) VALUES (?, ?, ?, ?, 1, ?)',
        [p.product_id, c.customer_id, rating, comment, `2026-03-${String(10 + i).padStart(2, '0')} 12:00:00`]
      );
      console.log(`  ✅ Review: ${c.customer_id} → ${p.product_name.substring(0, 30)}... (${rating}⭐)`);
    }

    // ══════════════════════════════════════════════
    // 4. UPDATE CUSTOMER STATS (sync with invoices)
    // ══════════════════════════════════════════════
    console.log('\n📊 Updating customer stats...');
    const [custStats] = await conn.query(`
      SELECT customer_id, SUM(final_total) as total, SUM(points_earned) as pts, COUNT(*) as cnt
      FROM invoices WHERE customer_id IS NOT NULL GROUP BY customer_id
    `);
    for (const s of custStats) {
      const total = parseFloat(s.total) || 0;
      const pts = s.pts || 0;
      const tier = pts >= 500 ? 'gold' : pts >= 100 ? 'silver' : 'standard';
      await conn.query(
        'UPDATE customers SET total_spent = ?, total_points = ?, membership_tier = ? WHERE customer_id = ?',
        [total, pts, tier, s.customer_id]
      );
    }
    console.log(`  ✅ Updated ${custStats.length} customers\n`);

    // Summary
    const [invCount] = await conn.query('SELECT COUNT(*) as cnt FROM invoices');
    const [impCount] = await conn.query('SELECT COUNT(*) as cnt FROM import_receipts');
    const [revCount] = await conn.query('SELECT COUNT(*) as cnt FROM reviews');
    console.log('═══════════════════════════════════════');
    console.log(`📊 FINAL COUNTS:`);
    console.log(`   Invoices: ${invCount[0].cnt}`);
    console.log(`   Import Receipts: ${impCount[0].cnt}`);
    console.log(`   Reviews: ${revCount[0].cnt}`);
    console.log('═══════════════════════════════════════');
    console.log('✅ Demo data seeding complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

seed().catch(console.error);
