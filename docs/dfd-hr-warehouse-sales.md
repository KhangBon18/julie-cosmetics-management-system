# DFD tien trinh - Nhan su, Kho, Ban hang

Tai lieu nay gom 3 DFD muc duoi dinh, bam theo he thong hien tai cua `Julie Cosmetics`:

1. `1.0 Quan ly Nhan su`
2. `2.0 Quan ly Kho`
3. `3.0 Quan ly Ban hang`

Ghi chu:

- So thu tu duoc danh lai de nhat quan trong bo DFD rieng nay.
- Cac kho du lieu duoc rut gon theo nhom bang chinh, phu hop de dua vao bao cao.
- Ma so do duoi day dung `Mermaid`.

---

## 1. DFD tien trinh 1.0 Quan ly Nhan su

```mermaid
flowchart LR
    NV[Nhân viên]
    QL[Quản lý / Admin]

    P11((1.1 Quản lý hồ sơ nhân viên))
    P12((1.2 Quản lý chức vụ và lịch sử công tác))
    P13((1.3 Tiếp nhận và xử lý nghỉ phép))
    P14((1.4 Tính và quản lý bảng lương))
    P15((1.5 Tự phục vụ nhân viên))

    D11[(D1 Hồ sơ nhân viên)]
    D12[(D2 Danh mục chức vụ)]
    D13[(D3 Lịch sử chức vụ)]
    D14[(D4 Đơn nghỉ phép)]
    D15[(D5 Bảng lương)]
    D16[(D6 Tài khoản người dùng)]
    D17[(D7 Thông báo)]
    D18[(D8 Cấu hình công chuẩn)]

    QL -- "Thông tin tuyển mới, cập nhật, ngưng việc" --> P11
    P11 -- "Danh sách / hồ sơ nhân viên" --> QL
    P11 --> D11
    P11 --> D16

    QL -- "Quyết định bổ nhiệm, thay đổi mức lương" --> P12
    P12 -- "Thông tin chức vụ hiện tại, lịch sử chức vụ" --> QL
    P12 --> D12
    P12 --> D13
    P12 --> D11

    NV -- "Đơn nghỉ phép / nghỉ việc" --> P13
    QL -- "Phê duyệt / từ chối đơn nghỉ" --> P13
    P13 -- "Kết quả xử lý đơn nghỉ" --> NV
    P13 --> D14
    P13 --> D17
    P13 --> D11
    P13 --> D16

    QL -- "Kỳ lương, thưởng, khấu trừ, yêu cầu xuất lương" --> P14
    P14 -- "Bảng lương, kết quả tính lương" --> QL
    P14 --> D11
    P14 --> D13
    P14 --> D14
    P14 --> D15
    P14 --> D18

    NV -- "Yêu cầu xem / cập nhật hồ sơ cá nhân" --> P15
    P15 -- "Hồ sơ cá nhân, bảng lương, lịch sử nghỉ, thông báo" --> NV
    P15 --> D11
    P15 --> D14
    P15 --> D15
    P15 --> D17
```

### Kho du lieu su dung

- `D1`: `employees`
- `D2`: `positions`
- `D3`: `employee_positions`
- `D4`: `leave_requests`
- `D5`: `salaries`
- `D6`: `users`
- `D7`: `notifications`
- `D8`: `settings`

---

## 2. DFD tien trinh 2.0 Quan ly Kho

```mermaid
flowchart LR
    TK[Thủ kho]
    QL[Quản lý / Admin]
    NCC[Nhà cung cấp]

    P21((2.1 Quản lý sản phẩm))
    P22((2.2 Quản lý danh mục và thương hiệu))
    P23((2.3 Quản lý nhà cung cấp))
    P24((2.4 Lập và xử lý phiếu nhập))
    P25((2.5 Kiểm soát tồn kho))

    D21[(D1 Sản phẩm)]
    D22[(D2 Danh mục)]
    D23[(D3 Thương hiệu)]
    D24[(D4 Nhà cung cấp)]
    D25[(D5 Phiếu nhập)]
    D26[(D6 Chi tiết phiếu nhập)]
    D27[(D7 Biến động tồn kho)]

    TK -- "Thêm, sửa, tra cứu sản phẩm" --> P21
    QL -- "Quản trị thông tin sản phẩm" --> P21
    P21 -- "Danh sách sản phẩm, cảnh báo sắp hết" --> TK
    P21 --> D21
    P21 --> D22
    P21 --> D23

    TK -- "Khai báo danh mục / thương hiệu" --> P22
    QL -- "Phê duyệt / cập nhật danh mục" --> P22
    P22 -- "Danh mục và thương hiệu hiện hành" --> TK
    P22 --> D22
    P22 --> D23

    TK -- "Cập nhật thông tin nhà cung cấp" --> P23
    NCC -- "Thông tin liên hệ, năng lực cung ứng" --> P23
    P23 -- "Danh sách nhà cung cấp" --> TK
    P23 --> D24

    TK -- "Thông tin nhập hàng, số lượng, đơn giá" --> P24
    NCC -- "Hàng giao, chứng từ nhập" --> P24
    P24 -- "Phiếu nhập, chi tiết nhập kho" --> TK
    P24 --> D24
    P24 --> D25
    P24 --> D26
    P24 --> D21
    P24 --> D27

    TK -- "Yêu cầu xem tồn, kiểm tra hàng sắp hết" --> P25
    QL -- "Yêu cầu kiểm soát tồn kho" --> P25
    P25 -- "Báo cáo tồn kho, danh sách hàng sắp hết" --> TK
    P25 -- "Thông tin tồn kho hiện tại" --> QL
    P25 --> D21
    P25 --> D25
    P25 --> D26
    P25 --> D27
```

### Kho du lieu su dung

- `D1`: `products`
- `D2`: `categories`
- `D3`: `brands`
- `D4`: `suppliers`
- `D5`: `import_receipts`
- `D6`: `import_receipt_items`
- `D7`: `inventory_movements`

---

## 3. DFD tien trinh 3.0 Quan ly Ban hang

```mermaid
flowchart LR
    NVBH[Nhân viên bán hàng]
    QL[Quản lý / Admin]
    KH[Khách hàng]
    TT[Kênh thanh toán]
    VC[Đơn vị vận chuyển]

    P31((3.1 Quản lý khách hàng và CRM))
    P32((3.2 Lập và quản lý hóa đơn))
    P33((3.3 Quản lý khuyến mãi và đánh giá))
    P34((3.4 Xử lý thanh toán và giao hàng))
    P35((3.5 Xử lý đổi trả))

    D31[(D1 Khách hàng)]
    D32[(D2 Hóa đơn)]
    D33[(D3 Chi tiết hóa đơn)]
    D34[(D4 Khuyến mãi)]
    D35[(D5 Đánh giá)]
    D36[(D6 Giao dịch thanh toán)]
    D37[(D7 Đơn giao hàng)]
    D38[(D8 Yêu cầu đổi trả)]
    D39[(D9 Chi tiết đổi trả)]
    D310[(D10 Sản phẩm và tồn kho)]

    KH -- "Thông tin cá nhân, lịch sử mua, yêu cầu hỗ trợ" --> P31
    NVBH -- "Tra cứu / cập nhật khách hàng" --> P31
    P31 -- "Hồ sơ khách hàng, thông tin thành viên" --> NVBH
    P31 --> D31

    NVBH -- "Thông tin bán hàng, sản phẩm, số lượng" --> P32
    KH -- "Yêu cầu mua hàng" --> P32
    P32 -- "Hóa đơn, chi tiết đơn, xác nhận mua hàng" --> KH
    P32 --> D31
    P32 --> D32
    P32 --> D33
    P32 --> D310

    QL -- "Thiết lập khuyến mãi, kiểm duyệt đánh giá" --> P33
    KH -- "Mã giảm giá, nội dung đánh giá" --> P33
    P33 -- "Kết quả áp dụng khuyến mãi, trạng thái đánh giá" --> QL
    P33 --> D34
    P33 --> D35
    P33 --> D31
    P33 --> D310

    NVBH -- "Yêu cầu xác nhận thanh toán / giao hàng" --> P34
    P34 -- "Thông tin thanh toán" --> TT
    TT -- "Kết quả giao dịch" --> P34
    P34 -- "Thông tin giao nhận" --> VC
    VC -- "Mã vận đơn, trạng thái giao hàng" --> P34
    P34 -- "Trạng thái thanh toán / giao hàng" --> NVBH
    P34 --> D32
    P34 --> D36
    P34 --> D37
    P34 --> D31

    KH -- "Yêu cầu đổi / trả hàng" --> P35
    QL -- "Phê duyệt / từ chối / hoàn tất đổi trả" --> P35
    P35 -- "Kết quả xử lý đổi trả" --> KH
    P35 --> D32
    P35 --> D33
    P35 --> D36
    P35 --> D38
    P35 --> D39
    P35 --> D310
```

### Kho du lieu su dung

- `D1`: `customers`
- `D2`: `invoices`
- `D3`: `invoice_items`
- `D4`: `promotions`
- `D5`: `reviews`
- `D6`: `payment_transactions`
- `D7`: `shipping_orders`
- `D8`: `returns`
- `D9`: `return_items`
- `D10`: `products`

---

## Goi y chen vao bao cao

- Moi DFD nen de tren mot trang rieng neu muon de doc.
- Neu chen vao Word, nen export `SVG` tu Mermaid de net hon PNG.
- Tieu de hinh co the dung:
  - `Hinh X. DFD tien trinh Quan ly Nhan su`
  - `Hinh Y. DFD tien trinh Quan ly Kho`
  - `Hinh Z. DFD tien trinh Quan ly Ban hang`
