# Julie Cosmetics Final Demo Rehearsal

Ngay truoc demo mon HTTTDN, da chay final verification theo completion report `docs/dev-notes/eis_completion_report_2026-04-28.md`.

## 1. Ket luan nhanh

- Demo readiness: Ready.
- P0/P1 blockers: Khong phat hien.
- Frontend build: PASS.
- Backend demo smoke: PASS.
- Docker Compose config/build/up: PASS.
- Route alias rubric va payroll export: PASS.
- RBAC regression: PASS.

## 2. Baseline

| Hang muc | Ket qua | Ghi chu |
|---|---:|---|
| `git status --short` | PASS co dirty tree | Dirty tree la cac thay doi completion/fix da co san; khong sua code chuc nang trong rehearsal nay. |
| `docker compose config --quiet` | PASS | Khong co output loi. |
| Backup tham chieu | PASS | Completion report ghi backup `database/backups/backup_20260428_234116.sql.gz`; rehearsal nay khong tao/sua data. |

Dirty tree ghi nhan:

```text
M README.md
M client/Dockerfile
M client/src/pages/staff/MySalaryPage.jsx
M client/src/services/staffService.js
M docker-compose.yml
M nginx/nginx.conf
M server/src/controllers/payrollController.js
M server/src/controllers/staffController.js
M server/src/models/payrollModel.js
M server/src/routes/reportRoutes.js
M server/src/routes/staffRoutes.js
?? client/nginx.conf
?? database/migrations/043_seed_demo_attendance_payroll.sql
?? database/migrations/README.md
?? docs/dev-notes/
?? test_payroll.sh
```

## 3. Command verification

| Lenh | Ket qua | Bang chung |
|---|---:|---|
| `docker compose config --quiet` | PASS | Khong co output loi. |
| `cd server && npm run demo:smoke` | PASS | `Demo smoke passed for all core roles.` |
| `cd client && npm run build` | PASS | Vite build thanh cong, `1254 modules transformed`, built in `12.07s`. |
| `docker compose build server client` | PASS | `Image juliecosmetics-server Built`, `Image juliecosmetics-client Built`. |
| `docker compose up -d` | PASS | MySQL healthy, server/client started, nginx running. |
| `docker compose ps` | PASS | `julie_mysql` healthy, `julie_client` healthy, `julie_server` up, `julie_nginx` up. |

Docker service status sau khi up:

```text
julie_client   Up (healthy)   0.0.0.0:5173->80/tcp
julie_mysql    Up (healthy)   0.0.0.0:3307->3306/tcp
julie_nginx    Up             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
julie_server   Up             0.0.0.0:5001->5001/tcp
```

## 4. Route verification

| Route | Token | Status | Ket qua |
|---|---|---:|---|
| `GET https://localhost/` | public | 200 | PASS |
| `GET https://localhost/staff` | public SPA | 200 | PASS |
| `GET https://localhost/api/public/categories` | public | 200 | PASS |
| `GET /api/staff/my-leaves` | staff01 | 200 | PASS |
| `GET /api/staff/my-salary?year=2026` | staff01 | 200 | PASS |
| `GET /api/staff/salary-slip/4/2026` | staff01 | 200 | PASS |
| `GET /api/staff/salary-slip/annual/2026` | staff01 | 200 | PASS |
| `GET /api/reports/hr/monthly?year=2026` | admin | 200 | PASS |
| `GET /api/reports/inventory/monthly?year=2026` | admin | 200 | PASS |
| `GET /api/reports/sales/quarterly?year=2026` | admin | 200 | PASS, `count=4` |
| `GET /api/reports/profit/quarterly?year=2026` | admin | 200 | PASS, `count=4` |
| `GET /api/payroll/periods/3/export` | admin | 200 | PASS |

## 5. RBAC regression

| Test | Expected | Actual | Ket qua |
|---|---:|---:|---|
| staff01 vao `/api/users` | 403 | 403 | PASS |
| staff01 xem `/api/payroll/records/1` | 403 | 403 | PASS |
| warehouse01 vao `/api/users` | 403 | 403 | PASS |
| manager01/HR vao `/api/imports` | 403 | 403 | PASS |
| `/api/customers?limit=1` khong expose password/hash | none | none | PASS |

## 6. UI smoke 5 role

Login API thanh cong cho tat ca tai khoan demo:

| Role | Account | Ket qua |
|---|---|---|
| Admin | `admin/admin123` | PASS |
| HR Manager | `manager01/manager123` | PASS |
| Staff | `staff01/staff123` | PASS |
| Warehouse | `warehouse01/warehouse123` | PASS |
| Sales | `sales01/sales123` | PASS |

SPA workspace refresh check:

| URL | Status | Ket qua |
|---|---:|---|
| `https://localhost/admin` | 200 | PASS |
| `https://localhost/hr` | 200 | PASS |
| `https://localhost/staff` | 200 | PASS |
| `https://localhost/warehouse` | 200 | PASS |
| `https://localhost/business` | 200 | PASS |
| `https://localhost/admin/login` | 200 | PASS |

## 7. Luu y demo

- Dung HTTPS local: `https://localhost` voi self-signed certificate, browser co the hien warning can accept.
- Dung duong dan workspace dung: Admin `/admin`, HR `/hr`, Staff `/staff`, Kho `/warehouse`, Kinh doanh `/business`.
- Phan Business/Sales dung `/business`, khong dung `/sales` vi route chinh cua app la `/business`.
- Payroll export da co the bam trong demo; khong con workaround "dung bam export".
- Staff salary co the demo nut in bang luong thang va nam tu trang `/staff/my-salary`.
- Dirty git tree la trang thai sau completion/fix; khong phai loi runtime.

## 8. Checklist thao tac demo cuoi

1. `docker compose up -d`
2. `docker compose ps` va xac nhan `mysql/client/server/nginx` dang up, MySQL va client healthy.
3. Mo `https://localhost` va accept self-signed certificate neu browser hoi.
4. Login `admin/admin123`, demo dashboard, users, roles, reports.
5. Login `manager01/manager123`, demo employees, leaves, payroll, HR reports.
6. Login `staff01/staff123`, demo profile, leave request, attendance, salary monthly/yearly print.
7. Login `warehouse01/warehouse123`, demo products, suppliers, imports, inventory report.
8. Login `sales01/sales123`, demo invoices, sales/profit reports.
9. Neu can chot ky thuat, chay `cd server && npm run demo:smoke`.

## 9. Final verdict

He thong san sang demo voi kich ban co kiem soat. Khong phat hien loi P0/P1 trong rehearsal nay.
