# 🌸 Julie Cosmetics

Ứng dụng quản lý cửa hàng mỹ phẩm fullstack sử dụng **React** + **Node.js/Express** + **MySQL**.

## 📋 Yêu cầu

- **Node.js** >= 18
- **MySQL** >= 8.0
- **npm** >= 9

## 🚀 Cài đặt

### 1. Clone dự án

```bash
cd "Julie Cosmetics"
```

### 2. Tạo database

```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 3. Cấu hình môi trường

```bash
# Server
cp server/.env.example server/.env
# Sửa file server/.env với thông tin MySQL và JWT_SECRET riêng
```

### 4. Cài đặt dependencies

```bash
npm run install:all
```

### 5. Chạy dự án

```bash
npm run dev
```

- 🌐 **Frontend**: http://localhost:5173
- 🔌 **Backend API**: http://localhost:5001/api
- 🛍️ **Shop**: http://localhost:5173/shop

## 👤 Tài khoản mặc định

| Vai trò | Username | Mật khẩu |
|---------|----------|-----------|
| Admin | admin | admin123 |
| Manager | manager01 | manager123 |
| Nhân viên | staff01 | staff123 |
| Thủ kho | warehouse01 | warehouse123 |

> **Lưu ý:** Đăng nhập bằng **username** (không phải email) tại `/login`

## 📁 Cấu trúc dự án

```
Julie Cosmetics/
├── client/          # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── pages/       # Page Components
│   │   ├── context/     # React Context (Auth, Cart)
│   │   ├── hooks/       # Custom Hooks
│   │   ├── services/    # API Services (Axios)
│   │   └── utils/       # Helper Functions
│   └── ...
├── server/          # Node.js/Express Backend
│   ├── src/
│   │   ├── config/      # Database Config
│   │   ├── controllers/ # Request Handlers
│   │   ├── middleware/   # Auth, Error, Upload
│   │   ├── models/      # Database Models
│   │   ├── routes/      # API Routes
│   │   └── utils/       # Utilities
│   └── ...
├── database/        # SQL Scripts
│   ├── schema.sql   # Database Schema
│   ├── seed.sql     # Sample Data
│   ├── backup.sh    # Backup Script
│   └── restore.sh   # Restore Script
└── package.json     # Root (concurrently)
```

## 🔌 API Endpoints chính

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập (username + password) |
| GET | `/api/auth/profile` | Thông tin user hiện tại |
| PUT | `/api/auth/change-password` | Đổi mật khẩu |
| GET/POST/PUT/DELETE | `/api/products` | Quản lý sản phẩm |
| GET/POST/PUT/DELETE | `/api/employees` | Quản lý nhân viên |
| GET/POST/PUT/DELETE | `/api/customers` | Quản lý khách hàng CRM |
| GET/POST/DELETE | `/api/invoices` | Hóa đơn bán hàng |
| GET/POST/DELETE | `/api/imports` | Phiếu nhập kho |
| GET/POST | `/api/leaves` | Đơn nghỉ phép |
| GET/POST | `/api/salaries` | Bảng lương |
| GET | `/api/reports/*` | Báo cáo (revenue, profit, top-products, inventory, hr) |
| GET | `/api/public/products` | Shop công khai (không cần auth) |
| GET | `/api/staff/*` | Cổng nhân viên |
| GET | `/api/health` | Health check |

## 🔑 Phân quyền

| Role | Quyền |
|------|-------|
| **admin** | Toàn quyền, quản lý tài khoản |
| **manager** | Quản lý nhân viên, sản phẩm, báo cáo, phê duyệt nghỉ phép |
| **staff** | Tạo hóa đơn, quản lý khách hàng, xem thông tin cá nhân |
| **warehouse** | Nhập kho, quản lý nhà cung cấp |
