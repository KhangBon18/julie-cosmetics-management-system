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

3. Mở:

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
- Cập nhật lại thống kê CRM theo hóa đơn

## Tập seed không nằm trong flow mặc định

[seed_catalog.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/seed_catalog.sql) là tập catalog mở rộng, không dùng trong flow demo mặc định vì nó xóa và nạp lại dữ liệu sản phẩm/giao dịch để phục vụ kịch bản dữ liệu khác.

## Backup / restore

- Backup: [backup.sh](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/backup.sh)
- Restore: [restore.sh](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/restore.sh)

## Checklist chạy demo nhanh

1. `cp .env.example .env && cp server/.env.example server/.env && cp client/.env.example client/.env`
2. `npm run install:all`
3. `npm run db:up`
4. `npm run seed:demo`
5. `npm run dev`
6. Đăng nhập `admin / admin123`
