# Phân tích hệ thống và mã sơ đồ DFD - Julie Cosmetics

Tài liệu này chốt lại 3 sơ đồ theo đúng luồng đang có trong code hiện tại của `Julie Cosmetics`:

1. Sơ đồ ngữ cảnh
2. DFD mức đỉnh (Level 0)
3. DFD mức dưới đỉnh (Level 1) cho tiến trình `1.0 Storefront và đơn hàng online`

Mã sơ đồ dùng `Mermaid`, có thể paste trực tiếp vào:

- Mermaid Live Editor
- draw.io / diagrams.net có hỗ trợ Mermaid
- Markdown renderer hỗ trợ Mermaid

## 1. Cơ sở phân tích

Phân tích này bám theo các phần đang chạy thật trong repo:

- Frontend route: [App.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/App.jsx)
- Storefront: [CheckoutPage.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/components/shop/CheckoutPage.jsx), [publicService.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/services/publicService.js)
- Public API: [publicRoutes.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/routes/publicRoutes.js)
- Customer auth: [customerAuthRoutes.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/routes/customerAuthRoutes.js)
- Nội bộ: [server.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/server.js), [moduleRegistry.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/config/moduleRegistry.js)
- Các nghiệp vụ lõi: `invoice`, `payment`, `shipping`, `return`, `import`, `leave`, `salary`, `report`
- CSDL: [schema.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/schema.sql)

## 2. Các điểm cần chốt để vẽ đúng

- Storefront hiện có các luồng: đăng ký khách hàng, đăng nhập khách hàng, xem sản phẩm, xem đánh giá hiển thị, giỏ hàng, checkout.
- Frontend hiện yêu cầu khách hàng đăng nhập trước khi checkout ở [CheckoutPage.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/components/shop/CheckoutPage.jsx), dù backend có route public `/api/public/checkout`.
- Khách hàng hiện chỉ xem đánh giá trên storefront. Repo chưa có luồng gửi đánh giá từ giao diện khách hàng.
- Khi checkout, hệ thống tạo:
  - `invoice` và `invoice_items`
  - `payment_transaction`
  - `shipping_order` nếu có địa chỉ giao hàng
- Thanh toán, giao hàng, đổi trả hiện là module nội bộ cập nhật trạng thái; khi vẽ DFD có thể giữ `Kênh thanh toán` và `Đơn vị vận chuyển` như tác nhân ngoài ở mức nghiệp vụ.
- Đổi trả hiện đi qua route nội bộ có `protect`, không phải public flow của khách hàng.

## 3. Tác nhân ngoài và kho dữ liệu

### Tác nhân ngoài

- `Khách hàng`
- `Nhân viên`
- `Quản lý / Admin`
- `Nhà cung cấp`
- `Ngân hàng / Kênh thanh toán`
- `Đơn vị vận chuyển`

### Nhóm kho dữ liệu dùng trong DFD

- `D1 Khách hàng`: `customers`
- `D2 Danh mục sản phẩm`: `products`, `brands`, `categories`, `product_images`, `skin_types`, `product_skin_types`
- `D3 Kho và nhập hàng`: `suppliers`, `import_receipts`, `import_receipt_items`, `inventory_movements`
- `D4 Hóa đơn - khuyến mãi - đánh giá`: `invoices`, `invoice_items`, `promotions`, `reviews`
- `D5 Thanh toán - giao hàng - đổi trả`: `payment_transactions`, `customer_addresses`, `shipping_orders`, `returns`, `return_items`
- `D6 Nhân sự`: `employees`, `positions`, `employee_positions`, `leave_requests`, `salaries`
- `D7 Tài khoản - phân quyền - cấu hình - thông báo`: `users`, `roles`, `permissions`, `role_permissions`, `settings`, `notifications`, `refresh_tokens`, `login_attempts`, `audit_logs`

## 4. Sơ đồ ngữ cảnh

```mermaid
flowchart LR
    KH[Khách hàng]
    NV[Nhân viên]
    QL[Quản lý / Admin]
    NCC[Nhà cung cấp]
    TT[Ngân hàng / Kênh thanh toán]
    VC[Đơn vị vận chuyển]

    HT((Hệ thống Julie Cosmetics))

    KH -->|Đăng ký, đăng nhập, xem sản phẩm, xem đánh giá, quản lý giỏ, đặt hàng| HT
    HT -->|Thông tin sản phẩm, kết quả xác thực, giỏ hàng hợp lệ, xác nhận đơn hàng| KH

    NV -->|Cập nhật hồ sơ cá nhân, nộp đơn nghỉ, xem lương, thao tác nghiệp vụ theo quyền| HT
    HT -->|Hồ sơ cá nhân, bảng lương, kết quả đơn nghỉ, dữ liệu nghiệp vụ| NV

    QL -->|Quản trị nhân sự, kho, bán hàng, thanh toán, giao hàng, quyền, cấu hình, báo cáo| HT
    HT -->|Dashboard, báo cáo, cảnh báo, danh sách quản trị| QL

    NCC -->|Thông tin nhà cung cấp, hàng giao, chứng từ nhập| HT
    HT -->|Phiếu nhập, lịch sử nhập, thông tin đơn nhập| NCC

    HT -->|Yêu cầu xác nhận thanh toán, hoàn tiền| TT
    TT -->|Kết quả giao dịch, trạng thái thanh toán| HT

    HT -->|Thông tin giao hàng, người nhận, địa chỉ, mã đơn| VC
    VC -->|Mã vận đơn, trạng thái giao hàng| HT
```

## 5. DFD mức đỉnh - Level 0

```mermaid
flowchart LR
    KH[Khách hàng]
    NV[Nhân viên]
    QL[Quản lý / Admin]
    NCC[Nhà cung cấp]
    TT[Ngân hàng / Kênh thanh toán]
    VC[Đơn vị vận chuyển]

    P1((1.0 Storefront và đơn hàng online))
    P2((2.0 Bán hàng và CRM))
    P3((3.0 Xử lý thanh toán, giao hàng và đổi trả))
    P4((4.0 Quản lý kho, sản phẩm và nhập hàng))
    P5((5.0 Quản lý nhân sự nội bộ))
    P6((6.0 Quản trị hệ thống))
    P7((7.0 Báo cáo và thống kê))

    D1[(D1 Khách hàng)]
    D2[(D2 Danh mục sản phẩm)]
    D3[(D3 Kho và nhập hàng)]
    D4[(D4 Hóa đơn - khuyến mãi - đánh giá)]
    D5[(D5 Thanh toán - giao hàng - đổi trả)]
    D6[(D6 Nhân sự)]
    D7[(D7 Tài khoản - phân quyền - cấu hình)]

    KH -->|Đăng ký, đăng nhập, tra cứu sản phẩm, giỏ hàng, checkout| P1
    P1 -->|Kết quả xác thực, danh sách sản phẩm, xác nhận đơn| KH
    P1 -->|Tạo hoặc cập nhật hồ sơ khách hàng| D1
    D1 -->|Hồ sơ khách hàng| P1
    D2 -->|Sản phẩm, danh mục, thương hiệu, tồn khả dụng| P1
    D4 -->|Đánh giá hiển thị, mã khuyến mãi hợp lệ| P1
    P1 -->|Đơn hàng online| D4
    P1 -->|Giao dịch thanh toán mới, đơn giao hàng mới| D5

    NV -->|Lập hóa đơn, tra cứu khách hàng, xem đánh giá| P2
    QL -->|Quản lý khách hàng, khuyến mãi, đánh giá, hóa đơn| P2
    P2 -->|Hóa đơn, thông tin khách hàng, dữ liệu CRM| NV
    P2 -->|Danh sách hóa đơn, khách hàng, khuyến mãi, đánh giá| QL
    P2 -->|Cập nhật khách hàng| D1
    D1 -->|Hồ sơ khách hàng| P2
    D2 -->|Sản phẩm bán, giá bán, trạng thái hàng| P2
    P2 -->|Hóa đơn, khuyến mãi, đánh giá| D4
    D4 -->|Lịch sử hóa đơn, CTKM, đánh giá| P2

    NV -->|Xác nhận thanh toán, cập nhật vận đơn, tạo đổi trả| P3
    QL -->|Phê duyệt hoàn tiền, phê duyệt đổi trả| P3
    P3 -->|Trạng thái thanh toán, giao hàng, đổi trả| NV
    P3 -->|Kết quả xử lý fulfillment| QL
    D4 -->|Thông tin hóa đơn liên quan| P3
    D2 -->|Thông tin sản phẩm liên quan| P3
    P3 -->|Giao dịch, đơn giao hàng, yêu cầu đổi trả| D5
    D5 -->|Trạng thái thanh toán, vận chuyển, đổi trả| P3
    P3 -->|Hoàn kho và biến động kho sau đổi trả| D3
    P3 -->|Yêu cầu xác nhận hoặc hoàn tiền| TT
    TT -->|Kết quả giao dịch| P3
    P3 -->|Thông tin giao nhận| VC
    VC -->|Mã vận đơn, trạng thái giao hàng| P3

    NV -->|Cập nhật sản phẩm, nhập kho, theo dõi tồn| P4
    QL -->|Quản lý danh mục, thương hiệu, nhà cung cấp| P4
    NCC -->|Thông tin cung ứng, hàng giao, chứng từ nhập| P4
    P4 -->|Danh sách sản phẩm, tồn kho, phiếu nhập| NV
    P4 -->|Danh mục kho, nhà cung cấp, lịch sử nhập| QL
    P4 -->|Danh mục sản phẩm| D2
    D2 -->|Danh mục hiện hành| P4
    P4 -->|Nhà cung cấp, phiếu nhập, biến động kho| D3
    D3 -->|Tồn kho, lịch sử nhập| P4

    NV -->|Hồ sơ cá nhân, đơn nghỉ, yêu cầu xem lương| P5
    QL -->|Quản lý nhân viên, chức vụ, duyệt nghỉ, tính lương| P5
    P5 -->|Hồ sơ cá nhân, kết quả đơn nghỉ, bảng lương| NV
    P5 -->|Danh sách nhân sự, bảng lương| QL
    P5 -->|Hồ sơ, chức vụ, nghỉ phép, lương| D6
    D6 -->|Dữ liệu nhân sự| P5
    D7 -->|Tài khoản, thông báo, cấu hình công| P5
    P5 -->|Thông báo nhân sự| D7

    NV -->|Đăng nhập nội bộ| P6
    QL -->|User, role, permission, setting, thông báo| P6
    P6 -->|Quyền truy cập, cấu hình, thông báo| NV
    P6 -->|Tài khoản, quyền, cấu hình hệ thống| QL
    P6 -->|Tài khoản, phân quyền, cấu hình, audit| D7
    D7 -->|Dữ liệu quản trị| P6

    QL -->|Yêu cầu báo cáo, lọc kỳ, xuất dữ liệu| P7
    P7 -->|Báo cáo doanh thu, lợi nhuận, tồn kho, nhân sự| QL
    D2 -->|Catalog và tồn| P7
    D3 -->|Nhập hàng và biến động kho| P7
    D4 -->|Hóa đơn, khuyến mãi, đánh giá| P7
    D5 -->|Thanh toán, giao hàng, đổi trả| P7
    D6 -->|Nhân sự, nghỉ phép, lương| P7
    D7 -->|Cấu hình và audit hỗ trợ báo cáo| P7
```

## 6. DFD mức dưới đỉnh - Level 1 cho tiến trình 1.0

Lý do chọn phân rã `1.0 Storefront và đơn hàng online`:

- Đây là luồng xuyên suốt nhất từ phía khách hàng
- Bám rất sát code hiện tại ở `publicRoutes`, `CheckoutPage`, `customerAuthRoutes`
- Dễ bảo vệ khi trình bày vì có thể đối chiếu thẳng với route và bảng dữ liệu

```mermaid
flowchart LR
    KH[Khách hàng]

    P11((1.1 Đăng ký, đăng nhập và hồ sơ khách hàng))
    P12((1.2 Tra cứu danh mục và danh sách sản phẩm))
    P13((1.3 Xem chi tiết sản phẩm và đánh giá))
    P14((1.4 Quản lý giỏ hàng và kiểm tra tồn))
    P15((1.5 Checkout và tạo đơn hàng online))

    D1[(D1 Khách hàng)]
    D2[(D2 Danh mục sản phẩm)]
    D4[(D4 Hóa đơn - khuyến mãi - đánh giá)]
    D5[(D5 Thanh toán và giao hàng)]

    KH -->|Thông tin đăng ký, đăng nhập, yêu cầu xem hồ sơ| P11
    P11 -->|Kết quả xác thực, hồ sơ khách hàng| KH
    P11 -->|Tạo hoặc cập nhật tài khoản| D1
    D1 -->|Hồ sơ khách hàng| P11

    KH -->|Từ khóa tìm kiếm, bộ lọc, chọn danh mục hoặc thương hiệu| P12
    D2 -->|Danh mục, thương hiệu, sản phẩm nổi bật, hàng mới| P12
    P12 -->|Danh sách sản phẩm phù hợp| KH

    KH -->|Yêu cầu xem chi tiết sản phẩm| P13
    D2 -->|Thông tin chi tiết, hình ảnh, giá bán, tồn kho| P13
    D4 -->|Đánh giá đang hiển thị| P13
    P13 -->|Chi tiết sản phẩm, đánh giá, sản phẩm liên quan| KH

    KH -->|Thêm, sửa, xóa giỏ hàng và yêu cầu kiểm tra giỏ| P14
    D2 -->|Giá bán, trạng thái hoạt động, số lượng tồn| P14
    P14 -->|Giỏ hàng hợp lệ, cảnh báo điều chỉnh số lượng| KH

    KH -->|Thông tin nhận hàng, phương thức thanh toán, ghi chú| P15
    D1 -->|Thông tin khách hàng đã đăng nhập| P15
    D2 -->|Giá bán và tồn khả dụng trước khi chốt đơn| P15
    D4 -->|Mã khuyến mãi hợp lệ| P15
    P15 -->|Ghi nhận hóa đơn online| D4
    P15 -->|Tạo giao dịch thanh toán và đơn giao hàng| D5
    P15 -->|Xác nhận đặt hàng, mã đơn, tổng tiền| KH
```

## 7. Gợi ý khi đem đi vẽ

- Nếu dùng Mermaid Live Editor: paste nguyên block code vào, sau đó export `SVG`.
- Nếu dùng draw.io: vào `Insert` -> `Advanced` -> `Mermaid`.
- Khi chèn báo cáo Word:
  - Sơ đồ ngữ cảnh nên để 1 trang riêng
  - DFD Level 0 nên để trang ngang nếu cần
  - DFD Level 1 có thể để trang dọc nếu phóng rộng vừa đủ

## 8. Ghi chú để thuyết trình

- `1.0` được chọn làm tiến trình phân rã Level 1 vì gắn trực tiếp với luồng khách hàng của hệ thống hiện tại.
- Nếu giảng viên yêu cầu Level 1 cho tiến trình khác như `Nhân sự`, `Kho` hoặc `Bán hàng`, bạn có thể tách tiếp từ các module đã có trong repo.
- Bộ sơ đồ này đã chỉnh lại 3 điểm dễ bị vẽ sai:
  - Không vẽ khách hàng có luồng gửi đánh giá ở phiên bản hiện tại
  - Không vẽ đổi trả là public flow của khách hàng
  - Thể hiện checkout tạo đồng thời hóa đơn, giao dịch thanh toán và đơn giao hàng
