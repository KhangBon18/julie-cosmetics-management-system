# Demo QA Checklist - Julie Cosmetics

Checklist nay dung de chay nhanh truoc gio cham, uu tien phan mem va du lieu demo.

## 0. Chuan bi

1. Chay:

```bash
npm run demo:prepare
```

2. Mo trinh duyet va **allow popup / pop-up windows** cho `localhost:5173`.

3. Xac nhan cac tai khoan demo:

- `admin / admin123`
- `manager01 / manager123`
- `staff01 / staff123`
- `sales01 / sales123`
- `warehouse01 / warehouse123`

## 1. Admin

1. Dang nhap `admin / admin123`
2. Xac nhan vao `/admin`
3. Mo:
   - `Tai khoan`
   - `Nhom quyen`
   - `Cau hinh`
4. Vao `Nha cung cap`
5. Bam `Quan ly` o `NCC 1`:
   - phai thay danh sach san pham da map
6. Bam `Quan ly` o `NCC 3`:
   - phai thay trang thai fallback toan catalog

Expected:
- Admin thay menu he thong
- API mapping NCC-san pham hoat dong
- Khong loi 401/403/500

## 2. Manager / HR

1. Dang nhap `manager01 / manager123`
2. Xac nhan vao `/hr/employees`
3. Mo:
   - `Nhan vien`
   - `Duyet nghi phep`
   - `Bang luong`
   - `Bao cao`
4. Trong `Duyet nghi phep`, tim don co ly do:
   - `[DEMO] Nghỉ phép chờ duyệt để trình bày giữa kỳ`
5. Trong `Bang luong`, xac nhan co thuong ky hien tai

Expected:
- Khong thay `Tai khoan`, `Nhom quyen`, `Cau hinh`
- Duyet nghi phep duoc
- Bao cao HR mo duoc

## 3. Staff self-service

1. Dang nhap `staff01 / staff123`
2. Xac nhan vao `/staff`
3. Mo nhom `Ca nhan`:
   - `Ho so cua toi`
   - `Nghi phep`
   - `Bang luong`
4. Thu go tay `/business/invoices`
   - phai bi redirect ve `/staff`
5. Trong `Bang luong`, xac nhan thay thuong ky hien tai
6. Bam in bang luong thang / nam

Expected:
- Van thay self-service ca nhan
- Khong vao duoc khu kinh doanh noi bo
- Neu popup bi chan, he thong bao loi mem
- Khong loi 500

## 4. Sales

1. Dang nhap `sales01 / sales123`
2. Xac nhan vao `/business/invoices`
3. Mo:
   - `Hoa don`
   - `Khach hang`
   - `Bao cao`
4. Thu go tay:
   - `/business/profile`
   - `/business/my-leaves`
   - `/business/my-salary`

Expected:
- Sales **khong** thay nhom `Ca nhan`
- Sales bi redirect ve `/business/invoices` neu vao URL self-service
- Van lap hoa don va xem khach hang duoc

## 5. Warehouse

1. Dang nhap `warehouse01 / warehouse123`
2. Xac nhan vao `/warehouse/imports`
3. Mo:
   - `San pham`
   - `Nha cung cap`
   - `Nhap kho`
   - `Bao cao`
4. Vao `Nhap kho`:
   - chon `NCC 1` -> danh sach san pham phai duoc loc theo mapping
   - chon `NCC 3` -> phai hien note fallback toan catalog

Expected:
- Bao cao kho mo duoc
- Nhap kho khong bi crash

## 6. Sales / Payment demo nhanh

1. Dang nhap `sales01`
2. Vao `Hoa don`
3. Tim hoa don co note:
   - `[DEMO] Hóa đơn chờ xác nhận thanh toán`
4. Xac nhan dang o trang thai `cho thanh toan`

Expected:
- Co san case pending de demo
- Khong can tao tay lai truoc gio cham

## 7. Bao cao / In bao cao

1. Vao `Bao cao`
2. Tab `Loi nhuan`:
   - doi theo thang / quy / nam
   - bam `In bao cao loi nhuan`
3. Tab `Kho hang`:
   - bam `In bao cao kho`
   - bam `In bao cao xuat hang`

Expected:
- Cua so in mo duoc
- Neu popup bi chan, he thong hien thong bao loi mem
- Khong mat du lieu tren man hinh
