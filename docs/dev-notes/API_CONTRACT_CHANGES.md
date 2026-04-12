# Julie Cosmetics — API Contract Changes

> Last updated: 11/04/2026

## New Endpoints

### `POST /api/public/checkout` (NEW)
Guest checkout — creates an invoice from cart items.

**Request:**
```json
{
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 5, "quantity": 1 }
  ],
  "customer_name": "Nguyễn Văn A",
  "customer_phone": "0901234567",
  "customer_email": "email@example.com",
  "shipping_address": "123 Nguyễn Huệ, Q.1, TP.HCM",
  "payment_method": "cod",
  "note": "Giao buổi sáng"
}
```

**Response (201):**
```json
{
  "message": "Đặt hàng thành công!",
  "order": {
    "order_id": 42,
    "total": 1500000,
    "items_count": 2,
    "payment_method": "cod",
    "created_at": "2026-03-27T00:00:00.000Z"
  }
}
```

**Validation:**
- `items` — required, array min 1
- `items.*.product_id` — required, int >= 1
- `items.*.quantity` — required, int >= 1
- `customer_name` — required, non-empty
- `customer_phone` — required, non-empty
- `payment_method` — required, one of: `cash`, `transfer`, `cod`

**Security:**
- Prices always looked up server-side (not from client)
- Stock validated before checkout (returns 400 if insufficient)
- Product `is_active` checked
- Creates invoice with `customer_id: null` (guest order)

---

## Modified Endpoints

### `POST /api/returns`
**Behavior changes:**
- `unit_price` từ client **bị bỏ qua**; hệ thống lấy giá từ `invoice_items`.
- `items` bắt buộc thuộc về hóa đơn gốc.
- Không cho trả vượt quá số lượng còn lại (đã trừ các lần đổi trả trước đó, trừ `rejected`).

**Request (khuyến nghị):**
```json
{
  "invoice_id": 42,
  "return_type": "refund",
  "reason": "Sản phẩm lỗi",
  "items": [
    { "product_id": 3, "quantity": 1, "reason": "Hộp bị móp" }
  ]
}
```

**Response:** không đổi.

### `GET /api/public/products`
**Added query params:**
- `min_price` — filter products with sell_price >= value
- `max_price` — filter products with sell_price <= value

**No breaking changes.** Existing params unchanged.

---

## Validation Changes

All following routes now enforce server-side validation via `express-validator`:

| Route | Validation | Status |
|-------|------------|--------|
| `POST /api/products` | `validateProduct` | **NEW** |
| `PUT /api/products/:id` | `validateProduct` | **NEW** |
| `POST /api/employees` | `validateEmployee` | **NEW** |
| `PUT /api/employees/:id` | `validateEmployee` | **NEW** |
| `POST /api/customers` | `validateCustomer` | **NEW** |
| `PUT /api/customers/:id` | `validateCustomer` | **NEW** |
| `POST /api/leaves` | `validateLeave` | **NEW** |
| `POST /api/salaries/generate` | `validateSalaryGenerate` | **NEW** |
| `POST /api/users` | `validateUserCreate` | **NEW** |
| `POST /api/auth/login` | `validateLogin` | Already existed |
| `PUT /api/auth/change-password` | `validateChangePassword` | Already existed |
| `POST /api/invoices` | `validateInvoice` | Already existed |
| `POST /api/imports` | `validateImport` | Already existed |
| `POST /api/returns` | `validateReturn` | **NEW** |

**Validation error format (all routes):**
```json
{
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    { "type": "field", "msg": "Tên sản phẩm là bắt buộc", "path": "product_name", "location": "body" }
  ]
}
```
