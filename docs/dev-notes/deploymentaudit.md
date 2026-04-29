# 🚀 MASTER PROMPT — JULIE COSMETICS · DEPLOYMENT READINESS AUDIT

> **Mục đích:** Đây là prompt toàn diện để giao cho Agent thực hiện kiểm tra hệ thống trước khi đưa vào vận hành doanh nghiệp. Agent đọc từng mục theo thứ tự, thực thi từng lệnh kiểm tra, ghi lại kết quả (✅ PASS / ⚠️ WARN / ❌ FAIL), và tổng hợp báo cáo cuối.

---

## 📋 THÔNG TIN HỆ THỐNG (CONTEXT)

```
Project     : Julie Cosmetics — Hệ thống quản lý mỹ phẩm
Stack       : React 18 + Vite (FE) / Node.js + Express (BE) / MySQL 8 (DB)
Infra       : Docker Compose (4 services: mysql · server · client · demo_seed)
Auth        : JWT + Refresh Token · RBAC (Roles / Permissions) · Rate Limiting
Modules     : Storefront, Admin Dashboard, Sales, Inventory, HR, CRM, Reports, RBAC
Codebase    : /Julie Cosmetics/
Ports       : Client → 5173 | API → 5001 | MySQL host → 3307
DB user     : julie_app / julie_demo_123
Demo users  : admin/admin123 · manager01/manager123 · staff01/staff123
              sales01/sales123 · warehouse01/warehouse123
```

---

## 📌 QUY TRÌNH LÀM VIỆC CỦA AGENT

```
Đối với mỗi mục kiểm tra (A → I):
  1. Đọc mô tả mục tiêu
  2. Thực hiện các lệnh kiểm tra được liệt kê
  3. Ghi kết quả vào CHECKLIST theo định dạng:
       [✅ PASS | ⚠️ WARN | ❌ FAIL] <tên check> — <ghi chú ngắn>
  4. Nếu phát hiện vấn đề → ghi vào ISSUES LIST với mức độ:
       🔴 CRITICAL (chặn go-live) | 🟠 HIGH | 🟡 MEDIUM | 🟢 LOW
  5. Đề xuất fix cụ thể cho từng issue
  6. Cuối cùng: tổng hợp DEPLOYMENT VERDICT
```

---

## A. INFRASTRUCTURE & DOCKER

**Mục tiêu:** Đảm bảo 4 container khởi động đúng, mạng nội bộ hoạt động, volume được mount.

```bash
# A1 — Kiểm tra file Docker Compose tồn tại & hợp lệ
docker compose config --quiet && echo "VALID" || echo "INVALID"

# A2 — Liệt kê services được định nghĩa
docker compose config --services

# A3 — Kiểm tra images có build được không (dry-run)
docker compose build --dry-run 2>&1 | tail -20

# A4 — Khởi động tất cả services
docker compose up -d --build

# A5 — Kiểm tra tất cả container RUNNING (không phải Exited)
docker compose ps

# A6 — Kiểm tra healthcheck MySQL pass
docker inspect julie_mysql --format='{{.State.Health.Status}}'

# A7 — Kiểm tra logs không có ERROR nghiêm trọng
docker compose logs --tail=50 server | grep -i "error\|fatal\|crash" || echo "NO CRITICAL ERRORS"
docker compose logs --tail=50 mysql  | grep -i "error\|fatal"        || echo "NO CRITICAL ERRORS"

# A8 — Kiểm tra port binding
docker compose port mysql  3306
docker compose port server 5001
docker compose port client 5173

# A9 — Kiểm tra volume mysql_data tồn tại
docker volume ls | grep julie

# A10 — Kiểm tra ENV variables được inject vào server container
docker exec julie_server env | grep -E "DB_|JWT_|PORT|CLIENT_URL|NODE_ENV"
```

**Checklist A:**
- [ ] A1 — docker-compose.yml syntax hợp lệ
- [ ] A2 — Đủ 4 services: mysql, server, client, demo_seed
- [ ] A3 — Build không lỗi
- [ ] A4 — Tất cả container up
- [ ] A5 — Container status = running (không phải exited/restarting)
- [ ] A6 — MySQL healthcheck = healthy (sau ≤100s)
- [ ] A7 — Server & MySQL logs không có FATAL error
- [ ] A8 — Ports binding đúng: 5001, 5173, 3307
- [ ] A9 — Volume mysql_data tồn tại, data persistent
- [ ] A10 — ENV được inject đầy đủ vào container

---

## B. DATABASE & SCHEMA

**Mục tiêu:** Xác minh schema đúng, migrations đủ, indexes tối ưu, data integrity.

```bash
# B1 — Kết nối DB và kiểm tra tất cả tables
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SHOW TABLES;" 2>/dev/null

# B2 — Đếm số bảng (kỳ vọng ≥ 30 bảng)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema='julie_cosmetics';" 2>/dev/null

# B3 — Kiểm tra các bảng nghiệp vụ cốt lõi tồn tại
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT table_name FROM information_schema.tables 
      WHERE table_schema='julie_cosmetics' AND table_name IN (
        'users','employees','roles','permissions','role_permissions',
        'products','categories','brands','suppliers','supplier_products',
        'invoices','invoice_items','returns','return_items',
        'inventory_movements','imports','import_items',
        'customers','orders','payment_transactions',
        'salaries','salary_bonus_adjustments','leave_requests',
        'attendance_records','promotions','settings','audit_logs',
        'refresh_tokens','login_attempts','notifications'
      ) ORDER BY table_name;" 2>/dev/null

# B4 — Kiểm tra foreign key constraints
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME 
      FROM information_schema.REFERENTIAL_CONSTRAINTS 
      WHERE CONSTRAINT_SCHEMA='julie_cosmetics' 
      LIMIT 20;" 2>/dev/null

# B5 — Kiểm tra indexes (quan trọng cho performance)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT TABLE_NAME, INDEX_NAME, COLUMN_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA='julie_cosmetics' AND INDEX_NAME != 'PRIMARY' 
      ORDER BY TABLE_NAME, INDEX_NAME 
      LIMIT 40;" 2>/dev/null

# B6 — Kiểm tra demo data đã seed
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT 
        (SELECT COUNT(*) FROM users)      AS users,
        (SELECT COUNT(*) FROM products)   AS products,
        (SELECT COUNT(*) FROM customers)  AS customers,
        (SELECT COUNT(*) FROM invoices)   AS invoices,
        (SELECT COUNT(*) FROM employees)  AS employees;" 2>/dev/null

# B7 — Kiểm tra RBAC data (roles, permissions)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT r.name AS role, COUNT(rp.permission_id) AS perms 
      FROM roles r 
      LEFT JOIN role_permissions rp ON r.id=rp.role_id 
      GROUP BY r.id, r.name;" 2>/dev/null

# B8 — Kiểm tra backup scripts tồn tại và executable
ls -la database/backup.sh database/restore.sh

# B9 — Chạy thử backup
bash database/backup.sh 2>&1 | tail -5

# B10 — Kiểm tra không có orphan records (data integrity)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT COUNT(*) AS orphan_invoice_items 
      FROM invoice_items ii 
      LEFT JOIN invoices i ON ii.invoice_id=i.id 
      WHERE i.id IS NULL;" 2>/dev/null

# B11 — Kiểm tra migrations đã có (35+ migrations)
ls database/migrations/ | wc -l
ls database/migrations/ | sort
```

**Checklist B:**
- [ ] B1 — Kết nối DB thành công với julie_app user
- [ ] B2 — ≥ 30 bảng tồn tại
- [ ] B3 — Tất cả bảng nghiệp vụ cốt lõi đều có
- [ ] B4 — Foreign key constraints được enforce
- [ ] B5 — Indexes tồn tại trên các cột thường xuyên query
- [ ] B6 — Demo data đã seed: users, products, customers, invoices, employees
- [ ] B7 — RBAC: roles có permissions được gán
- [ ] B8 — Scripts backup/restore tồn tại
- [ ] B9 — Backup chạy thành công
- [ ] B10 — Không có orphan records
- [ ] B11 — ≥ 35 migration files

---

## C. BACKEND API

**Mục tiêu:** Kiểm tra server khởi động, authentication, authorization, API endpoints chính.

```bash
# C1 — Kiểm tra server health
curl -s http://localhost:5001/health | python3 -m json.tool 2>/dev/null || \
curl -s http://localhost:5001/api/settings/public | python3 -m json.tool

# C2 — Login admin → lấy JWT token
ADMIN_RESP=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo $ADMIN_RESP | python3 -m json.tool
TOKEN=$(echo $ADMIN_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
echo "TOKEN: ${TOKEN:0:50}..."

# C3 — Kiểm tra protected route (phải có token)
curl -s http://localhost:5001/api/users | python3 -m json.tool

# C4 — Kiểm tra với token hợp lệ
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/users | python3 -m json.tool | head -20

# C5 — Test tất cả module endpoints
for ENDPOINT in products categories brands suppliers employees invoices returns imports customers promotions roles settings; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:5001/api/$ENDPOINT)
  echo "[$STATUS] /api/$ENDPOINT"
done

# C6 — Test role-based access: staff không được xem users
STAFF_RESP=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"staff01","password":"staff123"}')
STAFF_TOKEN=$(echo $STAFF_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)
curl -s -H "Authorization: Bearer $STAFF_TOKEN" \
  http://localhost:5001/api/users | python3 -m json.tool

# C7 — Test rate limiting (nhiều request liên tiếp)
for i in {1..15}; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"wrong","password":"wrong"}')
  echo "Attempt $i: $STATUS"
done

# C8 — Kiểm tra security headers (Helmet)
curl -I http://localhost:5001/api/settings/public 2>/dev/null | \
  grep -i "x-content-type\|x-frame\|strict-transport\|x-xss\|content-security"

# C9 — Test CORS (từ origin không được phép)
curl -s -H "Origin: http://evil.com" -I http://localhost:5001/api/settings/public 2>/dev/null | \
  grep -i "access-control"

# C10 — Kiểm tra validation (inject bad data)
curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<script>alert(1)</script>","password":"x"}' | python3 -m json.tool

# C11 — Test upload endpoint
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/products | python3 -m json.tool | head -30

# C12 — Kiểm tra refresh token flow
REFRESH_TOKEN=$(echo $ADMIN_RESP | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['refreshToken'])" 2>/dev/null)
curl -s -X POST http://localhost:5001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | python3 -m json.tool

# C13 — Test logout / token invalidation
curl -s -X POST http://localhost:5001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | python3 -m json.tool
```

**Checklist C:**
- [ ] C1 — Server health check trả về 200
- [ ] C2 — Login admin thành công, có JWT token
- [ ] C3 — Protected route trả về 401 khi không có token
- [ ] C4 — Token hợp lệ → truy cập được protected route
- [ ] C5 — Tất cả module endpoints trả về 200/403 (không phải 500)
- [ ] C6 — RBAC hoạt động: staff bị từ chối truy cập admin routes
- [ ] C7 — Rate limiting kích hoạt sau ~10 lần thử sai (429)
- [ ] C8 — Helmet headers tồn tại (X-Content-Type, X-Frame-Options...)
- [ ] C9 — CORS từ chối origin lạ
- [ ] C10 — Validation sanitize input, không crash server
- [ ] C11 — Product listing API trả về đúng data structure
- [ ] C12 — Refresh token flow hoạt động
- [ ] C13 — Logout invalidate token

---

## D. FRONTEND (CLIENT)

**Mục tiêu:** Kiểm tra build production, routing, assets, responsive design.

```bash
# D1 — Kiểm tra build dist tồn tại
ls -la client/dist/
ls client/dist/assets/ | head -20

# D2 — Kiểm tra index.html của dist
cat client/dist/index.html

# D3 — Kiểm tra trang chủ load được
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/

# D4 — Kiểm tra static assets
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/julie-logo.png
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/hero-banner.png
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/fallback.png

# D5 — Kiểm tra admin login page
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/admin/login

# D6 — Kiểm tra API proxy hoạt động (FE gọi /api → BE)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/api/settings/public

# D7 — Kiểm tra shop routes
for ROUTE in "/" "/shop" "/shop/product/1" "/admin/login"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173$ROUTE)
  echo "[$STATUS] $ROUTE"
done

# D8 — Kiểm tra bundle size (production assets)
du -sh client/dist/assets/*.js 2>/dev/null | sort -h | tail -10
du -sh client/dist/ 

# D9 — Kiểm tra .env client có VITE_API_URL
cat client/.env

# D10 — Kiểm tra không có console.error trong build output
grep -r "console\.error\|console\.warn" client/src/ | wc -l
```

**Checklist D:**
- [ ] D1 — dist/ tồn tại, có assets/
- [ ] D2 — index.html production đúng cấu trúc
- [ ] D3 — Trang chủ 200
- [ ] D4 — Static assets (logo, banner, fallback) accessible
- [ ] D5 — Admin login page accessible
- [ ] D6 — /api proxy route hoạt động đúng (FE → BE)
- [ ] D7 — Các route SPA trả về 200
- [ ] D8 — Bundle size hợp lý (< 2MB main chunk)
- [ ] D9 — VITE_API_URL được cấu hình
- [ ] D10 — Số lượng console.error/warn phù hợp

---

## E. SMOKE TESTING (CÁC FLOW NGHIỆP VỤ CHÍNH)

**Mục tiêu:** Xác minh các flow kinh doanh chính end-to-end thực sự hoạt động.

```bash
# E1 — Chạy built-in smoke test của dự án
cd server && node scripts/demo-smoke.js 2>&1 | tail -40

# E2 — Chạy CI smoke test
cd server && node scripts/ci-smoke.js 2>&1 | tail -20

# E3 — Kiểm tra demo fixtures
cd server && node scripts/ensureDemoFixtures.js 2>&1 | tail -20

# E4 — Kiểm tra pending invoice tồn tại (cần cho demo)
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/invoices?status=pending&limit=3" | python3 -m json.tool

# E5 — Kiểm tra pending leave request (cần cho demo manager)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/leaves?status=pending&limit=3" | python3 -m json.tool

# E6 — Flow tạo invoice mới
curl -s -X POST http://localhost:5001/api/invoices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"items":[{"product_id":1,"quantity":2,"unit_price":150000}],"payment_method":"cash"}' | \
  python3 -m json.tool

# E7 — Kiểm tra inventory movement được ghi khi tạo invoice
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/products/1" | python3 -m json.tool | grep -i "stock\|quantity"

# E8 — Kiểm tra report API
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/reports/sales-summary" | python3 -m json.tool | head -20

# E9 — Kiểm tra public storefront API (không cần login)
curl -s "http://localhost:5001/api/public/products?limit=5" | python3 -m json.tool | head -20
curl -s "http://localhost:5001/api/public/categories" | python3 -m json.tool

# E10 — Customer login flow (storefront)
curl -s -X POST http://localhost:5001/api/customer-auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"khach@demo.vn","password":"demo123"}' | python3 -m json.tool

# E11 — Kiểm tra attendance module
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/attendance?limit=5" | python3 -m json.tool | head -20

# E12 — Kiểm tra salary API
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/salaries?limit=5" | python3 -m json.tool | head -20
```

**Checklist E:**
- [ ] E1 — demo-smoke.js: tất cả checks PASS
- [ ] E2 — ci-smoke.js: PASS
- [ ] E3 — Demo fixtures tồn tại (pending invoice, pending leave)
- [ ] E4 — Có ít nhất 1 invoice pending
- [ ] E5 — Có ít nhất 1 leave request pending
- [ ] E6 — Tạo invoice mới thành công (201)
- [ ] E7 — Inventory movement được cập nhật sau khi tạo invoice
- [ ] E8 — Report API trả về đúng data
- [ ] E9 — Storefront public API hoạt động không cần auth
- [ ] E10 — Customer login flow hoạt động
- [ ] E11 — Attendance module accessible
- [ ] E12 — Salary API accessible

---

## F. SECURITY AUDIT

**Mục tiêu:** Phát hiện lỗ hổng bảo mật, cấu hình sai, secrets bị lộ.

```bash
# F1 — Kiểm tra .env không được commit (chỉ .env.example)
git -C . log --oneline --all -- "server/.env" "client/.env" ".env" 2>/dev/null | head -5

# F2 — Tìm hardcoded secrets trong source code
grep -r "password\s*=\s*['\"]" server/src/ --include="*.js" | grep -v "hash\|bcrypt\|process\.env\|req\.\|body\.\|row\.\|user\." | head -10
grep -r "secret\s*=\s*['\"]" server/src/ --include="*.js" | grep -v "process\.env" | head -10

# F3 — Kiểm tra JWT secret đủ mạnh (không phải default)
grep "JWT_SECRET" server/.env
# Cảnh báo nếu vẫn là "super_secret_jwt_key"

# F4 — Kiểm tra password hash (phải dùng bcrypt, không plain text)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT username, LEFT(password_hash, 10) AS hash_prefix FROM users LIMIT 5;" 2>/dev/null
# Phải bắt đầu bằng $2b$ (bcrypt)

# F5 — Kiểm tra SQL injection protection (parameterized queries)
grep -r "query\s*=\s*\`\|query\s*=\s*'" server/src/models/ --include="*.js" | grep -v "?\|params\b" | head -10

# F6 — Kiểm tra file upload restrictions
cat server/src/middleware/uploadMiddleware.js

# F7 — Kiểm tra audit log đang hoạt động
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT action, table_name, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 5;" 2>/dev/null

# F8 — Kiểm tra login_attempts throttling trong DB
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT username, attempt_count, last_attempt FROM login_attempts ORDER BY last_attempt DESC LIMIT 5;" 2>/dev/null

# F9 — Kiểm tra HTTPS readiness (nếu deploy production)
grep -i "ssl\|https\|tls" docker-compose.yml server/server.js

# F10 — Kiểm tra Content-Security-Policy header
curl -s -I http://localhost:5001/api/settings/public 2>/dev/null | grep -i "content-security\|x-frame\|referrer"

# F11 — Tìm debug endpoints hoặc test routes
grep -r "\/test\|\/debug\|\/dev\/" server/src/routes/ --include="*.js"

# F12 — Kiểm tra sensitive data không bị trả về trong API
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:5001/api/users | python3 -c "
import sys,json
data=json.load(sys.stdin)
users=data.get('data',data.get('users',[]))
if isinstance(users,list) and users:
    u=users[0]
    print('Fields returned:', list(u.keys()))
    print('password exposed:', 'password' in u or 'password_hash' in u)
" 2>/dev/null
```

**Checklist F:**
- [ ] F1 — .env files không bị commit vào git
- [ ] F2 — Không có hardcoded credentials trong source
- [ ] F3 — ⚠️ JWT_SECRET đã được đổi từ default (hoặc ghi nhận cần đổi khi production)
- [ ] F4 — Passwords được hash bằng bcrypt ($2b$)
- [ ] F5 — SQL queries dùng parameterized (không string concat)
- [ ] F6 — Upload middleware có file type/size restriction
- [ ] F7 — Audit log đang ghi hoạt động
- [ ] F8 — Login throttling active trong DB
- [ ] F9 — ⚠️ HTTPS cần cấu hình khi deploy production
- [ ] F10 — Security headers đầy đủ
- [ ] F11 — Không có debug/test routes bị expose
- [ ] F12 — API không trả về password_hash cho client

---

## G. BUSINESS LOGIC & MODULE INTEGRITY

**Mục tiêu:** Xác minh các quy tắc nghiệp vụ được implement đúng.

```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# G1 — Kiểm tra inventory update khi nhập hàng (import)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/imports?limit=3" | python3 -m json.tool | head -30

# G2 — Kiểm tra return/refund logic
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/returns?limit=3" | python3 -m json.tool | head -30

# G3 — Kiểm tra promotion/discount áp dụng đúng
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/promotions" | python3 -m json.tool | head -20

# G4 — Kiểm tra salary calculation có bonus adjustments
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/salaries?limit=3" | python3 -m json.tool | head -30

# G5 — Kiểm tra leave request workflow (pending → approved/rejected)
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/leaves?limit=5" | python3 -m json.tool | head -30

# G6 — Kiểm tra CRM customer tiers
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/customers?limit=5" | python3 -m json.tool | head -30

# G7 — Kiểm tra notifications module
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/notifications?limit=5" | python3 -m json.tool | head -20

# G8 — Kiểm tra supplier-product mapping
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/suppliers" | python3 -m json.tool | head -20

# G9 — Kiểm tra module registry đồng nhất giữa FE và BE
diff <(node -e "const r=require('./server/src/config/moduleRegistry.js');console.log(Object.keys(r).sort().join('\n'))" 2>/dev/null) \
     <(node -e "import('./client/src/config/moduleRegistry.js').then(r=>console.log(Object.keys(r.default||r).sort().join('\n')))" 2>/dev/null) \
  && echo "IN SYNC" || echo "OUT OF SYNC — check manually"

# G10 — Kiểm tra attendance workflow
curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5001/api/attendance?limit=5" | python3 -m json.tool | head -20
```

**Checklist G:**
- [ ] G1 — Import module trả về đúng data (import list + items)
- [ ] G2 — Returns module trả về đúng (với refund_subtotal)
- [ ] G3 — Promotions accessible và có đủ fields
- [ ] G4 — Salary data có bonus_adjustments khi cần
- [ ] G5 — Leave requests có workflow status đúng
- [ ] G6 — CRM customer có tier/segment fields
- [ ] G7 — Notifications hoạt động
- [ ] G8 — Supplier-product mapping tồn tại
- [ ] G9 — Module registry FE/BE đồng nhất
- [ ] G10 — Attendance module trả về đúng data

---

## H. PERFORMANCE & SCALABILITY

**Mục tiêu:** Đánh giá thời gian phản hồi, query performance, memory usage.

```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

# H1 — Response time của các API chính
for ENDPOINT in products invoices customers reports/sales-summary; do
  TIME=$(curl -s -o /dev/null -w "%{time_total}" \
    -H "Authorization: Bearer $TOKEN" \
    "http://localhost:5001/api/$ENDPOINT")
  echo "$ENDPOINT: ${TIME}s"
done

# H2 — Kiểm tra slow queries (MySQL)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SHOW STATUS LIKE 'Slow_queries';" 2>/dev/null

# H3 — Kiểm tra memory usage containers
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

# H4 — Test concurrent requests (giả lập 10 user đồng thời)
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code} %{time_total}\n" \
    -H "Authorization: Bearer $TOKEN" \
    http://localhost:5001/api/products &
done; wait

# H5 — Kiểm tra connection pool settings
grep -i "pool\|connectionLimit\|waitForConnections" server/src/config/db.js

# H6 — Kiểm tra MySQL query cache và buffer pool
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SHOW VARIABLES LIKE 'innodb_buffer_pool_size';" 2>/dev/null

# H7 — Kiểm tra có index trên cột foreign key (performance)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT t.table_name, k.column_name, 
      IF(s.index_name IS NULL,'❌ MISSING INDEX','✅ INDEXED') AS idx_status
      FROM information_schema.key_column_usage k
      JOIN information_schema.tables t ON k.table_name=t.table_name AND t.table_schema='julie_cosmetics'
      LEFT JOIN information_schema.statistics s ON s.table_schema='julie_cosmetics' 
        AND s.table_name=k.table_name AND s.column_name=k.column_name
      WHERE k.table_schema='julie_cosmetics' AND k.referenced_table_name IS NOT NULL
      ORDER BY t.table_name LIMIT 20;" 2>/dev/null
```

**Checklist H:**
- [ ] H1 — Response time < 500ms cho các API thông thường
- [ ] H2 — Không có slow queries
- [ ] H3 — Memory usage hợp lý (< 512MB mỗi container)
- [ ] H4 — Concurrent requests không crash (10 requests đồng thời ổn định)
- [ ] H5 — Connection pool được cấu hình
- [ ] H6 — InnoDB buffer pool phù hợp
- [ ] H7 — FK columns có index

---

## I. DATA MIGRATION & ENVIRONMENT READINESS

**Mục tiêu:** Đảm bảo quy trình chuyển sang production sẵn sàng.

```bash
# I1 — Kiểm tra tất cả env variables production cần có
echo "=== ROOT .env ===" && cat .env
echo "=== SERVER .env ===" && cat server/.env
echo "=== CLIENT .env ===" && cat client/.env

# I2 — Kiểm tra .env.example đầy đủ
diff <(grep "^[A-Z]" .env | cut -d= -f1 | sort) \
     <(grep "^[A-Z]" .env.example | cut -d= -f1 | sort) \
  && echo "env files match" || echo "MISMATCH — update .env.example"

# I3 — Kiểm tra backup files tồn tại
ls -lh database/backups/

# I4 — Thử restore từ backup (dry-run, không xóa data thật)
echo "Backup files available:"
ls database/backups/*.sql.gz 2>/dev/null | while read f; do
  echo "  $(basename $f) — $(du -sh $f | cut -f1)"
done

# I5 — Kiểm tra GitHub Actions CI workflow
cat .github/workflows/ci.yml

# I6 — Kiểm tra NODE_ENV production đã được set
docker exec julie_server node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"

# I7 — Kiểm tra Docker images được build đúng (không có debug tools trong production)
docker exec julie_server which nodemon 2>/dev/null && echo "⚠️ nodemon in production" || echo "✅ no nodemon"

# I8 — Kiểm tra có migration chưa apply (diff schema hiện tại với migration)
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT COUNT(*) AS table_count FROM information_schema.tables WHERE table_schema='julie_cosmetics';" 2>/dev/null

# I9 — Kiểm tra seed catalog data đầy đủ
docker exec julie_mysql mysql -u julie_app -pjulie_demo_123 julie_cosmetics \
  -e "SELECT c.name AS category, COUNT(p.id) AS products 
      FROM categories c 
      LEFT JOIN products p ON p.category_id=c.id AND p.deleted_at IS NULL 
      GROUP BY c.id, c.name ORDER BY products DESC;" 2>/dev/null

# I10 — Reset demo users (giả lập trước khi demo)
cd server && node scripts/resetDemoUsers.js 2>&1 | tail -10

# I11 — Final smoke test sau reset
cd server && node scripts/demo-smoke.js 2>&1 | grep -E "PASS|FAIL|ERROR" | tail -20

# I12 — Kiểm tra log rotation (production cần thiết)
ls -la server/*.log 2>/dev/null || echo "No log files in /server (logs go to stdout/docker - OK)"
```

**Checklist I:**
- [ ] I1 — Tất cả env files được cấu hình đầy đủ
- [ ] I2 — .env.example match với .env thực tế
- [ ] I3 — Có backup files sẵn sàng
- [ ] I4 — Backup files không bị corrupt
- [ ] I5 — GitHub Actions CI workflow cấu hình đúng
- [ ] I6 — NODE_ENV = production trong container
- [ ] I7 — Production image không có dev tools
- [ ] I8 — Tất cả migrations đã được apply
- [ ] I9 — Catalog data đủ categories và products
- [ ] I10 — Demo users reset thành công
- [ ] I11 — Final smoke test PASS
- [ ] I12 — Logging strategy phù hợp (stdout/docker logs)

---

## 📊 TỔNG HỢP KẾT QUẢ — DEPLOYMENT VERDICT

Sau khi hoàn thành tất cả mục A → I, Agent tổng hợp theo mẫu sau:

```
╔══════════════════════════════════════════════════════════════════╗
║          JULIE COSMETICS — DEPLOYMENT READINESS REPORT           ║
╚══════════════════════════════════════════════════════════════════╝

📅 Ngày kiểm tra   : ____________________
🔧 Agent/Người KT  : ____________________
🌿 Branch/Commit   : ____________________

┌──────────────────────────────────────────────────────────────────┐
│  MỤC                        │ PASS │ WARN │ FAIL │ SCORE        │
├──────────────────────────────────────────────────────────────────┤
│  A. Infrastructure & Docker  │  __  │  __  │  __  │ __/10       │
│  B. Database & Schema        │  __  │  __  │  __  │ __/11       │
│  C. Backend API              │  __  │  __  │  __  │ __/13       │
│  D. Frontend Client          │  __  │  __  │  __  │ __/10       │
│  E. Smoke Testing            │  __  │  __  │  __  │ __/12       │
│  F. Security Audit           │  __  │  __  │  __  │ __/12       │
│  G. Business Logic           │  __  │  __  │  __  │ __/10       │
│  H. Performance              │  __  │  __  │  __  │ __/7        │
│  I. Migration & Env          │  __  │  __  │  __  │ __/12       │
├──────────────────────────────────────────────────────────────────┤
│  TỔNG                        │      │      │      │ ___/97      │
└──────────────────────────────────────────────────────────────────┘

🔴 CRITICAL ISSUES (phải fix trước go-live):
  1. ____________________________________________________________
  2. ____________________________________________________________
  3. ____________________________________________________________

🟠 HIGH ISSUES (nên fix trước go-live):
  1. ____________________________________________________________
  2. ____________________________________________________________

🟡 MEDIUM ISSUES (fix trong sprint đầu sau go-live):
  1. ____________________________________________________________
  2. ____________________________________________________________

🟢 LOW / IMPROVEMENTS:
  1. ____________________________________________________________
  2. ____________________________________________________________

──────────────────────────────────────────────────────────────────
🏁 VERDICT:
  [ ] ✅ GO-LIVE APPROVED     — Score ≥ 85/97, không có CRITICAL
  [ ] ⚠️ CONDITIONAL GO-LIVE  — Score 70-84/97, CRITICAL đã được ghi nhận
  [ ] ❌ NOT READY            — Score < 70/97 hoặc có CRITICAL chưa fix

📋 ĐIỀU KIỆN BỔ SUNG TRƯỚC GO-LIVE (nếu áp dụng):
  □ Đổi JWT_SECRET thành secret ngẫu nhiên 64+ ký tự
  □ Đổi MySQL root password & julie_app password
  □ Cấu hình HTTPS / SSL certificate (nginx reverse proxy)
  □ Cấu hình backup tự động (cron job)
  □ Cấu hình monitoring (uptime, error alerting)
  □ Remove hoặc restrict demo accounts trên production
  □ Cấu hình log rotation & persistent log storage
  □ Review & đổi CLIENT_URL sang domain production thật
──────────────────────────────────────────────────────────────────
```

---

## 🔧 QUICK-FIX PLAYBOOK (Các fix thường gặp)

### Fix 1 — JWT_SECRET chưa đổi
```bash
# Tạo secret mạnh
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copy output vào server/.env: JWT_SECRET=<output>
```

### Fix 2 — Container không start
```bash
docker compose down -v
docker compose up -d --build
docker compose logs --follow
```

### Fix 3 — DB không seed đúng
```bash
npm run docker:reset   # xóa volume
npm run db:up          # khởi động lại với seed mới
npm run seed:demo      # seed thêm demo transactions
```

### Fix 4 — Demo users bị drift (sai password)
```bash
cd server
node scripts/resetDemoUsers.js
node scripts/demo-smoke.js   # verify
```

### Fix 5 — Missing migrations
```bash
# Chạy từng migration theo thứ tự số
docker exec -i julie_mysql mysql -u root -proot julie_cosmetics < \
  database/migrations/035_harden_internal_rbac_and_role_bootstrap.sql
```

### Fix 6 — Port conflict
```bash
# Kiểm tra port đang bị dùng
lsof -i :5001 -i :5173 -i :3307
# Đổi port trong .env rồi restart
```

### Fix 7 — RBAC permissions thiếu
```bash
cd server
node scripts/sync-rbac.js
node scripts/resetDemoUsers.js
```

### Fix 8 — Production: setup nginx reverse proxy + HTTPS
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        proxy_pass http://localhost:5173/;
        proxy_set_header Host $host;
    }
}
```

---

## 📝 GHI CHÚ CHO AGENT

1. **Thực hiện theo thứ tự A → I** — một số mục phụ thuộc vào kết quả trước.
2. **Không bỏ qua bất kỳ check nào** — ghi `⚠️ SKIPPED (lý do)` nếu không thực hiện được.
3. **Capture output thực tế** — paste output lệnh vào checklist, không suy đoán.
4. **Đánh dấu severity chính xác** — một issue chưa được biết đến có thể là CRITICAL.
5. **Mục F (Security) ưu tiên cao nhất** — issues ở đây mặc định là CRITICAL hoặc HIGH.
6. **Sau khi hoàn thành**: xuất DEPLOYMENT VERDICT dưới dạng file `deployment-report-YYYY-MM-DD.md`.

---

*Prompt version: 2.0 | Hệ thống: Julie Cosmetics | Stack: React/Vite + Express + MySQL 8 + Docker*