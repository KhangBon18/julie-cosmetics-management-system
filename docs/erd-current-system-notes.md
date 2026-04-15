# ERD current system notes - Julie Cosmetics

Tai lieu nay giai thich pham vi va cac quyet dinh mo hinh cho file [erd-current-system.dbml](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/docs/erd-current-system.dbml).

## Nguon su that de dung ve ERD

ERD duoc dung theo thu tu uu tien sau:

1. `database/schema.sql`
2. `server/src/models/*` va `server/src/routes/*`
3. Tai lieu nghiep vu trong `docs/`

Ly do:

- `schema.sql` cho ta cau truc du lieu muc tieu.
- `models/controllers` cho biet bang nao dang duoc nghiep vu su dung that.
- Tai lieu DFD/BFD giup kiem tra lai vai tro cua tung thuc the trong quy trinh.

## 4 cum thuc the chinh

### 1. Nhan su va RBAC

- `employees` la thuc the nhan su goc.
- `positions` la danh muc chuc vu.
- `employee_positions` luu lich su bo nhiem va muc luong theo thoi diem.
- `users` la tai khoan noi bo, co the gan hoac khong gan voi `employees`.
- `roles`, `permissions`, `role_permissions` la lop phan quyen hien tai.
- `leave_requests` va `salaries` phu thuoc truc tiep vao `employees`.

### 2. Kho va san pham

- `products` la bang trung tam.
- `brands`, `categories`, `suppliers` la danh muc/doi tac.
- `import_receipts` va `import_receipt_items` theo doi nhap kho.
- `inventory_movements` la bang audit nghiep vu kho.
- `product_images` va `product_skin_types` la bang mo rong thuoc tinh san pham.

### 3. Ban hang va CRM

- `customers` vua la CRM customer, vua la tai khoan storefront.
- `invoices` la bang trung tam cua ca ban tai quay va don online.
- `invoice_items` la chi tiet dong hang.
- `promotions`, `reviews`, `payment_transactions`, `shipping_orders`, `returns`, `return_items` mo ta day du hau giao dich.
- `customer_addresses` la so dia chi; tuy nhien don online public hien tai thuong luu snapshot dia chi ngay trong `shipping_orders`.

### 4. He thong va bao mat

- `settings` la key-value config.
- `notifications`, `refresh_tokens`, `login_attempts`, `audit_logs` la bang he thong.
- 3 bang `notifications`, `refresh_tokens`, `audit_logs` dung kieu lien ket da hinh staff/customer/system, nen khong nen ve FK cung vao mot bang duy nhat.

## Nhung diem quan trong khi bao ve ERD

### 1. Khong co bang cart

Storefront hien tai luu gio hang bang `localStorage` o frontend, khong persist trong MySQL.

He qua:

- Khong dua `cart` vao ERD.
- Quy trinh checkout di thang vao `invoices` + `invoice_items`.

Bang chung:

- `client/src/context/CartContext.jsx`
- `server/src/routes/publicRoutes.js`

### 2. Khong co bang orders rieng

He thong dung `invoices` cho ca:

- hoa don tai quay
- don dat online

Vi vay, neu ve them `orders` se lam sai nghiep vu hien tai.

### 3. `users` dang la mo hinh lai

`users` hien co dong thoi:

- `role`: enum cu
- `role_id`: FK toi `roles`

Day la trang thai chuyen tiep de dam bao tuong thich nguoc. ERD nen giu ca hai neu muon phan anh code hien tai trung thuc.

### 4. `products` cung dang co du lieu lai

`products.skin_type` van duoc UI/API doc truc tiep, nhung DB da bo sung:

- `skin_types`
- `product_skin_types`

ERD nen giu ca 2 lop va ghi chu ro:

- `skin_type` = legacy/display nhanh
- `product_skin_types` = mo hinh chuan hoa cho tuong lai

## Do lech giua codebase va DB demo dang chay

Tai workspace hien tai, DB MySQL dang chay chua hoan toan dong bo voi codebase. Cu the:

1. `users.role_id` da ton tai trong DB demo.
2. `leave_requests.leave_type` trong code da co `resignation`, nhung DB demo co the chua cap nhat.
3. `return_items.refund_subtotal` duoc code su dung, nhung DB demo cu co the chua co cot nay.

Vi vay:

- Neu ban ve ERD de lam bao cao phan tich he thong hien tai theo codebase, dung file `erd-current-system.dbml`.
- Neu ban ve ERD cho "schema cua Docker volume dang chay ngay luc nay", can reset DB hoac export lai sau khi dong bo.

## Goi y thuyet trinh ngan

Neu giang vien hoi vi sao khong co `cart` hoac `orders`, ban co the tra loi:

`Julie Cosmetics hien tai luu gio hang tam thoi o frontend va dung bang invoices lam thuc the don hang trung tam cho ca POS lan online, nen ERD chuan cua he thong hien tai khong tach cart/orders thanh bang rieng.`
