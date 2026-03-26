# 🌸 Julie Cosmetics

Ứng dụng e-commerce mỹ phẩm fullstack sử dụng **React** + **Node.js/Express** + **MySQL**.

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
# Sửa file server/.env với thông tin MySQL của bạn
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
- 🔌 **Backend API**: http://localhost:5000/api

## 👤 Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| Admin | admin@juliecosmetics.vn | admin123 |
| Customer | mai@gmail.com | 123456 |

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
│   └── seed.sql     # Sample Data
└── package.json     # Root (concurrently)
```

## 🔌 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/register` | Đăng ký |
| POST | `/api/auth/login` | Đăng nhập |
| GET | `/api/products` | Danh sách sản phẩm |
| GET | `/api/products/featured` | Sản phẩm nổi bật |
| GET | `/api/products/categories` | Danh mục |
| GET/POST | `/api/cart` | Giỏ hàng |
| POST | `/api/orders` | Tạo đơn hàng |
| GET | `/api/users` | Quản lý users (admin) |
