const { spawn } = require('node:child_process');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');

const serverDir = path.join(__dirname, '..');
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
      ['/api/reports/hr?year=2026', 'Báo cáo nhân sự']
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
      ['/api/invoices?page=1&limit=1', 'Không được truy cập khu bán hàng nội bộ']
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
      [`/api/reports/revenue?group_by=month&year=${currentYear}`, 'Báo cáo kinh doanh']
    ],
    deniedChecks: [
      ['/api/staff/profile', 'Không được truy cập hồ sơ self-service'],
      ['/api/staff/leaves?page=1&limit=1', 'Không được truy cập đơn nghỉ self-service'],
      ['/api/staff/salaries?page=1&limit=1', 'Không được truy cập bảng lương self-service']
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

(async () => {
  try {
    await waitForHealthyServer();
    console.log('🚦 Running demo smoke checks...\n');

    for (const flow of DEMO_FLOWS) {
      await runChecks(flow);
    }

    console.log('\n✅ Demo smoke passed for all core roles.');
    stopServer();
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    stopServer();
    process.exit(1);
  }
})();
