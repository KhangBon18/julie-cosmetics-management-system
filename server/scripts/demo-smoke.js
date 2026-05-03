const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const serverDir = path.join(__dirname, '..');
const projectRoot = path.join(serverDir, '..');

const loadEnv = (filePath) => {
  if (fs.existsSync(filePath)) {
    const dotenv = require('dotenv');
    Object.assign(process.env, dotenv.parse(fs.readFileSync(filePath)));
  }
};

loadEnv(path.join(projectRoot, '.env'));
loadEnv(path.join(serverDir, '.env'));

const { pool } = require('../src/config/db');

const port = process.env.CI_DEMO_SMOKE_PORT || '5011';
const now = new Date();
const currentMonth = now.getMonth() + 1;
const currentYear = now.getFullYear();

const DEMO_FLOWS = [
  {
    label: 'admin',
    username: 'admin',
    password: 'admin123',
    checks: [
      ['/api/users?page=1&limit=1', 'Danh sách tài khoản'],
      ['/api/roles', 'Nhóm quyền'],
      ['/api/suppliers/1/product-mappings', 'Mapping NCC - sản phẩm'],
      ['/api/reports/profit?group_by=month&year=2026', 'Báo cáo lợi nhuận']
    ]
  },
  {
    label: 'manager/hr',
    username: 'manager01',
    password: 'manager123',
    checks: [
      ['/api/employees?page=1&limit=1', 'Danh sách nhân sự'],
      ['/api/leaves?page=1&limit=1', 'Duyệt nghỉ phép'],
      [`/api/salaries/bonuses?month=${currentMonth}&year=${currentYear}`, 'Thưởng kỳ lương hiện tại'],
      ['/api/reports/hr?year=2026', 'Báo cáo nhân sự'],
      ['/api/payments?page=1&limit=1', 'Giao dịch thanh toán'],
      ['/api/shipping?page=1&limit=1', 'Đơn giao hàng'],
      ['/api/returns?page=1&limit=1', 'Yêu cầu đổi trả']
    ],
    deniedChecks: [
      ['/api/products?page=1&limit=1', 'Không được truy cập khu kho nếu chưa được cấp quyền'],
      ['/api/users?page=1&limit=1', 'Không được truy cập quản trị tài khoản']
    ]
  },
  {
    label: 'staff/self-service',
    username: 'staff01',
    password: 'staff123',
    checks: [
      ['/api/staff/profile', 'Hồ sơ cá nhân'],
      ['/api/staff/leaves?page=1&limit=1', 'Đơn nghỉ cá nhân'],
      ['/api/staff/salaries?page=1&limit=1', 'Bảng lương cá nhân'],
      ['/api/staff/salary-formula', 'Cách tính lương']
    ],
    deniedChecks: [
      ['/api/invoices?page=1&limit=1', 'Không được truy cập khu bán hàng nội bộ'],
      ['/api/customers?page=1&limit=1', 'Không được truy cập dữ liệu khách hàng nội bộ'],
      ['/api/payments?page=1&limit=1', 'Không được truy cập giao dịch thanh toán nội bộ'],
      ['/api/shipping?page=1&limit=1', 'Không được truy cập đơn giao hàng nội bộ'],
      ['/api/returns?page=1&limit=1', 'Không được truy cập yêu cầu đổi trả nội bộ']
    ]
  },
  {
    label: 'sales/business',
    username: 'sales01',
    password: 'sales123',
    checks: [
      ['/api/invoices?page=1&limit=1', 'Danh sách hóa đơn'],
      ['/api/customers?page=1&limit=1', 'Danh sách khách hàng'],
      ['/api/products?page=1&limit=1', 'Danh sách sản phẩm để lập hóa đơn'],
      [`/api/reports/revenue?group_by=month&year=${currentYear}`, 'Báo cáo kinh doanh'],
      ['/api/shipping?page=1&limit=1', 'Theo dõi đơn giao hàng'],
      ['/api/returns?page=1&limit=1', 'Yêu cầu đổi trả'],
      ['/api/staff/profile', 'Hồ sơ cá nhân sales'],
      ['/api/staff/leaves?page=1&limit=1', 'Đơn nghỉ cá nhân sales'],
      ['/api/staff/salaries?page=1&limit=1', 'Bảng lương cá nhân sales'],
      ['/api/staff/salary-formula', 'Cách tính lương sales'],
      ['/api/staff/attendance/today', 'Chấm công hôm nay của sales']
    ],
    deniedChecks: [
      ['/api/employees?page=1&limit=1', 'Không được truy cập quản lý hồ sơ nhân sự'],
      ['/api/attendances?page=1&limit=1', 'Không được truy cập quản lý chấm công HR'],
      ['/api/salaries?page=1&limit=1', 'Không được truy cập quản lý bảng lương HR']
    ]
  },
  {
    label: 'warehouse',
    username: 'warehouse01',
    password: 'warehouse123',
    checks: [
      ['/api/products?page=1&limit=1', 'Danh sách sản phẩm'],
      ['/api/imports?page=1&limit=1', 'Phiếu nhập kho'],
      ['/api/reports/inventory?group_by=month&year=2026', 'Báo cáo kho']
    ]
  }
];

const server = spawn(process.execPath, ['server.js'], {
  cwd: serverDir,
  env: {
    ...process.env,
    NODE_ENV: 'test',
    PORT: port
  },
  stdio: ['ignore', 'pipe', 'pipe']
});

server.stdout.on('data', (chunk) => process.stdout.write(chunk));
server.stderr.on('data', (chunk) => process.stderr.write(chunk));

const stopServer = () => {
  if (server.exitCode === null && !server.killed) {
    server.kill('SIGTERM');
  }
};

process.on('exit', stopServer);
process.on('SIGINT', () => {
  stopServer();
  process.exit(1);
});
process.on('SIGTERM', () => {
  stopServer();
  process.exit(1);
});

async function waitForHealthyServer() {
  for (let attempt = 1; attempt <= 20; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Server exited early with code ${server.exitCode}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      const payload = await response.json();
      if (response.status === 200 && payload?.status === 'OK') {
        return;
      }
    } catch {
    }

    await delay(1000);
  }

  throw new Error('Health check failed: server did not become ready within 20 seconds');
}

async function loginAndGetToken({ username, password }) {
  const response = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.token) {
    throw new Error(`Login failed for ${username}: ${payload?.message || response.status}`);
  }

  return payload.token;
}

async function runChecks(flow) {
  const token = await loginAndGetToken(flow);
  console.log(`✅ Login OK: ${flow.label}`);

  for (const [endpoint, label] of flow.checks) {
    const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(`${flow.label} -> ${label} failed (${response.status}): ${payload?.message || endpoint}`);
    }

    console.log(`   ↳ ${label}: OK`);
  }

  for (const [endpoint, label] of flow.deniedChecks || []) {
    const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.status !== 403) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(`${flow.label} -> ${label} expected 403 but got ${response.status}: ${payload?.message || endpoint}`);
    }

    console.log(`   ↳ ${label}: OK (403)`);
  }
}

async function verifyPublicProductSearch() {
  const response = await fetch(`http://127.0.0.1:${port}/api/public/products?search=CeraVe&limit=12`);
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(`Public product search failed (${response.status}): ${payload?.message || 'unknown error'}`);
  }

  const products = payload?.products || [];
  if (!products.length) {
    throw new Error('Public product search for brand CeraVe returned no products');
  }

  if (Number(payload.total || 0) < products.length) {
    throw new Error(`Public product search total mismatch: total=${payload.total}, rows=${products.length}`);
  }

  console.log('✅ Public product search count: OK');
}

async function verifyLockedAttendanceWriteIsBlocked() {
  const token = await loginAndGetToken({
    username: 'staff01',
    password: 'staff123'
  });

  const response = await fetch(`http://127.0.0.1:${port}/api/staff/attendance/check-in`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ note: '[SMOKE] locked attendance write must be blocked' })
  });
  const payload = await response.json().catch(() => ({}));

  if (response.status !== 409 || !String(payload?.message || '').includes('đã chốt')) {
    throw new Error(`Locked attendance check-in expected 409 with lock message but got ${response.status}: ${payload?.message || 'empty response'}`);
  }

  console.log('✅ Locked attendance backend guard: OK (409)');
}

async function verifyDemoDataIntegrity() {
  const [[stockRows]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM products
     WHERE stock_quantity < 0`
  );
  if (Number(stockRows.total || 0) > 0) {
    throw new Error(`Negative stock products detected: ${stockRows.total}`);
  }

  const [[importRows]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM import_receipts ir
     JOIN (
       SELECT receipt_id, SUM(quantity * unit_price) AS line_total
       FROM import_receipt_items
       GROUP BY receipt_id
     ) totals ON totals.receipt_id = ir.receipt_id
     WHERE ABS(COALESCE(ir.total_amount, 0) - totals.line_total) > 0.009`
  );
  if (Number(importRows.total || 0) > 0) {
    throw new Error(`Import receipt header totals do not match line items: ${importRows.total}`);
  }

  const [[invoiceRows]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM invoices i
     JOIN (
       SELECT invoice_id, SUM(subtotal) AS line_subtotal
       FROM invoice_items
       GROUP BY invoice_id
     ) totals ON totals.invoice_id = i.invoice_id
     WHERE ABS(COALESCE(i.subtotal, 0) - totals.line_subtotal) > 0.009
        OR ABS(COALESCE(i.discount_amount, 0) - ROUND(totals.line_subtotal * COALESCE(i.discount_percent, 0) / 100)) > 0.009
        OR ABS(
          COALESCE(i.final_total, 0)
          - GREATEST(0, totals.line_subtotal - ROUND(totals.line_subtotal * COALESCE(i.discount_percent, 0) / 100))
        ) > 0.009`
  );
  if (Number(invoiceRows.total || 0) > 0) {
    throw new Error(`Invoice header totals do not match line items: ${invoiceRows.total}`);
  }

  const [[permissionRows]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM roles r
     JOIN role_permissions rp ON rp.role_id = r.role_id
     JOIN permissions p ON p.permission_id = rp.permission_id
     WHERE r.role_name = 'manager'
       AND p.permission_name = 'salaries.export'`
  );
  if (Number(permissionRows.total || 0) < 1) {
    throw new Error('Manager role is missing salaries.export permission');
  }

  console.log('✅ Demo DB integrity checks: OK');
}

(async () => {
  let exitCode = 0;
  try {
    await waitForHealthyServer();
    console.log('🚦 Running demo smoke checks...\n');

    for (const flow of DEMO_FLOWS) {
      await runChecks(flow);
    }

    await verifyPublicProductSearch();
    await verifyLockedAttendanceWriteIsBlocked();
    await verifyDemoDataIntegrity();

    console.log('\n✅ Demo smoke passed for all core roles.');
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    exitCode = 1;
  } finally {
    stopServer();
    await pool.end().catch(() => {});
    process.exit(exitCode);
  }
})();
