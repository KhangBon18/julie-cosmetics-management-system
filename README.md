# Julie Cosmetics

Hệ thống thông tin doanh nghiệp cho cửa hàng mỹ phẩm, phục vụ đồ án HTTTDN SGU. Codebase hiện tại gồm:

- Storefront cho khách hàng
- Dashboard nội bộ đa workspace cho `Admin / HR / Warehouse / Business / Staff Portal`
- API Express + MySQL 8
- Demo data, smoke scripts, Docker Compose, backup/restore

## Stack và cổng chuẩn

- Frontend: React 18 + Vite + Axios + Recharts
- Backend: Node.js + Express
- Database: MySQL 8
- Docker: `mysql`, `server`, `client`, `demo_seed`, `nginx`

Ports mặc định:

- Frontend dev: `http://localhost:5173`
- API trực tiếp: `http://localhost:5001`
- HTTPS reverse proxy: `https://localhost`
- MySQL host port: `localhost:3307`

Health / compatibility endpoints:

- `GET /health`
- `GET /api/health`
- `GET /api/attendance`
- `GET /api/attendances`
- `GET /api/reports/sales-summary`

## Mapping theo phần II SGU

Hệ thống đáp ứng phần II theo mô hình multi-workspace dashboard:

| Khu vực | Route chính | Vai trò demo | Nội dung chấm chính |
|---|---|---|---|
| Admin | `/admin` | `admin` | user, role, settings, báo cáo toàn hệ thống |
| HR | `/hr` | `manager01` | nhân sự, duyệt nghỉ, chấm công, tính lương, báo cáo HR |
| Warehouse | `/warehouse` | `warehouse01` | sản phẩm, nhà cung cấp, phiếu nhập, báo cáo kho |
| Business | `/business` | `sales01` | hóa đơn bán hàng, khách hàng, doanh thu, lợi nhuận |
| Staff Portal | `/staff` | `staff01` | hồ sơ cá nhân, nghỉ phép, chấm công, bảng lương |

Lưu ý học thuật:

- Hệ thống **không** tách thành nhiều frontend app độc lập; đây là một dashboard nội bộ đa workspace.
- Nghiệp vụ bán hàng dùng `invoices` làm thực thể trung tâm. Không tự thêm bảng `orders` vào báo cáo nếu muốn bám codebase.
- “Phiếu xuất” của đề bài được thể hiện qua hóa đơn bán hàng + thống kê xuất hàng trong báo cáo kho.

## Tài khoản demo

- `admin / admin123`
- `manager01 / manager123`
- `staff01 / staff123`
- `sales01 / sales123`
- `warehouse01 / warehouse123`

## Chuẩn bị môi trường

1. Tạo env:

```bash
cd "Julie Cosmetics"
cp .env.example .env
cp server/.env.example server/.env
cp client/.env.example client/.env
```

2. Cài dependencies:

```bash
npm run install:all
```

## Flow khuyến nghị để chạy demo

### Cách nhanh nhất

```bash
npm run db:up
npm run demo:prepare
npm run dev
```

`npm run demo:prepare` hiện sẽ:

- chạy migration qua `schema_migrations`
- reset tài khoản demo về đúng credential công bố
- dựng lại demo fixtures quan trọng
- sửa text demo bị mojibake nếu phát hiện
- smoke backend
- smoke toàn bộ 5 vai chính

### Chạy full Docker stack

```bash
docker compose up -d --build
```

Stack Docker sẽ mở:

- `http://localhost:5173` cho Vite dev client
- `http://localhost:5001` cho API trực tiếp
- `https://localhost` qua `nginx`

Reset volume nếu cần init lại từ đầu:

```bash
docker compose down -v
docker compose up -d --build
```

## Migrate, seed và dữ liệu demo

### Migration

```bash
npm run db:migrate
cd server && npm run migrate:status
```

### Seed / phục hồi demo

```bash
npm run seed:demo
npm run demo:reset-users
npm run demo:fixtures
npm run demo:fix-text
```

Ý nghĩa:

- `seed:demo`: thêm giao dịch demo mở rộng
- `demo:reset-users`: đồng bộ lại 5 tài khoản demo
- `demo:fixtures`: đảm bảo đủ invoice pending, leave pending, payroll/bonus, supplier fallback
- `demo:fix-text`: sửa text lỗi mã hóa trong DB cũ nếu có

## Smoke / build / verify

```bash
npm run smoke:server
npm run demo:smoke
cd client && npm run build
docker compose config --quiet
```

## Những gì nên demo để lấy điểm phần II

### 1. CSDL

- Chạy backup/restore scripts:
  - [database/backup.sh](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/backup.sh)
  - [database/restore.sh](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/restore.sh)
- Nêu rõ DB đã có migration runner và dữ liệu demo cho HR, kho, bán hàng.

### 2. Admin

- Đăng nhập `admin`
- Vào `Tài khoản`, `Nhóm quyền`, `Cấu hình`, `Báo cáo`
- Từ `Nhà cung cấp`, mở phần mapping sản phẩm để trình bày kiểm soát NCC

### 3. Module nhân sự

- `manager01` vào `/hr`
- Demo:
  - quản lý nhân viên
  - thay đổi chức vụ
  - duyệt nghỉ phép / nghỉ việc
  - tính lương và thưởng
  - in bảng lương tháng/năm
- `staff01` vào `/staff`
- Demo:
  - hồ sơ cá nhân
  - nộp đơn nghỉ
  - xem chấm công
  - xem/in bảng lương

### 4. Module kho

- `warehouse01` vào `/warehouse`
- Demo:
  - quản lý sản phẩm
  - nhà cung cấp
  - phiếu nhập
  - báo cáo kho theo tháng / quý / năm

### 5. Module kinh doanh

- `sales01` vào `/business`
- Demo:
  - lập hóa đơn bán hàng
  - quản lý khách hàng
  - case hóa đơn chờ thanh toán
  - báo cáo doanh thu, lợi nhuận, xuất hàng

## Backup / restore

Ví dụ backup:

```bash
bash database/backup.sh
```

Ví dụ restore:

```bash
cd database
./restore.sh backup_20260427_011000.sql.gz
```

## Tài liệu hỗ trợ chấm bài

- Rubric mapping: [REPORT_PACK/01_RUBRIC_MAPPING.md](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/REPORT_PACK/01_RUBRIC_MAPPING.md)
- Demo checklist: [docs/demo-qa-checklist.md](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/docs/demo-qa-checklist.md)
- Assignment source of truth: [docs/project-assignments/SGU - 2025_2026 - HK2 - DO AN HTTTDN.docx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/docs/project-assignments/SGU%20-%202025_2026%20-%20HK2%20-%20DO%20AN%20HTTTDN.docx)

## Ghi chú trung thực khi viết báo cáo

- “Admin tách biệt” trong phạm vi đồ án được đáp ứng theo mô hình workspace tách vai, không phải nhiều app độc lập.
- Các tab báo cáo hiện dùng tên nghiệp vụ thực tế của repo: `Doanh thu`, `Lợi nhuận`, `Kho hàng`, `Nhân sự`.
- Nếu cần nói “báo cáo sản phẩm theo tháng/năm”, nên map vào báo cáo kho và xuất hàng hiện có, không bịa thêm module riêng.
- Nếu cần nói “phiếu xuất”, nên trình bày qua `Hóa đơn bán hàng` + `thống kê xuất hàng`.
