# Julie Cosmetics

Hệ thống quản lý mỹ phẩm phục vụ đồ án HTTT doanh nghiệp, gồm:

- Storefront cho khách hàng
- Admin dashboard cho bán hàng, kho, nhân sự, báo cáo
- API Express + MySQL
- Dữ liệu demo và tài khoản test sẵn sàng cho chạy thử

## Stack thực tế

- Frontend: React + Vite + Axios + Recharts
- Backend: Node.js + Express
- Database: MySQL 8
- Runtime demo: local dev hoặc Docker Compose

## Cổng chuẩn của dự án

- Client: `http://localhost:5173`
- Server API: `http://localhost:5001`
- MySQL host port mặc định: `localhost:3307`
- Frontend luôn gọi API qua `/api`
- App DB user mặc định: `julie_app / julie_demo_123`

## Tài khoản test mặc định

- `admin / admin123`
- `manager01 / manager123`
- `staff01 / staff123`
- `warehouse01 / warehouse123`

### Vai trò dùng khi demo

- `admin`: quản trị tài khoản, nhóm quyền, cấu hình, báo cáo toàn hệ thống
- `manager01`: quản lý nhân sự, lương thưởng, duyệt nghỉ phép, báo cáo HR
- `staff01`: dùng để demo khu kinh doanh nội bộ và self-service nhân viên
- `warehouse01`: dùng để demo kho, sản phẩm, nhà cung cấp, phiếu nhập

### Khôi phục nhanh tài khoản demo nếu DB bị drift

Nếu đăng nhập báo sai mật khẩu dù đang dùng đúng tài khoản trong README, DB demo của bạn nhiều khả năng đã bị đổi hash từ các lần test trước. Khi đó chạy:

```bash
npm run demo:reset-users
```

Lệnh này sẽ:

- reset lại 4 tài khoản demo về đúng mật khẩu công bố
- kích hoạt lại tài khoản nếu đang bị khóa
- xóa lịch sử throttle đăng nhập cho 4 tài khoản demo
- đồng bộ lại các quyền cốt lõi cần cho flow demo của admin / manager / staff / warehouse

Sau đó xác minh nhanh bằng:

```bash
npm run demo:smoke
```

## Flow khuyến nghị cho máy trắng

Flow ổn định nhất để demo là:

1. Dùng Docker để chạy MySQL đã tự init dữ liệu.
2. Chạy server + client bằng local Node.js để dễ debug và chỉnh sửa.

## Chuẩn bị môi trường

1. Cài Node.js 18+ và Docker Desktop.
2. Tạo file env:

```bash
cd "Julie Cosmetics"
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Cài dependencies:

```bash
npm run install:all
```

## Local run flow

1. Khởi động MySQL đã seed dữ liệu:

```bash
npm run db:up
```

2. Chạy client + server:

```bash
npm run dev
```

3. Smoke test backend nhanh:

```bash
npm run smoke:server
```

4. Mở:

- `http://localhost:5173`
- Admin login: `http://localhost:5173/admin/login`
- Nếu `5173` đang bận, Vite có thể tự chuyển sang `5174`; server đã cho phép local CORS cho `localhost/127.0.0.1`.

### Lưu ý local flow

- Sau khi pull patch setup mới, cần reset Docker volume 1 lần để chạy lại init scripts:

```bash
npm run docker:reset
```

- `docker compose up -d mysql` sẽ tự chạy:
  - [schema.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/schema.sql)
  - [seed.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/seed.sql)
  - [seed_rbac.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/seed_rbac.sql)
  - [seed_settings.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/seed_settings.sql)
- Sau khi DB sẵn sàng, nếu cần bổ sung thêm giao dịch demo thì chạy:

```bash
npm run seed:demo
```

- Script `seed:demo` có kiểm tra dữ liệu sẵn có và sẽ bỏ qua nếu demo data đã tồn tại.
- `seed:demo` và các script import dữ liệu sẽ đọc `DB_PORT` từ `.env`; cổng mặc định của Docker host là `3307`, không phải `3306`.
- Local backend mặc định sẽ đọc thêm file `.env` ở thư mục gốc để đồng bộ `DB_PORT/DB_PASSWORD/CLIENT_URL` với Docker Compose.
- Backend và script seed dùng app user `julie_app` thay vì `root`, để tránh lỗi TCP auth khi kết nối từ host vào MySQL Docker.
- Nếu muốn reset toàn bộ DB để seed lại từ đầu:

```bash
npm run docker:reset
npm run db:up
npm run seed:demo
```

- Nếu đang nâng cấp từ một DB cũ đã tạo trước patch mới nhất, hãy chạy thêm migration:

```bash
mysql -h 127.0.0.1 -P 3307 -u julie_app -p julie_cosmetics < database/migrations/031_fix_invoice_crm_status_accounting.sql
mysql -h 127.0.0.1 -P 3307 -u julie_app -p julie_cosmetics < database/migrations/032_create_salary_bonus_adjustments.sql
```

## Docker run flow

Chạy toàn bộ stack bằng Docker:

```bash
npm run docker:up
```

Compose sẽ chạy:

- `mysql`: tạo schema + seed base + RBAC + settings
- `server`: API tại cổng `5001`
- `client`: Vite dev server tại cổng `5173`
- `demo_seed`: tự bơm thêm hóa đơn / phiếu nhập / review nếu DB chưa có

Dừng stack:

```bash
npm run docker:down
```

Reset volume để chạy lại từ đầu:

```bash
npm run docker:reset
```

## Tính nhất quán API

- Client env mặc định dùng `VITE_API_URL=/api`
- Vite proxy dùng `VITE_PROXY_TARGET`
- Local dev proxy tới `http://localhost:5001`
- Docker client proxy tới `http://server:5001`
- Vì vậy browser luôn gọi cùng một dạng URL là `/api/...`

## Seed/demo data

### Base demo data

Được nạp tự động từ SQL init:

- Nhân sự, chức vụ, user, khách hàng
- Sản phẩm, nhà cung cấp, nhập kho, hóa đơn cơ bản
- Role, permission, role_permission, sync `role_id`
- Settings nghiệp vụ

### Extra demo transactions

[server/seed-demo.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/seed-demo.js) thêm:

- Import receipts bổ sung
- Invoices bổ sung
- Reviews bổ sung
- Cập nhật lại thống kê CRM theo các hóa đơn đã thanh toán

## Tập seed không nằm trong flow mặc định

[seed_catalog.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/seed_catalog.sql) là tập catalog mở rộng, không dùng trong flow demo mặc định vì nó xóa và nạp lại dữ liệu sản phẩm/giao dịch để phục vụ kịch bản dữ liệu khác.

## Backup / restore

- Backup: [backup.sh](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/backup.sh)
- Restore: [restore.sh](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/restore.sh)

Ví dụ restore:

```bash
cd database
./restore.sh backup_20260417_093000.sql.gz
```

Hoặc bỏ qua bước hỏi lại:

```bash
cd database
FORCE=1 ./restore.sh backup_20260417_093000.sql.gz
```

`restore.sh` hiện đã đọc cùng env với local/docker flow, dùng `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`, và có fallback sang container `julie_mysql` nếu máy chưa cài `mysql` client.

## Báo cáo để demo/chấm

Tại [ReportsPage](</Users/heisenbon/Documents/Workspace Code/HTTTDN/Julie Cosmetics/client/src/pages/ReportsPage.jsx>):

- Tab `💰 Lợi nhuận`: có nút `🖨️ In báo cáo lợi nhuận`
- Tab `📦 Kho hàng`: có nút `🖨️ In báo cáo kho` và `🖨️ In báo cáo xuất hàng`
- Bản in dùng cửa sổ print riêng, tối ưu cho trình duyệt, giữ phần tổng hợp + bảng số liệu để hạn chế lỗi layout khi demo

## Smoke checklist trước khi đi chấm

1. Chạy:

```bash
npm run db:up
npm run seed:demo
npm run demo:reset-users
npm run smoke:server
npm run demo:smoke
npm run dev
```

2. Kiểm tra nhanh từng role:

- `admin / admin123`
  - vào `/admin`
  - thấy menu `Tài khoản`, `Nhóm quyền`, `Cấu hình`
- `manager01 / manager123`
  - vào `/hr/employees`
  - mở `/hr/salaries`, tạo thưởng kỳ lương, tính lương, in bảng lương
- `staff01 / staff123`
  - vào `/business/invoices`
  - mở `Bảng lương cá nhân`, thấy thưởng/lý do thưởng nếu có
- `warehouse01 / warehouse123`
  - vào `/warehouse/imports`
  - mở tab `📦 Kho hàng`, in `Báo cáo kho`

3. Kiểm tra flow báo cáo bắt buộc:

- `Kho theo tháng/năm`: tab `📦 Kho hàng`, đổi `Theo tháng` hoặc `Theo năm`, bấm `🖨️ In báo cáo kho`
- `Xuất hàng theo tháng/quý/năm`: tab `📦 Kho hàng`, đổi kỳ, bấm `🖨️ In báo cáo xuất hàng`
- `Lợi nhuận theo tháng/quý/năm`: tab `💰 Lợi nhuận`, đổi kỳ, bấm `🖨️ In báo cáo lợi nhuận`
- `Nhân sự`: tab `👥 Nhân sự`, kiểm tra biểu đồ lương + thưởng theo tháng và bảng lương có lý do thưởng

## Checklist chạy demo nhanh

1. `cp .env.example .env && cp server/.env.example server/.env && cp client/.env.example client/.env`
2. `npm run install:all`
3. `npm run db:up`
4. `npm run seed:demo`
5. `npm run demo:reset-users`
6. `npm run smoke:server`
7. `npm run demo:smoke`
8. `npm run dev`
9. Đăng nhập `admin / admin123`

### Lệnh smoke ngắn nhất trước giờ chấm

```bash
npm run demo:prepare
```

Lệnh này sẽ:

- reset tài khoản demo
- kiểm tra health check backend
- đăng nhập `admin`, `manager01`, `staff01`, `warehouse01`
- kiểm tra endpoint chính của user/role, nhân sự, kho, bán hàng, báo cáo
