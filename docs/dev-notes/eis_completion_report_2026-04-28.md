# Julie Cosmetics EIS Completion Report

Ngày hoàn thiện: 2026-04-28  
Audit gốc: `docs/dev-notes/eis_audit_report_2026-04-28.md`

## 1. Tóm tắt

- Trước fix: **53/60**
- Sau fix ước tính: **59/60**
- Demo readiness: **Ready**
- Final submission readiness: **Ready with minor production notes**
- Backup trước khi seed/migrate DB: `database/backups/backup_20260428_234116.sql.gz`

Các P0/P1 blocker đã được xử lý:

- Payroll export không còn gọi method thiếu và đã trả CSV 200.
- Staff portal có in bảng lương tháng và in bảng lương năm.
- Rubric-style aliases cho staff/report không còn 404.
- Client Dockerfile đã chuyển sang static build + Nginx runtime, không chạy Vite dev server.
- Attendance/payroll demo seed đã có 195 bản ghi chấm công và 3 payroll periods approved cho 03-05/2026.
- Migration hygiene được document rõ; migration mới dùng số tiếp theo và idempotent.

## 2. Các lỗi đã sửa

| Issue từ audit | Severity cũ | File đã sửa | Cách sửa | Test chứng minh | Trạng thái |
|---|---|---|---|---|---|
| Payroll export gọi `PayrollModel.findRecordsByPeriod()` không tồn tại | CRITICAL | `server/src/controllers/payrollController.js`, `server/src/models/payrollModel.js` | Controller dùng `findPayrollRecords`; model thêm alias tương thích `findRecordsByPeriod` | `GET /api/payroll/periods/3/export -> 200`, `content-type=text/csv`, 651 bytes | Done |
| Staff thiếu in bảng lương tháng/năm | HIGH | `client/src/pages/staff/MySalaryPage.jsx`, `client/src/services/staffService.js` | Thêm print window cho phiếu tháng và tổng hợp năm; thêm API helpers salary-slip alias | `npm run build` pass; `GET /api/staff/salary-slip/4/2026 -> 200`; annual -> 200 | Done |
| Staff rubric aliases trả 404 | HIGH | `server/src/routes/staffRoutes.js`, `server/src/controllers/staffController.js` | Thêm `/my-leaves`, `/my-salary`, `/salary-slip/:month/:year`, `/salary-slip/annual/:year` | `/api/staff/my-leaves -> 200`, `/api/staff/my-salary?year=2026 -> 200`, salary-slip routes -> 200 | Done |
| Report aliases theo rubric trả 404 | HIGH | `server/src/routes/reportRoutes.js` | Thêm wrapper route set `group_by` rồi gọi controller hiện có | HR/inventory/sales/profit monthly/quarterly/yearly đều 200 | Done |
| Client Docker production chạy Vite dev server | HIGH | `client/Dockerfile`, `client/nginx.conf`, `docker-compose.yml`, `nginx/nginx.conf` | Multi-stage build React, runtime Nginx static; SPA fallback; proxy `/api`; root nginx proxy `client:80` | `docker compose build server client` pass; `docker compose ps` client healthy; `ps` trong client chỉ có nginx | Done |
| Attendance demo rỗng | HIGH | `database/migrations/043_seed_demo_attendance_payroll.sql` | Seed attendance 03-05/2026 cho manager01/staff01/warehouse01; tạo attendance/payroll periods; tạo/gắn salaries approved | `attendance_records = 195`; payroll periods 3 records approved; migration rerun `0` new migrations | Done |
| Migration hygiene gây hiểu nhầm | HIGH | `database/migrations/README.md` | Document duplicate `015_*`, `hotfix_p0.sql` manual-only, runner behavior, rule for new migrations | `npm run migrate` pass và rerun idempotent | Done |

## 3. Mapping rubric sau hoàn thiện

| Nhóm | Điểm tối đa | Sau fix | Evidence |
|---|---:|---:|---|
| II.1 CSDL + backup/restore | 10 | 9.5 | Schema đủ nghiệp vụ; backup chạy tạo `backup_20260428_234116.sql.gz`; migration tracking active. Restore script có sẵn nhưng restore drill chưa automate. |
| II.2 Admin | 10 | 9.5 | Admin workspace riêng, users/roles/permission matrix, products/suppliers search/filter/sort, reports theo thời gian. |
| II.3.1 Staff self-service | 10 | 10 | Profile GET/PUT, leave đủ loại, salary/formula, salary-slip monthly/annual APIs 200, UI print tháng/năm đã build pass. |
| II.3.2 HR Manager | 10 | 9.5 | Employee CRUD, position history effective date + salary, leave approve/reject, payroll periods/export, HR report. HR manager scope theo department là production enhancement. |
| II.4.1 Warehouse | 10 | 10 | Products/stock/import price, import receipt, supplier CRUD/mapping, inventory report monthly/yearly + print. |
| II.4.2 Business/Sales | 10 | 10 | Invoice stock decrease, sales summary month/quarter/year, profit month/quarter/year with COGS, export/report UI. |
| **Tổng** | **60** | **59** | Không còn P0/P1 blocker. |

## 4. Test evidence

### Baseline trước fix

```bash
git status --short
docker compose ps
docker compose config --quiet
cd server && npm run demo:smoke
cd client && npm run build
```

Kết quả:

- `docker compose config --quiet`: pass.
- `npm run demo:smoke`: pass tất cả role chính.
- `npm run build`: pass, 1254 modules transformed.
- Backup audit cũ tồn tại: `database/backups/backup_20260428_231826.sql.gz`.

### Backup + migration

```bash
bash database/backup.sh
cd server && npm run migrate
cd server && npm run migrate
```

Kết quả:

- Backup mới: `database/backups/backup_20260428_234116.sql.gz`.
- Lần migrate đầu apply `042_create_user_permission_overrides.sql` và `043_seed_demo_attendance_payroll.sql`.
- Lần migrate thứ hai: `Total new migrations applied: 0`.
- DB evidence:
  - `attendance_records = 195`
  - Payroll periods: 03/2026, 04/2026, 05/2026 đều `approved`
  - Payroll period totals có dữ liệu net salary.

### Frontend build

```bash
cd client && npm run build
```

Kết quả: pass, 1254 modules transformed; `MySalaryPage` bundle được build.

### Demo smoke

```bash
cd server && npm run demo:smoke
```

Kết quả: pass admin, manager/hr, staff/self-service, sales/business, warehouse; các denied checks 403 đúng.

### Docker build/up

```bash
docker compose build server client
docker compose up -d server client nginx
docker compose restart nginx
docker compose ps
```

Kết quả:

- `julie_client` chạy image mới, command `/docker-entrypoint...`, port `5173 -> 80`, health `healthy`.
- `julie_server`, `julie_mysql`, `julie_nginx` đều up.
- Docker client build dùng `npm ci` và `npm run build` trong stage build.
- Docker build ghi nhận `npm audit` còn 5 moderate vulnerabilities từ dependency tree hiện tại; không làm fail build.

### HTTP/HTTPS + SPA

```bash
curl -s -o /dev/null -w '%{http_code} -> %{redirect_url}' http://localhost/
curl -sk -o /dev/null -w '%{http_code}' https://localhost/
curl -sk -o /dev/null -w '%{http_code}' https://localhost/staff
curl -sk -o /dev/null -w '%{http_code}' https://localhost/api/public/categories
curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/staff
curl -s -o /dev/null -w '%{http_code}' http://localhost:5173/api/public/categories
```

Kết quả:

- HTTP redirect: `301 -> https://localhost/`
- HTTPS home: `200`
- HTTPS `/staff` refresh: `200`
- HTTPS public API: `200`
- Direct client `/staff`: `200`
- Direct client `/api/public/categories`: `200`

### Payroll export + alias routes

Live Docker API results:

```text
LOGIN admin/hr/staff/warehouse: 200 OK
/api/staff/my-leaves: 200
/api/staff/my-salary?year=2026: 200, salaries=4
/api/staff/salary-slip/4/2026: 200, salary_id=7
/api/staff/salary-slip/annual/2026: 200, salaries=4
/api/reports/hr/monthly?year=2026: 200
/api/reports/hr/yearly?year=2026: 200
/api/reports/inventory/monthly?year=2026: 200
/api/reports/inventory/yearly?year=2026: 200
/api/reports/sales/monthly?year=2026: 200, items=12
/api/reports/sales/quarterly?year=2026: 200, items=4
/api/reports/sales/yearly?year=2026: 200, items=5
/api/reports/profit/monthly?year=2026: 200, items=12
/api/reports/profit/quarterly?year=2026: 200, items=4
/api/reports/profit/yearly?year=2026: 200, items=5
/api/payroll/periods/3/export: 200, text/csv, 651 bytes
```

### RBAC/security regression

```text
staff GET /api/users: 403
staff GET /api/salaries: 403
staff GET /api/payroll/records/6: 403
warehouse GET /api/users: 403
hr GET /api/imports: 403
admin GET /api/customers?limit=1: 200
Customer password/hash fields: NONE
```

### Nginx runtime

```bash
docker exec julie_client sh -lc "ps -ef | grep -E 'nginx|vite|npm' | grep -v grep; nginx -t"
docker exec julie_nginx nginx -t
```

Kết quả:

- Client container chỉ có nginx master/worker processes, không có `vite`/`npm`.
- Client nginx config: syntax ok.
- Root nginx config: syntax ok.

## 5. Known limitations còn lại

- HR manager scope theo department/manager chưa làm vì schema hiện chưa có hierarchy rõ ràng. RBAC global hiện tại vẫn pass và phù hợp demo môn học; đây là production enhancement.
- Restore drill chưa automate trong smoke. `restore.sh` có sẵn và backup chạy được, nhưng chưa test restore vào DB phụ.
- Duplicate legacy `015_*` được giữ nguyên để không rewrite migration có thể đã apply; đã document trong `database/migrations/README.md`.
- `hotfix_p0.sql` vẫn là manual historical file; completion note đã ghi không apply trực tiếp vào DB hiện tại.
- `sales01` hiện không có `employee_id`, nên attendance payroll seed chỉ áp dụng cho `manager01`, `staff01`, `warehouse01`.
- Docker build client báo 5 moderate npm audit findings hiện hữu; không ảnh hưởng build/demo nhưng nên xử lý sau nếu triển khai production thật.

## 6. Demo script cập nhật 15-20 phút

### 0-2 phút: Vào hệ thống

1. Mở `https://localhost/`.
2. Chỉ ra HTTP tự redirect sang HTTPS.
3. Giới thiệu 5 workspace: Admin, HR, Staff, Warehouse, Business.

### 2-5 phút: Admin

1. Login `admin/admin123`.
2. Mở dashboard `/admin`.
3. Vào Users/Roles để demo user CRUD, role/permission matrix.
4. Vào Products/Suppliers để demo search/filter/sort nâng cao.
5. Vào Reports, đổi group by month/quarter/year và in báo cáo profit/inventory.

### 5-9 phút: HR Manager

1. Login `manager01/manager123` hoặc vào `/hr`.
2. Employees: thêm/sửa nhân viên, mở lịch sử chức vụ.
3. Gán chức vụ mới với effective date và salary.
4. Leaves: duyệt/từ chối đơn nghỉ annual/sick/maternity/resignation.
5. Payroll: mở payroll periods 03-05/2026, xem records và bấm export CSV.

### 9-12 phút: Staff Portal

1. Login `staff01/staff123`.
2. Profile: xem/sửa thông tin cá nhân.
3. My Leaves: xem/nộp đơn nghỉ.
4. My Salary: xem công thức, mở chi tiết phiếu lương.
5. Bấm **In tháng** cho một phiếu lương và **In bảng lương năm**.

### 12-15 phút: Warehouse

1. Login `warehouse01/warehouse123`.
2. Suppliers: CRUD và mapping sản phẩm.
3. Imports: tạo/xem phiếu nhập; kiểm stock tăng ở Products.
4. Reports: mở inventory report theo tháng/năm và in báo cáo kho.

### 15-18 phút: Business/Sales

1. Login `sales01/sales123`.
2. Invoices: tạo hóa đơn bán hàng, hệ thống lấy giá server-side và kiểm tồn kho.
3. Products: kiểm stock giảm.
4. Reports: sales-summary theo quý và profit theo quý; giải thích COGS dùng snapshot từ inventory movements.

### 18-20 phút: RBAC/Security

1. Thử staff vào Users/Salaries nội bộ: bị chặn 403 hoặc redirect.
2. Thử warehouse vào Users: bị chặn.
3. Kết luận: full core flow phần II đã sẵn sàng demo và nộp.

