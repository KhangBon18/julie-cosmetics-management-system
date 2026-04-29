# 🔧 MASTER FIX PROMPT — JULIE COSMETICS · POST-AUDIT REMEDIATION

> **Mục đích:** Giao cho Agent thực thi tuần tự 8 fix từ báo cáo deployment (80.5/97 → ≥92/97).  
> **Thứ tự bắt buộc:** F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → Re-verify  
> **Quy tắc:** Sau mỗi fix, agent chạy lại lệnh verify ngay trong cùng bước. Nếu verify fail → dừng, báo cáo lỗi, không tiếp tục bước tiếp theo.

---

## PRE-FIX: Tạo backup trước khi bắt đầu

```bash
# Backup DB ngay trước khi sửa
cd "Julie Cosmetics"
bash database/backup.sh
echo "Backup done — kiểm tra database/backups/ có file mới"
ls -lht database/backups/ | head -5
```

---

## F1 — [CRITICAL] Gỡ password_hash khỏi /api/customers response

**Vấn đề:** Agent xác nhận `/api/customers` đang trả về `password_hash` trong JSON response — lộ credential hash của khách hàng ra client.

**File cần sửa:** `server/src/models/customerModel.js`

### F1-A: Sửa model — loại password_hash khỏi mọi SELECT

Mở `server/src/models/customerModel.js`. Tìm tất cả câu query SELECT trả thông tin customer và **thay thế `SELECT *` hoặc list field có `password_hash`** bằng safe DTO:

```javascript
// Thêm hằng số này ở đầu file, sau các require:
const CUSTOMER_SAFE_FIELDS = `
  id, full_name, email, phone, gender, date_of_birth,
  membership_tier, total_spent, point_balance,
  is_active, created_at, updated_at
`;

// Áp dụng vào tất cả hàm trả danh sách customer, ví dụ:
// TRƯỚC:
//   const [rows] = await pool.query('SELECT * FROM customers WHERE ...')
// SAU:
//   const [rows] = await pool.query(`SELECT ${CUSTOMER_SAFE_FIELDS} FROM customers WHERE ...`)
```

Thực hiện find-and-replace trong file:
```bash
# Kiểm tra các pattern SELECT hiện có trong customerModel
grep -n "SELECT\|password" server/src/models/customerModel.js
```

Sau khi xem output, sửa từng query SELECT để không bao gồm `password_hash`.

### F1-B: Kiểm tra controller có filter thêm không

```bash
grep -n "password" server/src/controllers/customerController.js
```

Nếu có, thêm delete operator hoặc dùng destructuring:
```javascript
// Trong controller, trước khi res.json():
const { password_hash, ...safeCustomer } = customer;
// Hoặc với array:
const safeList = customers.map(({ password_hash, ...rest }) => rest);
```

### F1-C: Verify

```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or d.get('data',{}).get('token',''))")

RESULT=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/customers)
echo "$RESULT" | python3 -c "
import sys, json
data = json.loads(sys.stdin.read())
items = data.get('data') or data.get('customers') or []
if isinstance(items, list) and items:
    first = items[0]
    exposed = [k for k in first if 'password' in k.lower() or 'hash' in k.lower()]
    if exposed:
        print('FAIL — fields exposed:', exposed)
    else:
        print('PASS — no password fields in response')
        print('Fields returned:', sorted(first.keys()))
else:
    print('WARNING — empty or unexpected response:', str(data)[:200])
"
```

**Expected:** `PASS — no password fields in response`

---

## F2 — [CRITICAL] Rotate JWT_SECRET cho production

**Vấn đề:** `JWT_SECRET` vẫn là giá trị mẫu yếu. Token hiện tại có thể bị giả mạo.

### F2-A: Tạo secret mới

```bash
# Tạo secret 64 bytes hex (128 ký tự)
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
echo "New JWT_SECRET (copy this): $NEW_SECRET"
```

### F2-B: Cập nhật server/.env

```bash
# Backup env trước
cp server/.env server/.env.bak.$(date +%Y%m%d)

# Thay thế JWT_SECRET trong server/.env
# Thay dòng JWT_SECRET=... bằng giá trị mới
sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$NEW_SECRET/" server/.env

# Verify đã thay đúng (chỉ in prefix để không lộ full secret)
grep "JWT_SECRET" server/.env | cut -c1-30
```

### F2-C: Invalidate toàn bộ refresh token hiện có

Vì đổi JWT_SECRET, tất cả access token cũ sẽ tự invalid. Cần xóa refresh tokens cũ:

```bash
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "DELETE FROM refresh_tokens; SELECT ROW_COUNT() AS deleted_refresh_tokens;" 2>/dev/null
```

### F2-D: Restart server container để load secret mới

```bash
docker compose restart server
sleep 5
docker compose ps server
```

### F2-E: Cập nhật docker-compose.yml để dùng env file (production)

Trong `docker-compose.yml`, thêm `env_file` cho service server:
```yaml
# Trong service 'server', thêm:
  server:
    env_file:
      - server/.env
    environment:
      # giữ các override cần thiết...
      DB_HOST: mysql
      NODE_ENV: production
```

### F2-F: Verify

```bash
# Login phải thành công với secret mới
curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print('PASS' if d.get('token') or d.get('data',{}).get('token') else 'FAIL', str(d)[:100])"

# Token cũ không được dùng được (nếu có lưu token cũ ở đây, test với nó)
echo "Verify: old tokens are now invalid (JWT_SECRET changed)"
```

---

## F3 — [HIGH] Cấu hình HTTPS + Nginx reverse proxy

**Vấn đề:** Chưa có TLS. Data truyền qua HTTP plain text.

### F3-A: Tạo file nginx.conf

Tạo file `nginx/nginx.conf`:
```bash
mkdir -p nginx
cat > nginx/nginx.conf << 'EOF'
events { worker_connections 1024; }

http {
  upstream api_backend {
    server server:5001;
  }

  upstream client_frontend {
    server client:5173;
  }

  # Redirect HTTP -> HTTPS
  server {
    listen 80;
    server_name _;
    return 301 https://$host$request_uri;
  }

  # HTTPS server
  server {
    listen 443 ssl http2;
    server_name _;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    # API proxy
    location /api/ {
      proxy_pass http://api_backend/api/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads proxy
    location /uploads/ {
      proxy_pass http://api_backend/uploads/;
    }

    # Frontend
    location / {
      proxy_pass http://client_frontend/;
      proxy_set_header Host $host;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }
  }
}
EOF
echo "nginx.conf created"
```

### F3-B: Thêm nginx service vào docker-compose.yml

Thêm service sau `client:` trong `docker-compose.yml`:
```yaml
  nginx:
    image: nginx:alpine
    container_name: julie_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/certs:/etc/nginx/certs:ro
    depends_on:
      - server
      - client
```

### F3-C: Cert cho local dev (self-signed) hoặc production (Let's Encrypt)

**Option A — Local/Demo (self-signed):**
```bash
mkdir -p nginx/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/certs/privkey.pem \
  -out nginx/certs/fullchain.pem \
  -subj "/CN=julie-cosmetics-local" 2>/dev/null
echo "Self-signed cert created"
ls -la nginx/certs/
```

**Option B — Production (Let's Encrypt với Certbot):**
```bash
# Chạy sau khi domain đã trỏ về server
# certbot certonly --standalone -d yourdomain.com
# cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/certs/
# cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/certs/
echo "Sử dụng Let's Encrypt khi deploy production thực tế"
```

### F3-D: Restart với nginx

```bash
docker compose up -d nginx
sleep 3
docker compose ps nginx
```

### F3-E: Verify

```bash
# HTTP phải redirect
curl -s -o /dev/null -w "%{http_code} → %{redirect_url}" http://localhost/

# HTTPS phải pass (self-signed dùng -k)
curl -sk -o /dev/null -w "%{http_code}" https://localhost/api/settings/public 2>/dev/null || \
curl -sk -o /dev/null -w "%{http_code}" https://localhost/api/public/categories
echo " ← HTTPS API status"
```

**Expected:** `301` redirect + `200` trên HTTPS

---

## F4 — [HIGH] Đổi database credentials và tách demo accounts

**Vấn đề:** `julie_demo_123` còn là password production. Demo reset script phải không thể chạy trên prod.

### F4-A: Đổi password julie_app trong MySQL

```bash
# Tạo password mới mạnh
NEW_DB_PASS=$(node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))")
echo "New DB password (save this): $NEW_DB_PASS"

# Đổi password trong MySQL
docker exec julie_mysql mysql -u root -proot julie_cosmetics \
  -e "ALTER USER 'julie_app'@'%' IDENTIFIED BY '$NEW_DB_PASS'; FLUSH PRIVILEGES;" 2>/dev/null

# Cập nhật trong .env và server/.env
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASS/" .env
sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=$NEW_DB_PASS/" server/.env

echo "DB password updated in env files"
```

### F4-B: Đổi MySQL root password

```bash
NEW_ROOT_PASS=$(node -e "console.log(require('crypto').randomBytes(20).toString('base64url'))")
echo "New root password (save this): $NEW_ROOT_PASS"

docker exec julie_mysql mysql -u root -proot \
  -e "ALTER USER 'root'@'%' IDENTIFIED BY '$NEW_ROOT_PASS'; FLUSH PRIVILEGES;" 2>/dev/null

sed -i "s/^MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$NEW_ROOT_PASS/" .env
echo "Root password updated"
```

### F4-C: Thêm guard cho demo scripts trên production

Thêm check vào đầu `server/scripts/resetDemoUsers.js`:
```javascript
// Thêm ở đầu file, sau require statements:
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_RESET) {
  console.error('ERROR: resetDemoUsers is blocked on NODE_ENV=production.');
  console.error('Set ALLOW_DEMO_RESET=1 explicitly to override (demo envs only).');
  process.exit(1);
}
```

Tương tự cho `server/seed-demo.js`:
```javascript
// Thêm ở đầu file:
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEMO_SEED) {
  console.error('ERROR: seed-demo is blocked in production. Use ALLOW_DEMO_SEED=1 to force.');
  process.exit(1);
}
```

### F4-D: Restart server với credentials mới

```bash
docker compose restart server
sleep 5

# Verify kết nối DB vẫn hoạt động
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or d.get('data',{}).get('token',''))")
echo "Login after cred change: ${TOKEN:0:20}..."
[ -n "$TOKEN" ] && echo "PASS" || echo "FAIL — server cannot connect to DB"
```

---

## F5 — [MEDIUM] Dọn RBAC: xóa role garbled/legacy và role 0 permission

**Vấn đề:** Còn role có tên garbled (encoding lỗi) và 1 role có 0 permission.

### F5-A: Xem danh sách roles hiện tại

```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or d.get('data',{}).get('token',''))")

# Xem qua API
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/roles | \
  python3 -m json.tool

# Xem trực tiếp DB
docker exec julie_mysql mysql -u julie_app -p"$(grep DB_PASSWORD server/.env | cut -d= -f2)" julie_cosmetics \
  -e "SELECT r.id, r.name, COUNT(rp.permission_id) AS perm_count 
      FROM roles r 
      LEFT JOIN role_permissions rp ON r.id=rp.role_id 
      GROUP BY r.id, r.name 
      ORDER BY r.id;" 2>/dev/null
```

### F5-B: Tạo migration file để dọn roles

Tạo file `database/migrations/036_cleanup_rbac_roles.sql`:
```sql
-- Migration 036: dọn role garbled/legacy và role 0 permission
-- Chạy sau khi xác nhận ID các role cần xóa từ bước F5-A

-- Xóa role_permissions của role garbled (thay ID thật vào đây)
-- DELETE FROM role_permissions WHERE role_id IN (/* garbled role IDs */);

-- Xóa role garbled
-- DELETE FROM roles WHERE name REGEXP '[^\\x00-\\x7F]' 
--   AND id NOT IN (1,2,3,4,5); -- giữ các role lõi

-- Với role 0 permission (không phải role lõi): xem có user nào đang dùng không
SELECT r.id, r.name, COUNT(u.id) as user_count
FROM roles r
LEFT JOIN users u ON u.role_id = r.id
WHERE r.id NOT IN (
  SELECT DISTINCT role_id FROM role_permissions
)
GROUP BY r.id, r.name;

-- Nếu user_count = 0 và không phải role lõi: an toàn để xóa
-- DELETE FROM roles WHERE id = /* 0-permission role ID */;
```

```bash
# Chạy script xem tác động rồi quyết định
docker exec -i julie_mysql mysql -u julie_app -p"$(grep DB_PASSWORD server/.env | cut -d= -f2)" julie_cosmetics \
  < database/migrations/036_cleanup_rbac_roles.sql 2>/dev/null
```

### F5-C: Sau khi dọn, sync lại RBAC

```bash
cd server
node scripts/sync-rbac.js
node scripts/demo-smoke.js 2>&1 | grep -E "PASS|FAIL"
```

---

## F6 — [MEDIUM] Seed data cho Returns, Promotions và fix invoice status

**Vấn đề:** Returns/Promotions không có demo data; invoice demo dùng `confirmed` thay vì `pending`.

### F6-A: Tạo migration seed cho Returns demo

Tạo file `database/migrations/037_seed_demo_returns.sql`:
```sql
-- Tạo return demo từ invoice đã tồn tại
-- Chú ý: thay invoice_id thật từ DB của bạn

INSERT IGNORE INTO returns (invoice_id, reason, status, total_refund, created_by, created_at)
SELECT 
  i.id,
  'Sản phẩm bị lỗi — demo return',
  'pending',
  i.total_amount * 0.5,
  1,
  NOW()
FROM invoices i
WHERE i.status = 'confirmed'
LIMIT 2;

-- Thêm return items
INSERT IGNORE INTO return_items (return_id, product_id, quantity, unit_price, reason)
SELECT 
  r.id,
  ii.product_id,
  1,
  ii.unit_price,
  'Lỗi sản phẩm — demo'
FROM returns r
JOIN invoices inv ON r.invoice_id = inv.id
JOIN invoice_items ii ON ii.invoice_id = inv.id
LIMIT 3;
```

### F6-B: Tạo migration seed cho Promotions demo

Tạo file `database/migrations/038_seed_demo_promotions.sql`:
```sql
-- Seed promotions demo
INSERT IGNORE INTO promotions (name, description, discount_type, discount_value, 
  min_order_value, start_date, end_date, is_active, created_at)
VALUES
  ('WELCOME10', 'Giảm 10% cho đơn hàng đầu tiên', 'percentage', 10.00, 
   100000, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 1, NOW()),
  ('SALE50K', 'Giảm 50,000đ cho đơn từ 500,000đ', 'fixed_amount', 50000.00, 
   500000, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 14 DAY), 1, NOW()),
  ('MEMBER20', 'Thành viên VIP giảm 20%', 'percentage', 20.00, 
   200000, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 60 DAY), 1, NOW());
```

### F6-C: Fix invoice pending fixture

Mở `server/scripts/ensureDemoFixtures.js`. Tìm đoạn tạo invoice demo và kiểm tra enum `status`:

```bash
grep -n "pending\|confirmed\|status" server/scripts/ensureDemoFixtures.js | head -20
```

Nếu status demo là `confirmed`, đổi thành `pending` (hoặc đúng enum mà system dùng):
```bash
# Tạo 1 invoice thật sự 'pending' nếu chưa có
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or d.get('data',{}).get('token',''))")

# Kiểm tra enum thật của cột status trong invoices
docker exec julie_mysql mysql -u julie_app -p"$(grep DB_PASSWORD server/.env | cut -d= -f2)" julie_cosmetics \
  -e "SHOW COLUMNS FROM invoices LIKE 'status';" 2>/dev/null
```

### F6-D: Apply migrations

```bash
DB_PASS=$(grep DB_PASSWORD server/.env | cut -d= -f2)

docker exec -i julie_mysql mysql -u julie_app -p"$DB_PASS" julie_cosmetics \
  < database/migrations/037_seed_demo_returns.sql 2>/dev/null
echo "Returns seed done"

docker exec -i julie_mysql mysql -u julie_app -p"$DB_PASS" julie_cosmetics \
  < database/migrations/038_seed_demo_promotions.sql 2>/dev/null
echo "Promotions seed done"
```

### F6-E: Verify

```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or d.get('data',{}).get('token',''))")

# Returns có data
RETURNS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5001/api/returns?limit=5")
echo "Returns count:" $(echo $RETURNS | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',d.get('returns',[]))))" 2>/dev/null)

# Promotions có data
PROMOS=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5001/api/promotions")
echo "Promotions count:" $(echo $PROMOS | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',d.get('promotions',[]))))" 2>/dev/null)
```

---

## F7 — [MEDIUM] Thêm migration state tracking

**Vấn đề:** Không có bảng theo dõi migration đã apply, gây rủi ro chạy lại hoặc bỏ sót.

### F7-A: Tạo bảng schema_migrations

Tạo file `database/migrations/000_create_schema_migrations.sql`:
```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  version     VARCHAR(255) NOT NULL UNIQUE,
  filename    VARCHAR(255) NOT NULL,
  applied_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  checksum    VARCHAR(64) NULL COMMENT 'SHA256 của file migration'
);

-- Seed các migration đã apply (dựa trên files hiện có)
INSERT IGNORE INTO schema_migrations (version, filename, applied_at)
SELECT 
  REGEXP_SUBSTR(f.name, '^[0-9]+') as version,
  f.name,
  NOW()
FROM (
  SELECT '001_fix_customer_password_hash.sql' AS name UNION ALL
  SELECT '002_fix_import_trigger.sql' UNION ALL
  SELECT '003_fix_dangerous_cascades.sql' UNION ALL
  SELECT '004_add_updated_at.sql' UNION ALL
  SELECT '005_add_soft_delete.sql' UNION ALL
  SELECT '006_add_indexes.sql' UNION ALL
  SELECT '007_add_invoice_status.sql' UNION ALL
  SELECT '008_create_audit_logs.sql' UNION ALL
  SELECT '009_create_inventory_movements.sql' UNION ALL
  SELECT '010_create_rbac_tables.sql' UNION ALL
  SELECT '011_create_product_images.sql' UNION ALL
  SELECT '012_create_promotions.sql' UNION ALL
  SELECT '013_create_notifications.sql' UNION ALL
  SELECT '014_create_settings.sql' UNION ALL
  SELECT '015_fix_returns_refund_logic.sql' UNION ALL
  SELECT '016_create_refresh_tokens.sql' UNION ALL
  SELECT '017_create_login_attempts.sql' UNION ALL
  SELECT '018_create_payment_transactions.sql' UNION ALL
  SELECT '019_create_shipping_and_addresses.sql' UNION ALL
  SELECT '020_create_returns.sql' UNION ALL
  SELECT '021_add_check_constraints.sql' UNION ALL
  SELECT '022_add_rbac_enhancements.sql' UNION ALL
  SELECT '023_fix_leave_request_logic.sql' UNION ALL
  SELECT '024_enforce_import_cost_source_of_truth.sql' UNION ALL
  SELECT '025_add_resignation_leave_type.sql' UNION ALL
  SELECT '026_enforce_unique_active_user_employee.sql' UNION ALL
  SELECT '027_ensure_return_item_refund_subtotal.sql' UNION ALL
  SELECT '028_fix_gender_enum_encoding.sql' UNION ALL
  SELECT '029_polish_demo_text_content.sql' UNION ALL
  SELECT '030_professionalize_demo_copy.sql' UNION ALL
  SELECT '031_fix_invoice_crm_status_accounting.sql' UNION ALL
  SELECT '032_create_salary_bonus_adjustments.sql' UNION ALL
  SELECT '033_add_supplier_products_mapping.sql' UNION ALL
  SELECT '034_create_attendance_module.sql' UNION ALL
  SELECT '035_harden_internal_rbac_and_role_bootstrap.sql'
) f;
```

### F7-B: Tạo migration runner script

Tạo `server/scripts/runMigrations.js`:
```javascript
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

const MIGRATIONS_DIR = path.join(__dirname, '../../database/migrations');

async function run() {
  // Đảm bảo bảng tracking tồn tại
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version VARCHAR(255) NOT NULL UNIQUE,
    filename VARCHAR(255) NOT NULL,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  const [applied] = await pool.query('SELECT version FROM schema_migrations');
  const appliedSet = new Set(applied.map(r => r.version));

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql') && /^\d+_/.test(f))
    .sort();

  let count = 0;
  for (const file of files) {
    if (appliedSet.has(file)) continue;
    console.log(`Applying: ${file}`);
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    try {
      await pool.query(sql);
      await pool.query(
        'INSERT INTO schema_migrations (version, filename) VALUES (?, ?)',
        [file, file]
      );
      count++;
      console.log(`  ✓ Done`);
    } catch (err) {
      console.error(`  ✗ Error:`, err.message);
      process.exit(1);
    }
  }
  console.log(`\nTotal new migrations applied: ${count}`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
```

Thêm vào `server/package.json` scripts:
```json
"migrate": "node scripts/runMigrations.js",
"migrate:status": "node -e \"const p=require('./src/config/db'); p.query('SELECT version,applied_at FROM schema_migrations ORDER BY id').then(([r])=>{r.forEach(row=>console.log(row.version,'@',row.applied_at));p.end();})\""
```

### F7-C: Verify

```bash
cd server && node scripts/runMigrations.js
echo "Migration status:"
docker exec julie_mysql mysql -u julie_app -p"$(grep DB_PASSWORD server/.env | cut -d= -f2)" julie_cosmetics \
  -e "SELECT COUNT(*) AS tracked_migrations FROM schema_migrations;" 2>/dev/null
```

---

## F8 — [LOW] ENV sync và backup cleanup

### F8-A: Sync NODE_ENV trong server/.env

```bash
# server/.env local nên để development, nhưng cần comment rõ
# docker-compose.yml đã override NODE_ENV=production cho container
grep "NODE_ENV" server/.env
grep "NODE_ENV" docker-compose.yml

# Thêm comment giải thích
sed -i 's/^NODE_ENV=development/NODE_ENV=development # Overridden to production in docker-compose/' server/.env
echo "NODE_ENV comment added"
```

### F8-B: Dọn backup folder

```bash
# Liệt kê tất cả file backup
ls -lh database/backups/

# Xóa file 0 byte
find database/backups/ -name "*.sql" -size 0 -delete
echo "Empty SQL files deleted"

# Xóa file .sql chưa nén (đã có bản .gz rồi)
find database/backups/ -name "*.sql" -not -name "*.gz" -size +0c | while read f; do
  # Kiểm tra có bản .gz tương ứng không trước khi xóa
  gz="${f}.gz"
  if [ -f "$gz" ]; then
    echo "Removing uncompressed: $f (has .gz)"
    rm "$f"
  else
    echo "Keeping: $f (no .gz found)"
  fi
done

echo "Backup cleanup done:"
ls -lh database/backups/
```

### F8-C: Cập nhật .gitignore để bảo vệ env files

```bash
# Đảm bảo .env production không bị commit
cat .gitignore | grep -E "\.env$|server/\.env" || \
  echo -e "\n# Production env files\nserver/.env\nclient/.env\n.env" >> .gitignore
echo ".gitignore updated"
```

---

## FINAL: Re-verify toàn bộ sau khi fix

```bash
echo "=== FINAL VERIFICATION ==="
echo ""

TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token') or d.get('data',{}).get('token',''))" 2>/dev/null)

# F1 verify
echo -n "[F1] password_hash NOT in /api/customers: "
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/customers | \
  python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('customers',[])); f=items[0] if items else {}; print('PASS' if not any('password' in k.lower() for k in f) else 'FAIL')" 2>/dev/null

# F2 verify  
echo -n "[F2] JWT login works with new secret: "
[ -n "$TOKEN" ] && echo "PASS" || echo "FAIL"

# F3 verify
echo -n "[F3] HTTPS accessible: "
curl -sk -o /dev/null -w "%{http_code}" https://localhost/api/public/categories 2>/dev/null | \
  python3 -c "import sys; code=sys.stdin.read(); print('PASS' if code in ['200','301'] else 'FAIL ('+code+')')"

# F5 verify
echo -n "[F5] RBAC clean (no 0-permission roles): "
docker exec julie_mysql mysql -u julie_app -p"$(grep DB_PASSWORD server/.env | cut -d= -f2)" julie_cosmetics \
  -e "SELECT COUNT(*) AS zero_perm FROM roles r LEFT JOIN role_permissions rp ON r.id=rp.role_id WHERE rp.role_id IS NULL;" 2>/dev/null | tail -1 | \
  python3 -c "import sys; n=sys.stdin.read().strip(); print('PASS' if n=='0' else 'WARN ('+n+' roles still have 0 perms)')"

# F6 verify
echo -n "[F6] Promotions seeded: "
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/promotions | \
  python3 -c "import sys,json; d=json.load(sys.stdin); items=d.get('data',d.get('promotions',[])); print('PASS ('+str(len(items))+' promos)' if items else 'FAIL')" 2>/dev/null

# F7 verify
echo -n "[F7] Migration tracking active: "
docker exec julie_mysql mysql -u julie_app -p"$(grep DB_PASSWORD server/.env | cut -d= -f2)" julie_cosmetics \
  -e "SELECT COUNT(*) FROM schema_migrations;" 2>/dev/null | tail -1 | \
  python3 -c "import sys; n=sys.stdin.read().strip(); print('PASS ('+n+' migrations tracked)' if int(n)>30 else 'FAIL')" 2>/dev/null

# Final smoke test
echo ""
echo "=== RUNNING FULL SMOKE TEST ==="
cd server && node scripts/demo-smoke.js 2>&1 | grep -E "PASS|FAIL|ERROR"

echo ""
echo "=== DEPLOYMENT VERDICT ==="
echo "Nếu tất cả F1-F7 là PASS → RE-RUN master audit prompt để tính điểm chính thức"
echo "Target: ≥ 92/97, 0 CRITICAL → GO-LIVE APPROVED"
```

---

## POST-FIX CHECKLIST (chạy ngay trước go-live)

```bash
# 1. Reset demo users về trạng thái sạch
cd server && node scripts/resetDemoUsers.js

# 2. Ensure fixtures đầy đủ
node scripts/ensureDemoFixtures.js

# 3. Final smoke
node scripts/demo-smoke.js

# 4. Backup cuối trước go-live
cd .. && bash database/backup.sh
echo "Go-live backup created:"
ls -lht database/backups/ | head -3
```

---

## PRODUCTION CHECKLIST (ngoài scope code, cần làm thủ công)

```
□ Đổi CLIENT_URL trong .env sang domain production thật (ví dụ: https://julie.yourdomain.com)
□ Cấu hình cron job backup tự động: 0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
□ Setup monitoring/alerting (uptime robot, Grafana, hoặc đơn giản là health check ping)
□ Cấu hình log retention (docker logging driver với max-size và max-file)
□ Review lại demo accounts: admin/manager01/staff01/sales01/warehouse01 — cân nhắc đổi password hoặc disable trên production
□ Cập nhật InnoDB buffer pool cho production: set innodb_buffer_pool_size = 512M (hoặc 1G nếu RAM đủ)
□ Đảm bảo firewall chỉ mở port 80/443 ra ngoài (3307/5001 chỉ internal)
□ Test restore từ backup một lần trước go-live
□ Document lại tất cả credentials mới vào password manager bảo mật
```

---

*Fix prompt version: 1.0 | Từ báo cáo: 2026-04-27 | Score mục tiêu: ≥92/97*