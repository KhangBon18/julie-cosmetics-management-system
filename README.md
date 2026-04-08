# 🌸 Julie Cosmetics - Fullstack E-commerce System

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

Hệ thống quản lý mỹ phẩm toàn diện tích hợp cửa hàng trực tuyến và bảng điều khiển quản trị (Admin Dashboard). Dự án được thiết kế chuyên nghiệp với kiến trúc Client-Server hiện đại, tập trung vào trải nghiệm người dùng và tính bảo mật cao.

## ✨ Tính năng nổi bật

### 🛒 Storefront (Khách hàng)
- **Giao diện Premium**: Thiết kế hiện đại, responsive hoàn toàn trên mọi thiết bị.
- **Giỏ hàng thông minh**: Quản lý giỏ hàng realtime, tính toán giá trị đơn hàng tự động.
- **Thanh toán đa phương thức**: Hỗ trợ các phương thức thanh toán phổ biến.

### 🛡️ Admin Dashboard (Quản trị)
- **RBAC (Role-Based Access Control)**: Hệ thống phân quyền chi tiết (Admin, Manager, Staff, Warehouse).
- **Quản lý tồn kho**: Theo dõi nhập/xuất kho, cảnh báo hàng sắp hết.
- **Báo cáo & Phân tích**: Biểu đồ doanh thu, lợi nhuận, sản phẩm bán chạy theo thời gian thực.
- **Quản lý nhân sự**: Chấm công, tính lương, quản lý đơn nghỉ phép.

## 🛠️ Stack Công nghệ

- **Frontend**: React.js, TailwindCSS, Framer Motion (Animations).
- **Backend**: Node.js, Express.js.
- **Database**: PostgreSQL / MySQL (Support Migrations).
- **Infrastructure**: Docker, Docker Compose, Rate Limiting Security.

## 📂 Cấu trúc dự án

```bash
├── client/          # Giao diện người dùng (React framework)
├── server/          # API logic & Business services (Node.js)
├── database/        # Schema & SQL migrations
├── docs/            # Tài liệu dự án & Báo cáo
└── docker-compose.yml
```

## 🚀 Cài đặt & Chạy dự án

### 📋 Yêu cầu hệ thống
- Node.js (v18+)
- Database: MySQL hoặc PostgreSQL
- Docker (Tùy chọn)

### 💻 Chạy Local
1. Clone dự án:
   ```bash
   git clone <your-repo-url>
   ```
2. Cài đặt dependencies:
   ```bash
   npm run install:all
   ```
3. Chạy môi trường phát triển:
   ```bash
   npm run dev
   ```

## 🔐 Phân quyền Hệ thống

| Vai trò | Quyền hạn chính |
| :--- | :--- |
| **Admin** | Toàn quyền hệ thống, quản lý tài khoản & phân quyền. |
| **Manager** | Quản lý sản phẩm, nhân viên, xem báo cáo doanh thu. |
| **Staff** | Tạo hóa đơn, quản lý khách hàng (CRM). |
| **Warehouse**| Quản lý nhập kho & Nhà cung cấp. |

---
*Dự án HTTTDN - Julie Cosmetics - 2026*
