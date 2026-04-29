# Julie Cosmetics EIS Audit Report

Ngày audit: 2026-04-28  
Phạm vi: phần mềm EIS theo rubric SGU HK2 2025-2026, 60 điểm  
Nguồn chân lý: mã nguồn hiện tại, schema/migrations/seeds, Docker đang chạy, API live, frontend build

## 1. Executive Summary

### Kết luận nhanh

Ước tính điểm phần mềm: **53 / 60**

Trạng thái demo: **Ready for demo có kiểm soát**. Core flow đăng nhập theo vai trò, RBAC, sản phẩm, nhà cung cấp, nhập kho, hóa đơn, báo cáo doanh thu/lợi nhuận/kho, HR và self-service đều chạy được. Built-in `npm run demo:smoke` pass toàn bộ role chính.

Trạng thái nộp cuối: **Chưa nên chốt ngay**. Cần xử lý payroll export bị lỗi method, thiếu in bảng lương tháng/năm cho nhân viên, route alias theo đúng đề cương, Docker client production vẫn dùng Vite dev server, và dữ liệu chấm công demo đang rỗng nên phần payroll chưa thuyết phục khi giảng viên hỏi sâu.

### Evidence đã chạy

- Backup trước dynamic test: `database/backups/backup_20260428_231826.sql.gz`
- Docker status: `mysql`, `server`, `client`, `nginx` đều `Up`; MySQL healthy.
- HTTPS: `http://localhost/` trả `301 -> https://localhost/`; `https://localhost/api/public/categories` trả `200`.
- Demo accounts login API: `admin`, `manager01`, `staff01`, `sales01`, `warehouse01` đều `200 OK`.
- Built-in smoke: `cd server && npm run demo:smoke` pass toàn bộ role và các 403 chính.
- Frontend build: `cd client && npm run build` pass, 1254 modules transformed.
- Customer security: `/api/customers` không còn field chứa `password` hoặc `hash`.
- Live data counts: products 14, suppliers 3, employees 6, invoices 9, import receipts 3, returns 2, promotions 3, salary rows 10, leave requests 5, attendance records 0.
- Migration tracking: `schema_migrations` có 43 records.
- RBAC roles: admin 84 permissions, manager 33, staff_portal 2, sales 13, staff 13, warehouse 27; không còn role 0 permission.

### Top vấn đề blocking/critical

1. **[CRITICAL] Payroll export API bị vỡ khi có kỳ lương**: `payrollController.exportPayroll()` gọi `PayrollModel.findRecordsByPeriod()`, nhưng model chỉ có `findPayrollRecords()`. File: `server/src/controllers/payrollController.js:264`, `server/src/models/payrollModel.js:192`.
2. **[HIGH] Thiếu in bảng lương tháng/năm ở staff portal**: `MySalaryPage.jsx` chỉ xem modal chi tiết và công thức, không có nút in/export tháng/năm theo yêu cầu đề cương. File: `client/src/pages/staff/MySalaryPage.jsx:52`.
3. **[HIGH] Các endpoint theo đúng đề cương bị 404**: `/api/staff/my-leaves`, `/api/staff/my-salary`, `/api/staff/salary-slip/:month/:year`, `/api/reports/hr/monthly`, `/api/reports/profit/quarterly`, v.v. Backend có endpoint tương đương dạng khác nhưng thiếu alias.
4. **[HIGH] Docker production client vẫn chạy Vite dev server**: `client/Dockerfile` dùng `npm run dev -- --host 0.0.0.0`; nginx proxy vào dev server thay vì static build. File: `client/Dockerfile:10`.
5. **[HIGH] Migration hygiene còn rủi ro**: duplicate `015_*`; `hotfix_p0.sql` không được runner chạy vì runner chỉ lấy `/^\d+_/`, và nếu apply thủ công có thể conflict với schema hiện tại. File: `server/scripts/runMigrations.js:85`.

### Top thiếu sót high-impact

1. In phiếu lương nhân viên theo tháng và năm, gồm print-ready layout.
2. Seed dữ liệu chấm công 2-3 tháng để payroll thể hiện ngày công, đi trễ, OT, vắng.
3. Alias routes theo đề cương để giảng viên/tester gọi đúng URL vẫn pass.
4. Production Docker client static build + nginx serve static, bỏ Vite dev server.
5. Scope approval cho HR Manager theo phòng ban/manager thay vì chỉ theo permission global.

## 2. Detailed Findings Table

| # | Layer | Issue | Severity | File | Fix recommendation |
|---|---|---|---|---|---|
| 1 | Backend/Payroll | Export payroll gọi method không tồn tại `findRecordsByPeriod`; sẽ crash 500 khi có payroll period. | CRITICAL | `server/src/controllers/payrollController.js:264`, `server/src/models/payrollModel.js:192` | Đổi sang `PayrollModel.findPayrollRecords(periodId)` hoặc thêm alias trong model; thêm smoke test export. |
| 2 | Frontend/Staff | Staff salary page thiếu nút in bảng lương tháng và năm. | HIGH | `client/src/pages/staff/MySalaryPage.jsx:52` | Thêm `window.print()`/print window cho từng tháng và cả năm; thêm CSS `@media print`. |
| 3 | Backend API | Staff self-service endpoint theo đề cương trả 404; backend dùng `/staff/leaves`, `/staff/salaries`, `/staff/salaries/export`. | HIGH | `server/src/routes/staffRoutes.js:20` | Thêm alias `/my-leaves`, `/my-salary`, `/salary-slip/:month/:year`, `/salary-slip/annual/:year`. |
| 4 | Backend API | Report endpoint theo đề cương trả 404; backend dùng `/reports/hr?group_by=month`, `/reports/profit?group_by=quarter`. | HIGH | `server/src/routes/reportRoutes.js:6` | Thêm alias routes monthly/quarterly/annual gọi cùng controller với query mặc định. |
| 5 | Infra | Client container production chạy Vite dev server, không serve static build. | HIGH | `client/Dockerfile:10`, `docker-compose.yml:62` | Multi-stage build React rồi serve bằng nginx/static server; nginx proxy static trực tiếp. |
| 6 | Database/Migrations | Có duplicate migration number `015_*`, dễ gây nhầm thứ tự audit/manual run. | HIGH | `database/migrations/015_fix_returns_refund_logic.sql`, `database/migrations/015_normalize_skin_types.sql` | Rename một migration thành số kế tiếp trong nhánh mới hoặc document rõ immutable history. |
| 7 | Database/Migrations | `hotfix_p0.sql` không được migration runner apply; apply thủ công có thể tạo duplicate column/trigger. | HIGH | `database/migrations/hotfix_p0.sql`, `server/scripts/runMigrations.js:85` | Đưa hotfix vào migration numbered/idempotent hoặc archive ngoài folder migrations. |
| 8 | Demo Data | `attendance_records` live DB = 0; payroll logic dựa attendance nên demo lương chưa thể hiện ngày công thực tế. | HIGH | `database/migrations/034_create_attendance_module.sql`, DB live | Seed 2-3 tháng attendance cho staff demo, gồm present/late/OT/absent. |
| 9 | Security/RBAC | HR manager có quyền duyệt leave toàn cục; chưa enforce phạm vi phòng ban/manager. | HIGH | `server/src/controllers/leaveController.js:79`, `server/src/models/leaveModel.js:259` | Thêm department/manager scope check trước approve/reject/findAll. |
| 10 | Payroll Logic | Sick/maternity đang bị tính như unpaid leave. Có thể không đúng quy định doanh nghiệp nếu muốn nghỉ ốm/thai sản có lương một phần. | MEDIUM | `server/src/utils/salaryCalculation.js:118` | Chốt policy trong settings; tách `paid_leave_types` hoặc tỷ lệ hưởng lương theo leave type. |
| 11 | Payroll Logic | Recalculate sau adjustment bỏ qua một số deduction đã tính ban đầu như `absence_deduction`, `other_deduction_amount`. | MEDIUM | `server/src/models/payrollModel.js:278` | Reuse cùng salary calculation summary hoặc select đủ deduction columns khi recalc. |
| 12 | Backend Validation | Một số CRUD routes không dùng validation middleware rõ ràng: brand, category, supplier, promotion, position. | MEDIUM | `server/src/routes/supplierRoutes.js:11`, `server/src/routes/promotionRoutes.js:9` | Thêm express-validator cho required, length, enum, money, phone/email. |
| 13 | Backend/Auth | Admin bypass kiểm tra `req.user.role === 'admin'` thay vì role resolved; nếu legacy `role` lệch `role_name`, behavior không nhất quán. | MEDIUM | `server/src/middleware/authMiddleware.js:120` | Dùng `resolveEffectiveRole(req.user) === 'admin'`. |
| 14 | Security | Auth limiter đang 100 login/15 phút; hơi rộng nếu gọi là brute-force protection. | MEDIUM | `server/src/middleware/rateLimiter.js:4` | Giảm login max theo IP/user, kết hợp `login_attempts` lockout rõ ràng. |
| 15 | Reports | Generic reports hoạt động tốt, nhưng UI/API chưa expose riêng HR monthly/yearly print; warehouse/sales/profit có print tốt hơn. | MEDIUM | `client/src/pages/ReportsPage.jsx:363` | Thêm print HR report và route aliases. |
| 16 | Database | Soft delete không hoàn toàn nhất quán giữa bảng; một số query count/report phải biết bảng nào có `deleted_at`. | MEDIUM | `database/schema.sql` | Chuẩn hóa `deleted_at` cho operational entities hoặc document exceptions. |
| 17 | Frontend | Module registry có promotions/payments/shipping/returns `showInSidebar: false`; có API nhưng thiếu route/page direct trong `App.jsx`. | MEDIUM | `client/src/config/moduleRegistry.js:121`, `client/src/App.jsx:70` | Nếu muốn demo business đầy đủ, thêm pages/routes hoặc bỏ khỏi feature promise. |
| 18 | Env/Security | Local `.env`, `server/.env`, `client/.env`, `server/.env.bak...` tồn tại trong workspace; đang ignored nhưng vẫn là secret surface. | MEDIUM | `.gitignore`, local env files | Không commit; dọn backup env cũ sau khi lưu password manager; maintain `.env.example`. |
| 19 | Backup/Restore | Backup chạy tốt; restore script có xác nhận, nhưng chưa có automated restore test trong smoke. | LOW | `database/backup.sh`, `database/restore.sh` | Thêm documented restore drill hoặc CI/local checklist. |
| 20 | Frontend Quality | `client/dist` build được và ignored; nhưng current compose không dùng build output. | LOW | `client/Dockerfile`, `.gitignore` | Giữ dist ignored, chuyển compose production sang static artifact. |

## 3. Rubric Score Matrix

| STT | Yêu cầu | Điểm | Trạng thái | Ước tính | Evidence |
|---|---:|---:|---|---:|---|
| II.1 | CSDL đầy đủ bảng | 5 | ✅ | 4.5 | Có employees, positions, employee_positions, leave_requests, salaries, products, imports, invoices, suppliers, roles/permissions, returns, promotions, attendance. |
| II.1 | Backup/Restore script | 5 | ✅ | 4.5 | `backup.sh` chạy tạo `backup_20260428_231826.sql.gz`; `restore.sh` có flow restore, chưa test restore thực tế. |
| II.2 | Admin UI tách biệt | 3 | ✅ | 2.5 | `/admin`, `/hr`, `/warehouse`, `/business`, `/staff`; workspace/sidebar theo role. Layout vẫn dùng chung shell. |
| II.2 | Admin search/filter nâng cao | 3 | ✅ | 2.5 | Products/Suppliers có search/filter/sort; advanced supplier-product mapping có sẵn. |
| II.2 | Admin quản lý user + phân quyền | 2 | ✅ | 2.0 | UsersPage, RolesPage, PermissionMatrix; `/api/users`, `/api/roles`. |
| II.2 | Admin báo cáo theo thời gian | 2 | ✅ | 2.0 | ReportsPage group_by month/quarter/year, charts, print cho profit/inventory/export. |
| II.3.1 | NV xem/sửa thông tin | 2 | ✅ | 2.0 | `/api/staff/profile` GET/PUT live 200. |
| II.3.1 | NV nộp đơn nghỉ đủ loại | 2 | ✅ | 1.8 | annual/sick/maternity/unpaid/resignation; overlap and resignation guard. |
| II.3.1 | NV xem lương + cách tính | 3 | ✅ | 2.5 | `/api/staff/salaries`, `/api/staff/salary-formula`; UI shows formula and details. |
| II.3.1 | In bảng lương tháng | 1.5 | ❌ | 0.3 | CSV endpoint exists but staff UI lacks monthly print button/layout. |
| II.3.1 | In bảng lương năm | 1.5 | ❌ | 0.3 | Year filter and total exist; no annual print/export UX. |
| II.3.2 | Manager CRUD nhân viên | 2 | ✅ | 2.0 | `/api/employees` CRUD, UI EmployeesPage. |
| II.3.2 | Đổi chức vụ + lịch sử + lương | 3 | ✅ | 3.0 | `employee_positions` with effective/end/salary; transaction closes old position and updates base salary. |
| II.3.2 | Tính lương | 2 | ⚠️ | 1.7 | Payroll logic strong, but export bug and attendance seed empty. |
| II.3.2 | Duyệt đơn nghỉ | 1 | ✅ | 1.0 | `/api/leaves/:id/approve/reject`, notification and balance deduction. |
| II.3.2 | Thống kê nhân sự tháng/năm | 2 | ✅ | 1.6 | `/api/reports/hr?group_by=...`; exact monthly/annual aliases missing. |
| II.4.1 | Quản lý sản phẩm + tồn kho | 2 | ✅ | 1.8 | Products CRUD, stock/import price/sell price displayed; stock controlled by imports/sales. |
| II.4.1 | Phiếu nhập kho | 3 | ✅ | 3.0 | Import receipt transaction + trigger stock increase + inventory movement. |
| II.4.1 | CRUD nhà cung cấp | 2 | ✅ | 2.0 | Suppliers CRUD and product mapping. |
| II.4.1 | Báo cáo kho tháng/năm | 3 | ✅ | 2.5 | Inventory report group_by month/year, print; exact alias routes missing. |
| II.4.2 | Phiếu xuất / Hóa đơn bán | 3 | ✅ | 3.0 | Invoice transaction, stock lock/check, trigger stock decrease, payment transaction. |
| II.4.2 | Thống kê xuất hàng tháng/quý/năm | 3 | ✅ | 2.7 | `/api/reports/sales-summary?group_by=month/quarter/year` live 200. |
| II.4.2 | Thống kê lợi nhuận tháng/quý/năm | 4 | ✅ | 3.5 | Profit report live 200 for quarter; COGS snapshot/fallback implemented; exact aliases missing. |
|  | **Tổng** | **60** |  | **53.0** | Demo-ready, needs polish for final submission. |

## 4. Static Architecture Notes

### Schema diagram text

```text
users -> roles -> role_permissions -> permissions
users -> employees
employees -> positions through employee_positions(effective_date, end_date, salary_at_time)
employees -> leave_requests -> employee_leave_balances
employees -> attendance_records -> attendance_shifts
payroll_periods -> salaries -> payroll_adjustments
suppliers -> import_receipts -> import_receipt_items -> products
products -> invoice_items <- invoices -> customers
products -> inventory_movements(import/sale/return/cancel)
invoices -> returns -> return_items
settings / audit_logs / notifications support cross-cutting behavior
```

### Điểm mạnh đáng giữ

- `customerModel` đã dùng safe DTO, không trả `password_hash`; live API confirm không có key password/hash.
- Inventory và invoice flow có transaction, `FOR UPDATE`, trigger cập nhật stock, và `inventory_movements`.
- Position history đáp ứng đúng đề bài: effective date, end date, salary at time, update current base salary.
- Profit reporting tính theo revenue net, returns/refunds, COGS snapshot từ `inventory_movements`, fallback import history/current import price.
- RBAC thực tế pass các kiểm tra 403 quan trọng: staff không xem `/users`/`/salaries`, warehouse không xem `/users`, HR không xem `/imports`.

## 5. Priority Fix List

### CRITICAL

1. Sửa payroll export method mismatch.
2. Thêm regression check cho payroll export có period thật.

### HIGH

1. Thêm in bảng lương tháng/năm ở staff portal.
2. Thêm alias endpoints theo đề cương cho staff salary/leave và reports monthly/quarterly/annual.
3. Chuyển Docker client production sang static build.
4. Seed attendance demo để payroll có dữ liệu ngày công/OT/vắng.
5. Dọn migration hygiene: duplicate `015`, `hotfix_p0.sql` manual conflict.
6. Enforce HR manager scope khi duyệt/xem leave nếu muốn phân quyền doanh nghiệp sát hơn.

### MEDIUM

1. Chốt policy sick/maternity có lương hay không và đưa vào settings.
2. Sửa payroll recalc adjustments để không làm lệch deduction.
3. Thêm validation middleware cho supplier/category/brand/promotion/position.
4. Giảm auth rate limit hoặc bổ sung per-username lockout rõ hơn.
5. Thêm print HR report.

### LOW

1. Thêm restore drill vào README/smoke checklist.
2. Dọn env backup local sau khi lưu secret vào password manager.
3. Document report endpoint mapping vì hiện API generic khác tên rubric.

## 6. Missing Features To Implement

### M1. Staff salary print monthly + annual

Mô tả: Nhân viên phải in được phiếu lương theo tháng và bảng tổng hợp năm.  
Files: `client/src/pages/staff/MySalaryPage.jsx`, `client/src/services/staffService.js`, optional `server/src/routes/staffRoutes.js`.  
Effort: 3-5 giờ.

Skeleton:

```jsx
const openSalaryPrint = (html, title) => {
  const w = window.open('', '_blank');
  if (!w) throw new Error('Vui lòng cho phép popup để in bảng lương.');
  w.document.write(`<html><head><title>${title}</title><style>
    body{font-family:Arial,sans-serif;padding:24px}
    table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ddd;padding:8px}
    @media print {.no-print{display:none}}
  </style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
};
```

### M2. API alias routes theo đề cương

Mô tả: Giữ endpoint hiện có nhưng thêm alias để rubric tester gọi URL đúng vẫn pass.  
Files: `server/src/routes/staffRoutes.js`, `server/src/routes/reportRoutes.js`.  
Effort: 1-2 giờ.

Skeleton:

```js
router.get('/my-leaves', staffController.getMyLeaves);
router.get('/my-salary', staffController.getMySalaries);
router.get('/salary-slip/:month/:year', staffController.getMonthlySalarySlip);
router.get('/salary-slip/annual/:year', staffController.getAnnualSalarySlip);

router.get('/profit/quarterly', (req, res, next) => {
  req.query.group_by = 'quarter';
  return reportController.getProfit(req, res, next);
});
```

### M3. Production client container

Mô tả: Build static React artifact, serve qua nginx, không chạy Vite dev server trong production.  
Files: `client/Dockerfile`, `docker-compose.yml`, `nginx/nginx.conf`.  
Effort: 2-4 giờ.

Skeleton:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### M4. Attendance demo seed

Mô tả: Tạo dữ liệu chấm công thực tế cho `staff01`, `manager01`, `warehouse01` trong vài tháng.  
Files: new migration `database/migrations/043_seed_demo_attendance.sql` hoặc script fixture.  
Effort: 2-3 giờ.

Skeleton:

```sql
INSERT IGNORE INTO attendance_records
  (employee_id, shift_id, work_date, check_in_at, check_out_at, status, work_day_value, overtime_minutes)
SELECT e.employee_id, 1, d.work_date,
       CONCAT(d.work_date, ' 08:00:00'),
       CONCAT(d.work_date, ' 17:00:00'),
       'present', 1.00, 0
FROM employees e
JOIN (
  SELECT DATE('2026-04-01') + INTERVAL seq DAY AS work_date
  FROM seq_0_to_29
) d
WHERE e.employee_id IN (1,2,4);
```

### M5. HR manager scoped approval

Mô tả: HR manager chỉ duyệt leave/employee thuộc phạm vi được phân công.  
Files: schema thêm department/manager mapping nếu chưa có, `leaveController`, `employeeModel`.  
Effort: 5-8 giờ.

## 7. Business Logic Corrections

### Payroll

- Sửa export:

```js
const records = await PayrollModel.findPayrollRecords(periodId);
```

- Recalc adjustments nên giữ lại toàn bộ deduction đã có:

```js
SELECT base_salary, overtime_amount, unpaid_leave_deduction, absence_deduction,
       late_penalty_amount, early_leave_penalty_amount, other_deduction_amount
FROM salaries
WHERE salary_id = ?
```

- Policy leave: hiện annual paid, sick/maternity/unpaid đều unpaid. Nếu doanh nghiệp muốn ốm/thai sản hưởng lương, đưa vào `settings`:

```text
payroll.leave.annual_paid_ratio = 1
payroll.leave.sick_paid_ratio = 0.75
payroll.leave.maternity_paid_ratio = 1
payroll.leave.unpaid_paid_ratio = 0
```

### Position history

Hiện đã tốt: `employee_positions` có `effective_date`, `end_date`, `salary_at_time`; assign position dùng transaction, đóng chức vụ cũ và cập nhật `employees.base_salary`.

Khuyến nghị: thêm check không cho payroll period đã lock bị ảnh hưởng bởi retroactive position changes.

### Leave

Hiện đã có annual/sick/maternity/unpaid/resignation, overlap check, resignation sync. Cần bổ sung:

- Scope HR manager.
- Optional status `cancelled` cho nhân viên tự hủy đơn pending.
- Kiểm annual leave ngay lúc submit hoặc hiển thị quota remaining trong UI.

### Inventory/COGS

Hiện tốt cho demo:

- Import receipt insert -> trigger tăng stock và cập nhật moving average import price.
- Invoice insert -> check stock với row lock, trigger giảm stock.
- COGS -> inventory movement snapshot, fallback import history, fallback current import price.

Khuyến nghị: nếu đề bài yêu cầu chuẩn kế toán hơn, ghi rõ phương pháp giá vốn là moving average/snapshot, không gọi FIFO nếu chưa có lot layers.

### Reports

Hiện report generic hỗ trợ month/quarter/year. Cần alias theo rubric và print HR report để tránh mất điểm khi giảng viên test URL trực tiếp.

### RBAC isolation

RBAC pass kiểm tra chính. Cần đổi admin bypass sang resolved role:

```js
if (resolveEffectiveRole(req.user) === 'admin') return next();
```

## 8. Database Corrections

### D1. Archive hotfix hoặc chuyển thành migration idempotent

Nếu giữ `hotfix_p0.sql`, không để runner/migration audit hiểu nhầm. Nên đổi thành migration đã guarded:

```sql
-- 043_archive_hotfix_p0_state.sql
-- Chỉ dùng để ghi nhận hotfix đã được fold vào schema/migrations chính.
INSERT IGNORE INTO schema_migrations (version, filename, checksum)
VALUES ('hotfix_p0_archived', 'hotfix_p0.sql', NULL);
```

### D2. Attendance seed demo

Không apply tự động trong audit. Đề xuất tạo file mới:

```sql
-- 043_seed_demo_attendance.sql
INSERT IGNORE INTO attendance_records
  (employee_id, shift_id, work_date, check_in_at, check_out_at, status,
   minutes_late, minutes_early_leave, overtime_minutes, work_day_value)
SELECT employee_id, 1, '2026-04-01', '2026-04-01 08:00:00', '2026-04-01 17:00:00',
       'present', 0, 0, 0, 1.00
FROM employees
WHERE employee_id IN (1,2,4);
```

### D3. Optional leave cancellation status

```sql
ALTER TABLE leave_requests
  MODIFY status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending';
```

### D4. Optional payroll export regression fixture

```sql
INSERT IGNORE INTO payroll_periods (month, year, status, created_by)
VALUES (4, 2026, 'draft', 1);
```

Sau đó test `GET /api/payroll/periods/:id/export`.

## 9. Dynamic Validation Scenarios

### Admin

- Login `admin/admin123`: pass.
- `/api/users`, `/api/roles`, supplier mapping, profit report: pass in demo smoke.
- Products/suppliers advanced search/filter/sort: implemented in FE, not fully mutated in audit.

### Staff

- `/api/staff/profile`: 200.
- `/api/staff/leaves`: 200.
- `/api/staff/salaries`: 200.
- `/api/staff/salary-formula`: covered by demo smoke.
- Exact rubric routes `/api/staff/my-leaves`, `/api/staff/my-salary`, `/api/staff/salary-slip/...`: 404.
- Salary print: missing in FE.

### HR Manager

- `/api/employees`: 200.
- `/api/leaves`: 200.
- `/api/payroll/periods`: 200, currently no periods returned in live check.
- `/api/reports/hr?year=2026&group_by=month`: 200.
- `/api/imports`: 403 as expected.

### Warehouse

- `/api/suppliers`: 200.
- `/api/products?limit=3`: 200.
- `/api/imports?limit=3`: 200.
- `/api/reports/inventory?year=2026&group_by=month`: 200.
- `/api/users`: 403 as expected.

### Sales

- `/api/invoices?limit=3`: 200.
- `/api/reports/sales-summary?year=2026&group_by=quarter`: 200, 4 periods.
- `/api/reports/profit?year=2026&group_by=quarter`: 200, 4 periods.

### Security/RBAC

- Staff cannot access `/api/users` or `/api/salaries`: 403.
- Warehouse cannot manage users: 403.
- HR cannot access imports: 403.
- Customer auth separated under `customerAuthRoutes`; internal `/api/customers` protected by `customers.*` permissions.

## 10. Demo Script 15-20 Phút

### 0-2 phút: Mở đầu

1. Mở `https://localhost/` để chứng minh HTTP redirect sang HTTPS.
2. Giới thiệu Julie Cosmetics là EIS gồm Admin, HR, Warehouse, Business/Sales, Staff Portal.
3. Nói rõ dữ liệu demo có products, suppliers, invoices, returns, promotions, salary rows.

### 2-5 phút: Admin

1. Login `admin/admin123`.
2. Vào `/admin`: dashboard tổng quan.
3. Vào Users/Roles: tạo/sửa user demo hoặc chỉ show role/permission matrix.
4. Vào Products/Suppliers: demo search/filter/sort nâng cao.
5. Vào Reports: chọn profit hoặc inventory, đổi month/quarter/year, in báo cáo lợi nhuận/kho.

Tránh: không mở payroll export nếu chưa fix method mismatch.

### 5-9 phút: HR Manager

1. Login hoặc chuyển workspace HR bằng `manager01/manager123`.
2. Employees: show CRUD nhân viên và modal đổi chức vụ có effective date + salary.
3. Show position history của một nhân viên.
4. Leaves: duyệt/từ chối đơn nghỉ; nhấn mạnh annual/sick/maternity/resignation.
5. Salaries/Payroll: show bảng lương và công thức; nếu chưa seed attendance, nói demo hiện dùng fixture salary rows.

Tránh: đừng nhấn export payroll period trước khi sửa issue #1.

### 9-12 phút: Staff Portal

1. Login `staff01/staff123`, vào `/staff`.
2. Profile: xem/sửa thông tin cá nhân.
3. My Leaves: nộp đơn nghỉ phép, xem lịch sử.
4. My Salary: show công thức và chi tiết phiếu lương.

Tránh: nếu giảng viên hỏi in bảng lương, nói đây là item đang cần bổ sung trước final; hoặc fix trước demo chính.

### 12-15 phút: Warehouse

1. Login `warehouse01/warehouse123`.
2. Suppliers: show CRUD + mapping sản phẩm nhà cung cấp.
3. Imports: tạo phiếu nhập demo nếu cần; kiểm stock tăng ở Products.
4. Reports: inventory report, in báo cáo kho.

### 15-18 phút: Sales/Business

1. Login `sales01/sales123`.
2. Invoices: tạo hóa đơn bán hàng nếu cần; hệ thống check stock và giá server-side.
3. Products: show stock giảm sau invoice.
4. Reports: sales-summary theo quý, profit theo quý; giải thích COGS dùng giá vốn snapshot/import history.

### 18-20 phút: Security/RBAC và kết luận

1. Thử staff vào `/api/users` hoặc UI Users: bị 403/redirect.
2. Thử warehouse vào Users: 403.
3. Kết luận: hệ thống ready demo core flows, cần polish salary print/export và production Docker trước final submission.

## 11. Known Issues / Workarounds Khi Demo

- Không bấm payroll export period trước khi sửa `findRecordsByPeriod`.
- Không yêu cầu URL exact kiểu `/api/reports/profit/quarterly`; dùng UI Reports hoặc query `group_by=quarter`.
- Staff salary hiện xem chi tiết tốt nhưng chưa in tháng/năm.
- Attendance demo đang rỗng; phần payroll nên demo bằng salary rows có sẵn, sau đó bổ sung seed chấm công.
- Production discussion: giải thích hiện compose demo dùng Vite dev server, bản final nên build static.

