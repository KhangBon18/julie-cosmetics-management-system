**Lưu ý quan trọng:** File `.zip` (Julie_Cosmetics) không được xử lý vào môi trường container — đây là giới hạn kỹ thuật với file nén. Tôi sẽ tiến hành phân tích toàn diện **đề cương yêu cầu đồ án** trước, sau đó bạn có thể paste trực tiếp code/SQL để tôi phân tích chi tiết hơn.

---

# 📊 PHÂN TÍCH TOÀN DIỆN ĐỒ ÁN HTTTDN — JULIE COSMETICS

---

## 1. TỔNG QUAN YÊU CẦU ĐỒ ÁN (SGU — HK2 2025–2026)

Đề tài: **Hệ thống thông tin quản lý doanh nghiệp thương mại mỹ phẩm (Julie Cosmetics)**

| Hạng mục             | Điểm tối đa |
| -------------------- | ----------- |
| Phần báo cáo (TCI)   | 40đ         |
| Phần phần mềm (TCII) | 60đ         |
| **Tổng**             | **100đ**    |

---

## 2. PHÂN TÍCH CHI TIẾT YÊU CẦU ĐỒ ÁN

### 2.1 Phần Báo Cáo (40đ) — Các mục cần đảm bảo

**Mục I — Phần chung (10đ)**

| Yêu cầu            | Nội dung cần có                              | Ghi chú           |
| ------------------ | -------------------------------------------- | ----------------- |
| Giới thiệu DN (5đ) | Lịch sử, mô hình tổ chức, hoạt động, nhân sự | Cần sơ đồ tổ chức |
| Khảo sát HTTT (5đ) | Bảng câu hỏi ≥15 câu, tổng kết + kết luận    | Phải bám sát HTTT |

**Mục 2 — Phân tích HTTT (10đ)**

| Yêu cầu                               | Điểm | Ghi chú                     |
| ------------------------------------- | ---- | --------------------------- |
| Bài toán mô tả chi tiết               | 2đ   | Mô tả đầy đủ nghiệp vụ      |
| Sơ đồ chức năng (BFD)                 | 2đ   | Phân rã chức năng hệ thống  |
| Sơ đồ ngữ cảnh (Context DFD)          | 2đ   | Các tác nhân ngoài hệ thống |
| Luồng DL mức đỉnh (DFD Level 0)       | 2đ   | Các tiến trình chính        |
| Luồng DL mức dưới đỉnh (DFD Level 1+) | 2đ   | Chi tiết từng tiến trình    |

**Mục 3 — Thiết kế HTTT (10đ)**

| Yêu cầu                                                 | Điểm |
| ------------------------------------------------------- | ---- |
| Thiết kế CSDL: Lược đồ + bảng mô tả thuộc tính          | 5đ   |
| Thiết kế giao diện: Hình ảnh + mô tả chi tiết chức năng | 5đ   |

**Mục 4 — Cài đặt & Bảo trì (5đ)**

- Phương án cài đặt hệ thống
- Phương án chuyển đổi từ hệ thống cũ (nếu có)
- Tài liệu hướng dẫn sử dụng

**Mục 5 — Tổng kết & Hướng phát triển (5đ)**

- Đánh giá những gì đã làm được, ưu/nhược điểm
- Hướng phát triển tương lai

---

### 2.2 Phần Phần Mềm (60đ) — Yêu cầu chức năng chi tiết

#### Module 1 — Cài đặt CSDL (10đ)

```
✅ Yêu cầu:
  - CSDL đầy đủ tất cả các bảng
  - Có phương án sao lưu và phục hồi CSDL (5đ riêng)
  - Script SQL phải hoàn chỉnh
```

#### Module 2 — Giao diện Admin (10đ)

```
✅ Yêu cầu:
  - Giao diện Admin tách biệt hoàn toàn (không chung với HR/kho/bán hàng)
  - Xem, tìm kiếm, tìm kiếm nâng cao, sắp xếp, lọc: sản phẩm, nhà cung cấp...
  - Quản lý user: thêm/xóa/sửa/phân quyền
  - Tạo và xem báo cáo theo thời gian
```

#### Module 3 — Quản lý Nhân Sự (20đ)

**3.1 Nhân viên (10đ):**

```
  - Xem/sửa thông tin cá nhân
  - Nộp đơn: xin nghỉ phép / nghỉ ốm / thai sản / nghỉ việc
  - Xem cách tính lương + lương từng tháng
  - In bảng lương theo tháng
  - In bảng lương theo năm
```

**3.2 Người quản lý (10đ):**

```
  - Thêm/xóa nhân sự
  - Thay đổi chức vụ (có lưu thời điểm + cập nhật lương theo)
  - Tính lương cho nhân sự
  - Duyệt đơn: nghỉ phép / nghỉ ốm / thai sản / nghỉ việc
  - Thống kê nhân sự, lương, thưởng theo tháng/năm
```

#### Module 4 — Quản lý Hoạt Động Thương Mại (20đ)

**4.1 Quản lý Kho (10đ):**

```
  - Quản lý sản phẩm: giá bán, số lượng tồn, giá nhập
  - Thêm/xóa/sửa sản phẩm
  - Lập phiếu nhập kho
  - Thêm/sửa/xóa/tìm kiếm nhà cung cấp
  - Báo cáo thống kê sản phẩm theo tháng/năm
```

**4.2 Quản lý Kinh Doanh / Bán Hàng (10đ):**

```
  - Lập phiếu xuất (hóa đơn bán): số lượng bán, giá bán
  - Thống kê sản phẩm đã xuất theo tháng/quý/năm
  - Thống kê lợi nhuận theo tháng/quý/năm
```

---

## 3. ĐÁNH GIÁ MỨC ĐỘ ĐÁP ỨNG (Framework kiểm tra)

Dưới đây là bảng checklist để đối chiếu hệ thống hiện tại của bạn:

### 3.1 Checklist Cơ Sở Dữ Liệu

| Bảng cần có                        | Mục đích                    | Mức độ quan trọng |
| ---------------------------------- | --------------------------- | ----------------- |
| `users` / `accounts`               | Đăng nhập, phân quyền       | 🔴 Bắt buộc       |
| `roles` / `permissions`            | Phân quyền hệ thống         | 🔴 Bắt buộc       |
| `employees`                        | Thông tin nhân viên         | 🔴 Bắt buộc       |
| `departments` / `positions`        | Phòng ban, chức vụ          | 🔴 Bắt buộc       |
| `position_history`                 | Lịch sử thay đổi chức vụ    | 🔴 Bắt buộc       |
| `leave_requests`                   | Đơn nghỉ phép, nghỉ ốm...   | 🔴 Bắt buộc       |
| `salary_config`                    | Cấu hình lương theo chức vụ | 🔴 Bắt buộc       |
| `payroll`                          | Bảng lương từng tháng       | 🔴 Bắt buộc       |
| `products`                         | Thông tin sản phẩm          | 🔴 Bắt buộc       |
| `categories`                       | Danh mục sản phẩm           | 🟡 Nên có         |
| `suppliers`                        | Nhà cung cấp                | 🔴 Bắt buộc       |
| `import_receipts`                  | Phiếu nhập kho              | 🔴 Bắt buộc       |
| `import_receipt_details`           | Chi tiết phiếu nhập         | 🔴 Bắt buộc       |
| `sales_orders` / `export_receipts` | Phiếu xuất/bán hàng         | 🔴 Bắt buộc       |
| `sales_order_details`              | Chi tiết phiếu bán          | 🔴 Bắt buộc       |
| `inventory`                        | Tồn kho                     | 🔴 Bắt buộc       |

### 3.2 Checklist Kiến Trúc & Bảo Mật

| Tiêu chí        | Yêu cầu tối thiểu   | Tiêu chuẩn tốt               |
| --------------- | ------------------- | ---------------------------- |
| Authentication  | Session-based login | JWT / Session + Refresh      |
| Authorization   | Role check per page | Middleware phân quyền        |
| Password        | Lưu plain text ❌   | bcrypt hash ✅               |
| SQL Injection   | Raw query ❌        | Prepared statements / ORM ✅ |
| CSRF Protection | Không có ❌         | CSRF token ✅                |
| Admin tách biệt | Cùng route ❌       | Route/subdomain riêng ✅     |

---

## 4. CÁC ĐIỂM YẾU PHỔ BIẾN TRONG ĐỒ ÁN LOẠI NÀY

Dựa trên chuẩn đồ án HTTTDN và kinh nghiệm phân tích hệ thống thương mại, các vấn đề thường gặp:

### 4.1 Về Database

- ❌ **Thiếu bảng `position_history`** → Không lưu được lịch sử thay đổi chức vụ (yêu cầu 3.2 của đề bài)
- ❌ **Thiếu logic tính lương tự động** → Lương gắn với chức vụ, khi đổi chức vụ phải có hiệu lực theo ngày
- ❌ **Không có cơ chế tồn kho** → Không tự động cộng/trừ số lượng khi nhập/xuất
- ❌ **Thiếu bảng phân quyền chi tiết** → Admin, quản lý, nhân viên, thủ kho, kinh doanh dùng chung bảng

### 4.2 Về Code

- ❌ **Không có middleware phân quyền** → Mọi user đều có thể truy cập mọi route
- ❌ **Giao diện Admin không tách biệt** → Vi phạm yêu cầu mục II.2
- ❌ **Thiếu validation input** → XSS, SQL injection
- ❌ **Không có chức năng in bảng lương** (yêu cầu xuất PDF/print)

### 4.3 Về Nghiệp Vụ

- ❌ **Logic duyệt đơn không đầy đủ** → Đơn nghỉ phép cần có workflow: nộp → chờ duyệt → duyệt/từ chối
- ❌ **Thống kê lợi nhuận thiếu chính xác** → Cần công thức: Doanh thu − Giá vốn hàng bán = Lợi nhuận gộp
- ❌ **Không có báo cáo theo quý** → Yêu cầu thống kê theo tháng/quý/năm

---

## 5. ĐỀ XUẤT CẢI TIẾN HỆ THỐNG

### 5.1 Kiến trúc hệ thống đề xuất

```
Julie Cosmetics EIS
├── /admin          → Admin panel (riêng biệt, middleware: isAdmin)
├── /hr             → HR Module (middleware: isHRManager | isEmployee)
│   ├── /employees  → Danh sách, thêm/sửa/xóa nhân viên
│   ├── /leaves     → Quản lý nghỉ phép
│   ├── /payroll    → Tính lương, bảng lương
│   └── /positions  → Chức vụ, lịch sử thay đổi
├── /warehouse      → Kho (middleware: isWarehouseStaff)
│   ├── /products   → Sản phẩm
│   ├── /suppliers  → Nhà cung cấp
│   └── /imports    → Phiếu nhập kho
└── /sales          → Kinh doanh (middleware: isSalesStaff)
    ├── /orders     → Phiếu xuất/bán hàng
    └── /reports    → Thống kê doanh thu, lợi nhuận
```

### 5.2 Mô hình CSDL đề xuất (quan hệ cốt lõi)

```sql
-- Phân quyền
users (id, username, password_hash, role_id, employee_id, is_active)
roles (id, name, description)  -- admin, hr_manager, employee, warehouse, sales

-- Nhân sự
employees (id, full_name, dob, gender, phone, address, hire_date, status)
departments (id, name, manager_id)
positions (id, name, department_id, base_salary)
position_history (id, employee_id, position_id, effective_date, end_date, salary_at_time)

-- Nghỉ phép
leave_types (id, name, max_days_per_year)  -- annual, sick, maternity, resignation
leave_requests (id, employee_id, leave_type_id, from_date, to_date, reason,
                status, approved_by, approved_at)

-- Lương
salary_config (id, position_id, base_salary, allowance, effective_date)
payroll (id, employee_id, month, year, working_days, leave_days,
         base_salary, allowance, deductions, net_salary, is_finalized)

-- Sản phẩm & Kho
categories (id, name)
products (id, name, category_id, unit, selling_price, stock_quantity, description)
suppliers (id, name, contact_person, phone, email, address, is_active)

-- Nhập kho
import_receipts (id, supplier_id, created_by, import_date, total_amount, notes)
import_receipt_details (id, receipt_id, product_id, quantity, unit_price, subtotal)

-- Bán hàng
sales_orders (id, created_by, order_date, customer_name, total_amount, status)
sales_order_details (id, order_id, product_id, quantity, unit_price,
                     cost_price_at_sale, subtotal)
-- cost_price_at_sale: lưu giá vốn tại thời điểm bán để tính lợi nhuận chính xác
```

### 5.3 Logic nghiệp vụ quan trọng cần implement

**a) Tính lương tự động:**

```
Lương thực nhận = Lương cơ bản × (Ngày công thực tế / Tổng ngày công)
                + Phụ cấp - Các khoản khấu trừ
```

**b) Tính lợi nhuận:**

```
Doanh thu = SUM(quantity × selling_price) per order
Giá vốn   = SUM(quantity × cost_price_at_sale) per order
Lợi nhuận = Doanh thu − Giá vốn
```

**c) Workflow nghỉ phép:**

```
PENDING → [Manager duyệt] → APPROVED
         [Manager từ chối] → REJECTED
```

**d) Trigger tồn kho:**

```sql
-- Sau mỗi phiếu nhập: stock_quantity += quantity nhập
-- Sau mỗi phiếu xuất: stock_quantity -= quantity xuất
-- Cần kiểm tra: stock_quantity >= quantity xuất trước khi tạo phiếu
```

---

## 6. ĐÁNH GIÁ & GỢI Ý CHO BÁO CÁO ĐỒ ÁN

### 6.1 Mục 5 — Tổng kết (nên viết như sau)

**Đã làm được:**

- Xây dựng hệ thống với 4 module chính: Admin, Nhân sự, Kho hàng, Kinh doanh
- Thiết kế CSDL quan hệ với N bảng, đáp ứng các nghiệp vụ cốt lõi
- Phân quyền theo vai trò (RBAC)
- Giao diện responsive, thân thiện người dùng

**Hạn chế:**

- Chưa tích hợp thông báo real-time (email/SMS khi duyệt đơn)
- Chưa có API REST để tích hợp ứng dụng mobile
- Báo cáo chưa hỗ trợ xuất Excel/PDF đầy đủ
- Chưa có cơ chế audit log (lưu lịch sử thao tác)

**Hướng phát triển:**

- Tích hợp module CRM quản lý khách hàng
- Phát triển ứng dụng mobile cho nhân viên
- Tích hợp hệ thống kế toán (accounting module)
- Triển khai trên cloud (VPS/Docker) với CI/CD pipeline
- Bổ sung dashboard analytics với biểu đồ trực quan

---
