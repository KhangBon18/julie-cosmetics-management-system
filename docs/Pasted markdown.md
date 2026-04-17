**I. DANH SÁCH CÁC NHÓM THAY ĐỔI CẦN TEST**
1. **Invoice / Payment / CRM**
   - Đã vá rule trạng thái hóa đơn và payment để tránh double-count / double-rollback.
   - Module chính: [invoiceModel.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/models/invoiceModel.js:1), [paymentModel.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/models/paymentModel.js:1), [InvoicesPage.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/pages/InvoicesPage.jsx:1), [schema.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/schema.sql:246)

2. **Workspace / Role / Điều hướng**
   - Đã chuyển sang mapping workspace theo role chính, thêm guard và rebase base-path.
   - Module chính: [workspace.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/utils/workspace.js:1), [App.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/App.jsx:1), [ProtectedRoute.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/components/layout/ProtectedRoute.jsx:1), [DashboardLayout.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/components/layout/DashboardLayout.jsx:1), [moduleRegistry.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/config/moduleRegistry.js:1), [Sidebar.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/components/layout/Sidebar.jsx:1)

3. **HR Bonus / Payroll / HR Report**
   - Đã thêm workflow thưởng, đồng bộ vào salary row, fallback khi DB cũ chưa migrate.
   - Module chính: [salaryBonusModel.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/models/salaryBonusModel.js:1), [salaryModel.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/models/salaryModel.js:1), [salaryController.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/controllers/salaryController.js:1), [staffController.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/controllers/staffController.js:1), [salaryCalculation.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/utils/salaryCalculation.js:1), [SalariesPage.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/pages/SalariesPage.jsx:1), [MySalaryPage.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/pages/staff/MySalaryPage.jsx:1), [032_create_salary_bonus_adjustments.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/migrations/032_create_salary_bonus_adjustments.sql:1)

4. **Print Report / Reports**
   - Đã thêm print-friendly flow cho lợi nhuận, kho, xuất hàng.
   - Module chính: [ReportsPage.jsx](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/client/src/pages/ReportsPage.jsx:1), [reportRoutes.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/routes/reportRoutes.js:1)

5. **Demo setup / Restore / Smoke / Seed**
   - Đã harden flow setup, restore, demo accounts, smoke role-based.
   - Module chính: [README.md](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/README.md:1), [restore.sh](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/restore.sh:1), [seed-demo.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/seed-demo.js:1), [resetDemoUsers.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/scripts/resetDemoUsers.js:1), [demo-smoke.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/scripts/demo-smoke.js:1), [server.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/server.js:1)

6. **Pre-demo hardening cho flow chấm điểm cao**
   - Đã vá các điểm dễ fail demo: login drift, permission kho, link nội bộ, salary fallback.
   - Module chính: các file trên + [seed_rbac.sql](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/database/seed_rbac.sql:1), [leaveController.js](/Users/heisenbon/Documents/Workspace%20Code/HTTTDN/Julie%20Cosmetics/server/src/controllers/leaveController.js:1)

**II. SMOKE TEST TRƯỚC GIỜ CHẤM**
1. Chạy `npm run demo:prepare` phải pass hoàn toàn. Nếu fail ở đây, **dừng demo**.
2. Login `admin / admin123` tại `/admin/login`, phải vào `/admin`, thấy menu `Tài khoản`, `Nhóm quyền`, `Cấu hình`.
3. Admin mở `Tài khoản` và `Nhóm quyền`, không được lỗi `401/403/500`.
4. Login `manager01 / manager123`, phải vào `/hr/employees`.
5. Manager thử gõ trực tiếp `/business/invoices`, phải bị redirect về `/hr/employees`.
6. Manager mở `Duyệt nghỉ phép` và `Báo cáo HR`, không được lỗi `401/403/500`.
7. Login `warehouse01 / warehouse123`, phải vào `/warehouse/imports`.
8. Warehouse thử gõ `/hr/employees`, phải bị redirect về `/warehouse/imports`.
9. Warehouse mở `Báo cáo kho`, không được `403`. Đây là test chứng minh permission kho đã được vá.
10. Login `staff01 / staff123`, phải vào `/business/invoices`.
11. Staff thử gõ `/hr/employees`, phải bị redirect về `/business/invoices`.
12. Staff tạo 1 hóa đơn `cash`, hóa đơn mới phải hiện `Đã thanh toán`.
13. Staff tạo 1 hóa đơn `card` hoặc `transfer`, hóa đơn mới phải hiện `Chờ thanh toán`.
14. Manager hoặc admin xác nhận giao dịch pending vừa tạo, hóa đơn phải chuyển `Đã thanh toán`.
15. Mở 1 báo cáo `Lợi nhuận` hoặc `Kho`, bấm `In báo cáo`, cửa sổ print phải bật được. `CẦN BẬT POPUP`.

**III. TEST MATRIX TỔNG HỢP**

| ID | Nhóm | Ưu tiên | Test case | Precondition | Dữ liệu test | Kết quả mong đợi | Check DB/API |
|---|---|---|---|---|---|---|---|
| A01 | Invoice/CRM | Critical | Tạo hóa đơn cash | Đăng nhập `staff01` | 1 KH bất kỳ + 1-2 SP còn hàng | Invoice `paid`, payment `confirmed`, stock giảm, CRM cộng đúng 1 lần | Có |
| A02 | Invoice/CRM | Critical | Tạo hóa đơn pending card/transfer | Đăng nhập `staff01` | 1 KH có tích điểm + 1-2 SP | Invoice `confirmed`, payment `pending`, stock giảm, CRM chưa cộng | Có |
| A03 | Invoice/CRM | Critical | Pending -> confirmed | Có invoice A02 | Invoice vừa tạo | Payment `confirmed`, invoice `paid`, CRM cộng đúng 1 lần | Có |
| A04 | Invoice/CRM | Critical | Pending -> failed | Có invoice pending | Invoice vừa tạo | Payment `failed`, invoice `cancelled`, stock trả lại, CRM không cộng | Có |
| A05 | Invoice/CRM | Critical | Pending -> cancelled | Có invoice pending | Invoice vừa tạo | Hủy invoice thành công, payment pending bị fail, stock trả lại, CRM không rollback thừa | Có |
| A06 | Invoice/CRM | High | Regression với KH có lịch sử | Snapshot trước test | `customer_id=1` | Không double-count/double-rollback trên customer có sẵn lịch sử | Có |
| B01 | Workspace/Role | Critical | Login + landing theo role | `demo:prepare` pass | 4 tài khoản demo | Mỗi role vào đúng workspace | Có |
| B02 | Workspace/Role | High | Sidebar/menu đúng role | Đã login từng role | 4 tài khoản demo | Không thấy nhầm menu khu khác | Không |
| B03 | Workspace/Role | Critical | Gõ URL sai workspace | Đã login | `/hr/*`, `/warehouse/*`, `/business/*` | Redirect về workspace đúng | Không |
| B04 | Workspace/Role | High | FE mapping khớp BE permission | Có token từng role | Call API chéo role | UI bị chặn và API trả 403 đúng vai | Có |
| C01 | Bonus/Payroll | High | Manager tạo/sửa/xóa thưởng | `CẦN DB MỚI / CẦN CHẠY MIGRATION 032` | `employee_id=2`, `04/2026` | CRUD thưởng thành công, lưu lý do | Có |
| C02 | Bonus/Payroll | High | Bonus sync vào salary row + staff view | Có C01 | Nhân viên được thưởng | Salary row có bonus, staff thấy bonus/lý do | Có |
| C03 | Bonus/Payroll | High | HR report thống kê thưởng | Có migration + có bonus | `04/2026`, `2026` | Report HR phản ánh bonus theo kỳ | Có |
| C04 | Bonus/Payroll | Critical | Fallback khi DB chưa có bảng bonus | DB cũ chưa migrate | DB hiện tại hoặc DB clone cũ | Không còn 500; bonus panel ẩn/cảnh báo mềm | Có |
| C05 | Bonus/Payroll | High | Regression generate payroll | Có bonus sẵn | `04/2026` | Generate payroll không làm mất bonus | Có |
| D01 | Reports/Print | High | In lợi nhuận tháng/quý/năm | Có dữ liệu report | `2026` | Print view sạch, summary khớp bảng | Không |
| D02 | Reports/Print | High | In kho tháng/năm | Có dữ liệu kho | `2026` | Print view kho sạch, số liệu nhập/xuất đúng | Không |
| D03 | Reports/Print | High | In xuất hàng tháng/quý/năm | Có dữ liệu inventory export | `2026` | Bảng xuất hàng in được, summary đúng | Không |
| D04 | Reports/Print | Medium | Popup/layout/chart-table regression | `CẦN BẬT POPUP` | Browser thật | Popup không bị block, chart không làm vỡ bản in | Không |
| E01 | Setup/Smoke | Critical | Setup từ máy sạch | Máy chưa chạy app | README flow | `db:up`, `seed:demo`, `demo:prepare`, `dev` chạy ổn | Có |
| E02 | Setup/Restore | High | `restore.sh` hoạt động | Có backup file thật | `.sql` hoặc `.sql.gz` | Restore thành công, đúng DB/env | Có |
| E03 | Setup/Smoke | Critical | `demo:reset-users` | DB drift hoặc login fail | 4 account demo | Account reset đúng, clear throttle | Có |
| E04 | Setup/Smoke | Critical | `demo:smoke` | Backend lên | 4 account demo | Login + endpoint chính pass | Có |
| E05 | Setup/Seed | Medium | `seed-demo` không làm bẩn CRM | Có pending invoice | 1 invoice `confirmed` | CRM sync chỉ tính `paid/completed` | Có |
| F01 | Demo flow | High | Admin user/role | Admin login | `admin` | Xem users/roles ổn | Không |
| F02 | Demo flow | High | Manager HR core | Manager login | employee 5 leave pending | Thêm nhân sự/đổi chức vụ/duyệt đơn không lỗi | Có |
| F03 | Demo flow | High | Staff self-service | Staff login | `staff01` | Hồ sơ, đơn nghỉ, lương, in lương ổn | Không |
| F04 | Demo flow | High | Warehouse core | Warehouse login | SP/NCC/phiếu nhập | Sản phẩm, NCC, phiếu nhập, báo cáo kho ổn | Có |
| F05 | Demo flow | Critical | Business hóa đơn + payment state | Staff + manager/admin | 1 cash + 1 pending | Luồng bán hàng end-to-end ổn | Có |

**IV. CHI TIẾT TEST CASE THEO NHÓM**

**A. INVOICE / PAYMENT / CRM**

**A01 — Tạo hóa đơn cash**  
Mục tiêu: xác nhận cash invoice đi thẳng vào trạng thái `paid`, không tạo pending workflow, stock và CRM cập nhật đúng.  
Precondition: login `staff01`; chọn 1 khách hoặc tạo `UAT CRM`; ghi lại `stock_before`, `total_points_before`, `total_spent_before`.  
Dữ liệu: 1-2 sản phẩm còn hàng >= 5; thanh toán `cash`.  
Bước:  
1. Vào `Hóa đơn`, tạo invoice mới.  
2. Chọn customer, thêm sản phẩm, chọn `Tiền mặt`, lưu.  
3. Mở chi tiết invoice vừa tạo.  
Expected UI: toast thành công; invoice hiển thị `Đã thanh toán`; payment status là `Confirmed`.  
Expected API/DB: `POST /api/invoices` trả `201`; `invoices.status='paid'`; có 1 dòng trong `payment_transactions` với `status='confirmed'`; `products.stock_quantity` giảm đúng số lượng; `customers.total_points` và `total_spent` tăng đúng 1 lần.  
Ưu tiên: Critical.  
Ghi chú: `CẦN SO SÁNH DB`.

**A02 — Tạo hóa đơn pending bằng card/transfer**  
Mục tiêu: xác nhận pending invoice không cộng CRM sớm.  
Precondition: login `staff01`; snapshot stock + customer totals trước khi test.  
Dữ liệu: customer có lịch sử, ưu tiên `customer_id=1`; thanh toán `card` hoặc `transfer`.  
Bước:  
1. Tạo invoice mới với `card` hoặc `transfer`.  
2. Mở chi tiết invoice.  
Expected UI: invoice mới hiển thị `Chờ thanh toán`; payment status `Pending`.  
Expected API/DB: `invoices.status='confirmed'`; `payment_transactions.status='pending'`; stock đã giảm; `customers.total_points` và `total_spent` chưa đổi.  
Ưu tiên: Critical.  
Ghi chú: `CẦN SO SÁNH DB`, `RỦI RO DEMO CAO`.

**A03 — Pending -> confirmed**  
Mục tiêu: xác nhận confirm payment cộng CRM đúng 1 lần.  
Precondition: đã có invoice pending từ A02; login `manager01` hoặc `admin`.  
Dữ liệu: invoice pending vừa tạo.  
Bước:  
1. Từ UI hóa đơn, bấm xác nhận thanh toán.  
2. Reload danh sách + chi tiết invoice.  
Expected UI: invoice chuyển `Đã thanh toán`; payment status `Confirmed`; không báo lỗi.  
Expected API/DB: `PUT /api/payments/:id/confirm` trả `200`; `payment_transactions.status='confirmed'`; `invoices.status='paid'`; customer totals tăng đúng bằng `final_total` và `points_earned`; stock không bị trừ thêm lần 2.  
Ưu tiên: Critical.  
Ghi chú: `CẦN SO SÁNH DB`, `RỦI RO DEMO CAO`.

**A04 — Pending -> failed**  
Mục tiêu: xác nhận fail payment rollback kho đúng 1 lần và không đụng CRM.  
Precondition: có invoice pending mới; login `manager01` hoặc `admin`.  
Dữ liệu: invoice pending khác A03.  
Bước:  
1. Từ UI hóa đơn, chọn `Đánh dấu thất bại`, nhập lý do.  
2. Reload invoice và danh sách sản phẩm.  
Expected UI: invoice chuyển `Đã hủy`; payment status `Failed`.  
Expected API/DB: `PUT /api/payments/:id/failed` trả `200`; `invoices.status='cancelled'`; `payment_transactions.status='failed'`; stock tăng trả lại đúng số lượng; `customers.total_points` và `total_spent` không đổi.  
Ưu tiên: Critical.  
Ghi chú: `CẦN SO SÁNH DB`, `RỦI RO DEMO CAO`.

**A05 — Pending -> cancelled qua hủy hóa đơn**  
Mục tiêu: xác nhận `DELETE /api/invoices/:id` cũng fail pending transaction và rollback kho đúng.  
Precondition: có invoice pending mới; nếu UI không có nút hủy rõ, dùng Postman/curl.  
Dữ liệu: invoice pending khác A03/A04.  
Bước:  
1. Hủy invoice từ UI nếu có; nếu không, gọi `DELETE /api/invoices/:id`.  
2. Mở lại invoice/payment/stock.  
Expected UI: invoice `Đã hủy`; nếu mở chi tiết vẫn thấy vết invoice đã cancel.  
Expected API/DB: `invoices.status='cancelled'`; payment pending tương ứng chuyển `failed`; stock trả đúng; customer totals không đổi; note payment có dòng `Invoice cancelled before payment confirmation`.  
Ưu tiên: Critical.  
Ghi chú: `CẦN TEST THỰC TẾ`, `CẦN SO SÁNH DB`, `RỦI RO DEMO CAO`.

**A06 — Regression với khách đã có lịch sử**  
Mục tiêu: chứng minh bug cũ không còn làm lệch customer có lịch sử trước đó.  
Precondition: dùng `customer_id=1`; snapshot `total_points/total_spent` trước test.  
Dữ liệu: customer có sẵn lịch sử mua hàng.  
Bước:  
1. Chạy A02 -> A04 hoặc A05 trên customer này.  
2. Chạy A02 -> A03 trên customer này.  
3. So sánh delta từng bước.  
Expected UI: các trạng thái đúng như A03-A05.  
Expected API/DB: pending fail/cancel không làm giảm totals cũ; pending confirm chỉ tăng đúng 1 lần; tuyệt đối không có double rollback.  
Ưu tiên: High.  
Ghi chú: `CẦN SO SÁNH DB`.

**B. WORKSPACE / ROLE / ĐIỀU HƯỚNG**

**B01 — Login từng role và landing page**  
Mục tiêu: chứng minh mapping role -> workspace đúng.  
Precondition: `npm run demo:prepare` pass.  
Dữ liệu: `admin`, `manager01`, `staff01`, `warehouse01`.  
Bước:  
1. Login từng tài khoản tại `/admin/login`.  
2. Ghi lại URL sau login.  
Expected UI: `admin -> /admin`; `manager01 -> /hr/employees`; `staff01 -> /business/invoices`; `warehouse01 -> /warehouse/imports`.  
Expected API/DB: login `POST /api/auth/login` trả `200`; user object chứa role/permissions đúng.  
Ưu tiên: Critical.  
Ghi chú: `RỦI RO DEMO CAO`.

**B02 — Sidebar/menu đúng role**  
Mục tiêu: mỗi role chỉ thấy menu của khu mình.  
Precondition: đã login từng role.  
Dữ liệu: 4 role demo.  
Bước:  
1. Quan sát sidebar từng role.  
2. Ghi lại menu hiển thị.  
Expected UI: admin thấy `users/roles/settings`; manager thấy HR + reports + personal; staff thấy business + personal; warehouse thấy products/imports/suppliers/reports + personal.  
Expected API/DB: không bắt buộc.  
Ưu tiên: High.  
Ghi chú: regression trực tiếp của lỗi cũ.

**B03 — Truy cập URL sai workspace**  
Mục tiêu: chứng minh redirect guard đúng.  
Precondition: đã login.  
Dữ liệu:  
- manager: `/business/invoices`  
- staff: `/hr/employees`  
- warehouse: `/hr/employees`  
- admin: `/warehouse/imports`  
Bước:  
1. Gõ trực tiếp URL sai workspace.  
2. Quan sát redirect.  
Expected UI: manager về `/hr/employees`; staff về `/business/invoices`; warehouse về `/warehouse/imports`; admin được rebase về `/admin/imports`.  
Expected API/DB: không bắt buộc.  
Ưu tiên: Critical.  
Ghi chú: `RỦI RO DEMO CAO`.

**B04 — FE role mapping khớp BE permission**  
Mục tiêu: không chỉ FE ẩn menu, BE cũng chặn đúng.  
Precondition: có token từng role.  
Dữ liệu:  
- staff gọi `/api/reports/hr`  
- warehouse gọi `/api/users`  
- manager gọi `/api/users`  
- admin gọi `/api/users`  
Bước:  
1. Gọi API bằng DevTools, Postman hoặc curl.  
2. So sánh HTTP status.  
Expected UI: nếu vào từ browser thì bị redirect trước.  
Expected API/DB: staff/warehouse/manager bị `403` đúng chỗ; admin được `200`.  
Ưu tiên: High.  
Ghi chú: `CẦN CHECK API`.

**C. HR BONUS / PAYROLL / REPORT**

**C01 — Manager tạo/sửa/xóa thưởng theo kỳ**  
Mục tiêu: xác nhận workflow bonus đầy đủ.  
Precondition: `CẦN DB MỚI / CẦN CHẠY MIGRATION 032`; login `manager01`.  
Dữ liệu: `employee_id=2`, `month=4`, `year=2026`, `amount=1500000`, `reason=Thưởng KPI tháng 4`.  
Bước:  
1. Vào `Bảng lương` -> `Quản lý thưởng`.  
2. Tạo thưởng.  
3. Sửa amount/reason.  
4. Xóa thưởng.  
Expected UI: CRUD thành công, danh sách thưởng cập nhật đúng.  
Expected API/DB: `POST /api/salaries/bonuses` và `DELETE /api/salaries/bonuses/:id` trả `200/201`; bảng `salary_bonus_adjustments` insert/update/delete đúng.  
Ưu tiên: High.  
Ghi chú: `CẦN CHẠY MIGRATION`.

**C02 — Bonus sync vào salary row và staff view**  
Mục tiêu: bonus không chỉ tồn tại ở bảng bonus mà phản ánh vào payroll.  
Precondition: có C01 hoặc salary period tương ứng đã được generate.  
Dữ liệu: thưởng cho employee 2, kỳ `04/2026`.  
Bước:  
1. Sau khi tạo thưởng, reload bảng lương manager.  
2. Đăng nhập `staff01`, mở `Bảng lương cá nhân`.  
Expected UI: manager thấy `bonus` và `lý do thưởng`; staff cũng thấy đúng kỳ của mình.  
Expected API/DB: `salaries.bonus` và `net_salary` sync đúng; `GET /api/staff/salaries` trả `bonus_reason` nếu bảng bonus có tồn tại.  
Ưu tiên: High.  
Ghi chú: `CẦN SO SÁNH DB`.

**C03 — Report HR thống kê thưởng theo tháng/năm**  
Mục tiêu: chứng minh thưởng đã đi vào reporting.  
Precondition: DB có migration `032` và có ít nhất 1 bonus record.  
Dữ liệu: `year=2026`.  
Bước:  
1. Vào `Báo cáo` -> tab `Nhân sự`.  
2. Chọn năm chứa bonus vừa tạo.  
Expected UI: tổng thưởng năm tăng; biểu đồ/bảng HR phản ánh tháng có thưởng.  
Expected API/DB: `GET /api/reports/hr?year=2026` phản ánh `total_bonus` đúng.  
Ưu tiên: High.  
Ghi chú: `CẦN CHẠY MIGRATION`, `CẦN SO SÁNH DB`.

**C04 — Fallback behavior khi DB chưa migrate bonus**  
Mục tiêu: chứng minh DB cũ không còn làm crash flow lương.  
Precondition: dùng DB clone cũ chưa có `salary_bonus_adjustments`.  
Dữ liệu: bất kỳ staff/manager account.  
Bước:  
1. Login manager, mở `Bảng lương`.  
2. Login staff, mở `Bảng lương cá nhân`.  
Expected UI: không còn `500`; manager thấy cảnh báo mềm và panel bonus bị ẩn; staff vẫn xem lương bình thường.  
Expected API/DB: `GET /api/staff/salaries` trả `200`; `GET /api/salaries/bonuses` trả `bonus_feature_enabled=false`.  
Ưu tiên: Critical.  
Ghi chú: `CẦN TEST THỰC TẾ`, `RỦI RO DEMO CAO`.

**C05 — Regression với generate payroll / recalculate salary**  
Mục tiêu: generate payroll không làm mất bonus hoặc tạo số liệu sai.  
Precondition: DB đã migrate; có bonus record.  
Dữ liệu: kỳ lương có bonus.  
Bước:  
1. Tạo thưởng.  
2. Bấm `Tính lương tự động`.  
3. Reload page và kiểm tra salary row.  
Expected UI: salary row kỳ đó vẫn mang bonus và net_salary đúng.  
Expected API/DB: `POST /api/salaries/generate` không xóa bonus; `salaries.bonus` và `net_salary` nhất quán sau generate.  
Ưu tiên: High.  
Ghi chú: `CẦN SO SÁNH DB`.

**D. PRINT REPORT / REPORTS**

**D01 — In báo cáo lợi nhuận tháng/quý/năm**  
Mục tiêu: xác nhận flow print-friendly cho profit.  
Precondition: login role có `reports.read`; browser cho phép popup.  
Dữ liệu: `year=2026`, `group_by=month|quarter|year`.  
Bước:  
1. Vào tab `Lợi nhuận`.  
2. Đổi từng kiểu kỳ.  
3. Bấm `In báo cáo lợi nhuận`.  
Expected UI: bật cửa sổ in riêng; có tiêu đề, kỳ, thời gian in, summary, bảng số liệu.  
Expected API/DB: dùng `GET /api/reports/profit`; summary trong print phải khớp dữ liệu API.  
Ưu tiên: High.  
Ghi chú: `CẦN BẬT POPUP`, `CẦN TEST THỰC TẾ`.

**D02 — In báo cáo kho tháng/năm**  
Mục tiêu: xác nhận print flow kho usable để chấm.  
Precondition: login `warehouse01` hoặc `admin`; popup bật.  
Dữ liệu: `year=2026`, `group_by=month` và `year`.  
Bước:  
1. Vào tab `Kho hàng`.  
2. Chọn tháng/năm.  
3. Bấm `In báo cáo kho`.  
Expected UI: bản in có tổng nhập kho, giá trị xuất ròng, số lượng xuất ròng, bảng nhập kho, bảng low-stock.  
Expected API/DB: dùng `GET /api/reports/inventory`; số summary phải khớp bảng trên màn hình.  
Ưu tiên: High.  
Ghi chú: `CẦN BẬT POPUP`.

**D03 — In báo cáo xuất hàng tháng/quý/năm**  
Mục tiêu: xác nhận print flow export/sales report.  
Precondition: có popup.  
Dữ liệu: `group_by=month|quarter|year`.  
Bước:  
1. Tại tab `Kho hàng`, đổi group.  
2. Bấm `In báo cáo xuất hàng`.  
Expected UI: print view có gross export, returns, net export, net export value, bảng kỳ.  
Expected API/DB: `inventory.export_periodic` khớp bảng in.  
Ưu tiên: High.  
Ghi chú: `CẦN BẬT POPUP`.

**D04 — Popup / print layout / on-screen table regression**  
Mục tiêu: bảo đảm print flow mới không phá report cũ.  
Precondition: browser thật, popup allowed.  
Dữ liệu: profit + inventory tabs.  
Bước:  
1. Kiểm tra on-screen chart + table.  
2. Bấm print.  
3. Quay lại page và đổi tab/group.  
Expected UI: on-screen tables vẫn usable; chart không cần in; layout print không vỡ; tab khác vẫn hoạt động.  
Expected API/DB: không bắt buộc.  
Ưu tiên: Medium.  
Ghi chú: `CẦN TEST THỰC TẾ`.

**E. DEMO SETUP / RESTORE / SMOKE**

**E01 — Setup local từ máy sạch**  
Mục tiêu: chứng minh README flow đủ để chạy demo.  
Precondition: máy chưa chạy app; có Node + Docker.  
Dữ liệu: `.env.example`, Docker available.  
Bước:  
1. Copy env như README.  
2. `npm run install:all`  
3. `npm run db:up`  
4. `npm run seed:demo`  
5. `npm run demo:prepare`  
6. `npm run dev`  
Expected UI: mở được `5173`, backend lên `5001`, login được 4 tài khoản demo.  
Expected API/DB: MySQL lên `3307`; seed base + demo transactions tồn tại.  
Ưu tiên: Critical.  
Ghi chú: `CẦN TEST THỰC TẾ`, `RỦI RO DEMO CAO`.

**E02 — Restore.sh**  
Mục tiêu: xác nhận restore script dùng được trong môi trường demo.  
Precondition: có file backup thật.  
Dữ liệu: `backup_xxx.sql.gz` hoặc `.sql`.  
Bước:  
1. `cd database`  
2. `FORCE=1 ./restore.sh <file>`  
3. Chạy `npm run demo:prepare` sau restore.  
Expected UI: app login lại bình thường sau restore.  
Expected API/DB: restore đúng DB theo env; script không hỏi sai host/port/user.  
Ưu tiên: High.  
Ghi chú: `CẦN TEST THỰC TẾ`.

**E03 — Reset demo users**  
Mục tiêu: xử lý DB drift trước giờ chấm.  
Precondition: DB đang chạy.  
Dữ liệu: 4 account demo.  
Bước:  
1. Chạy `npm run demo:reset-users`.  
2. Login thử 4 tài khoản.  
Expected UI: login thành công hết.  
Expected API/DB: hash đúng; `login_attempts` của 4 username bị clear; role core permissions được sync.  
Ưu tiên: Critical.  
Ghi chú: `RỦI RO DEMO CAO`.

**E04 — Demo smoke**  
Mục tiêu: một lệnh xác nhận core role flow còn sống.  
Precondition: backend và DB lên.  
Dữ liệu: 4 account demo.  
Bước:  
1. Chạy `npm run demo:smoke`.  
Expected UI: không có.  
Expected API/DB: script pass toàn bộ login + endpoint cốt lõi admin/manager/staff/warehouse.  
Ưu tiên: Critical.  
Ghi chú: nếu fail thì không nên mở demo.

**E05 — Regression seed-demo / env / port / README**  
Mục tiêu: bảo đảm hardening setup không tự phá CRM hoặc sai port.  
Precondition: có DB test, có thể chấp nhận seed lại.  
Dữ liệu: ít nhất 1 invoice `confirmed` chưa thanh toán và 1 invoice `paid`.  
Bước:  
1. Kiểm tra `.env` root + `server/.env`.  
2. Chạy `npm run seed:demo`.  
3. Chạy `npm run smoke:server`.  
Expected UI: app không đổi port sai; backend smoke pass.  
Expected API/DB: seed-demo khi sync CRM chỉ tính invoice `paid/completed`, không lấy `confirmed`.  
Ưu tiên: Medium.  
Ghi chú: `CẦN SO SÁNH DB`.

**F. PRE-DEMO HARDENING / FLOW CHẤM ĐIỂM CAO**

**F01 — Admin quản lý user/role**  
Mục tiêu: chứng minh admin flow usable.  
Precondition: login `admin`.  
Dữ liệu: tạo 1 user test tạm nếu cần.  
Bước:  
1. Mở `Tài khoản`, `Nhóm quyền`.  
2. Tạo hoặc reset password 1 account test.  
Expected UI: CRUD tài khoản/role không lỗi; admin không bị khóa chính mình; không 403 sai.  
Expected API/DB: `/api/users`, `/api/roles` trả đúng.  
Ưu tiên: High.

**F02 — Manager HR: nhân sự, đổi chức vụ theo thời điểm, duyệt đơn nghỉ**  
Mục tiêu: chứng minh phần HR đủ khép kín.  
Precondition: login `manager01`; có đơn nghỉ pending seed sẵn.  
Dữ liệu: employee 5 pending leave; chọn 1 employee active để đổi position với `effective_date`.  
Bước:  
1. Mở `Nhân viên`, xem danh sách.  
2. Thêm 1 nhân sự mới hoặc edit nhân sự có sẵn.  
3. Đổi chức vụ theo ngày hiệu lực.  
4. Vào `Duyệt nghỉ phép`, approve 1 đơn pending.  
Expected UI: lịch sử chức vụ có thêm record; đơn nghỉ đổi trạng thái; notification/link không văng trang.  
Expected API/DB: `/api/employees/:id/positions`, `/api/leaves/:id/approve`; `employee_positions` có record mới; `leave_requests.status='approved'`.  
Ưu tiên: High.  
Ghi chú: `CẦN SO SÁNH DB`.

**F03 — Staff self-service: hồ sơ, đơn nghỉ, xem/in lương**  
Mục tiêu: chứng minh staff flow không lệch role và usable để chấm.  
Precondition: login `staff01`.  
Dữ liệu: profile hiện có; 1 đơn nghỉ mới; 1 kỳ lương có dữ liệu.  
Bước:  
1. Mở `Hồ sơ của tôi`, sửa phone/address.  
2. Nộp 1 đơn nghỉ mới.  
3. Mở `Bảng lương cá nhân`, export/print.  
Expected UI: update hồ sơ thành công; đơn nghỉ vào trạng thái `pending`; lương mở được, không 500.  
Expected API/DB: `/api/staff/profile`, `/api/staff/leaves`, `/api/staff/salaries/export`.  
Ưu tiên: High.

**F04 — Warehouse: sản phẩm, NCC, phiếu nhập**  
Mục tiêu: chứng minh kho đủ để demo.  
Precondition: login `warehouse01`.  
Dữ liệu: 1 NCC có sẵn, 1-2 product active.  
Bước:  
1. Mở `Sản phẩm`, `Nhà cung cấp`.  
2. Tạo 1 phiếu nhập mới.  
3. Reload tồn kho và báo cáo kho.  
Expected UI: phiếu nhập thành công; tồn kho tăng; báo cáo kho mở được.  
Expected API/DB: `/api/imports`; `import_receipts`, `import_receipt_items`, `inventory_movements`, `products.stock_quantity` cập nhật đúng.  
Ưu tiên: High.  
Ghi chú: `CẦN SO SÁNH DB`.

**F05 — Business/sales: hóa đơn + trạng thái thanh toán + report liên quan**  
Mục tiêu: nối trọn staff tạo invoice và manager/admin xử lý payment.  
Precondition: login `staff01` và `manager01` hoặc `admin`.  
Dữ liệu: 1 customer, 1-2 products.  
Bước:  
1. Staff tạo 1 cash invoice.  
2. Staff tạo 1 pending invoice.  
3. Manager confirm hoặc fail pending invoice.  
4. Mở lại reports revenue/profit.  
Expected UI: status flow đúng; không có invoice “ma”; báo cáo dùng lại được sau giao dịch mới.  
Expected API/DB: `invoices`, `payment_transactions`, `customers`, `products` nhất quán; report endpoints trả dữ liệu bình thường.  
Ưu tiên: Critical.  
Ghi chú: `RỦI RO DEMO CAO`.

**V. FULL REGRESSION TEST**
1. Chạy `E01`, `E03`, `E04` trước.
2. Chạy toàn bộ nhóm `B` để khóa workspace/role trước khi test nghiệp vụ.
3. Chạy nhóm `A` đầy đủ theo thứ tự `A01 -> A02 -> A03 -> A04 -> A05 -> A06`.
4. Chạy nhóm `F05` để xác nhận luồng bán hàng liên vai.
5. Chạy nhóm `F02`, `F03`, `F04`.
6. Nếu DB đã migrate `032`, chạy nhóm `C01 -> C02 -> C03 -> C05`.
7. Nếu muốn chứng minh fallback, chạy thêm `C04` trên DB clone cũ chưa migrate.
8. Chạy nhóm `D01 -> D04` với popup bật.
9. Chạy `E02` nếu còn thời gian và có backup file thật.
10. Chạy `E05` trên DB test riêng, không chạy trên DB dùng để demo live nếu không cần.

**VI. CÁC CÂU SQL / CÁCH KIỂM TRA DB**

```sql
-- INV-01: xem invoice + trạng thái payment
SELECT i.invoice_id, i.customer_id, i.final_total, i.points_earned, i.payment_method, i.status,
       pt.transaction_id, pt.status AS payment_status, pt.payment_method AS payment_method_tx,
       pt.confirmed_at, pt.note
FROM invoices i
LEFT JOIN payment_transactions pt ON pt.invoice_id = i.invoice_id
WHERE i.invoice_id = ?;

-- INV-02: xem item của invoice
SELECT ii.invoice_id, ii.product_id, p.product_name, ii.quantity, ii.unit_price, ii.subtotal
FROM invoice_items ii
JOIN products p ON p.product_id = ii.product_id
WHERE ii.invoice_id = ?;

-- CRM-01: snapshot customer trước/sau test
SELECT customer_id, full_name, membership_tier, total_points, total_spent
FROM customers
WHERE customer_id = ?;

-- STOCK-01: snapshot stock trước/sau test
SELECT product_id, product_name, stock_quantity, import_price, sell_price
FROM products
WHERE product_id IN (?, ?);

-- PAY-01: xem toàn bộ payment transaction của 1 invoice
SELECT transaction_id, invoice_id, amount, payment_method, status, confirmed_by, confirmed_at, note, created_at
FROM payment_transactions
WHERE invoice_id = ?
ORDER BY transaction_id;

-- SAL-01: salary row + bonus reason
SELECT s.salary_id, s.employee_id, e.full_name, s.month, s.year,
       s.gross_salary, s.bonus, s.deductions, s.net_salary, s.notes,
       sba.bonus_id, sba.amount AS bonus_amount, sba.reason AS bonus_reason
FROM salaries s
JOIN employees e ON e.employee_id = s.employee_id
LEFT JOIN salary_bonus_adjustments sba
  ON sba.employee_id = s.employee_id
 AND sba.month = s.month
 AND sba.year = s.year
WHERE s.employee_id = ? AND s.month = ? AND s.year = ?;

-- BONUS-01: danh sách thưởng theo kỳ
SELECT bonus_id, employee_id, month, year, amount, reason, created_by, updated_by, created_at, updated_at
FROM salary_bonus_adjustments
WHERE month = ? AND year = ?
ORDER BY employee_id;

-- LEAVE-01: đơn nghỉ của 1 nhân viên
SELECT leave_id, employee_id, leave_type, start_date, end_date, total_days, status, approved_by, approved_at, reject_reason
FROM leave_requests
WHERE employee_id = ?
ORDER BY leave_id DESC;

-- IMP-01: phiếu nhập + item
SELECT ir.receipt_id, ir.supplier_id, ir.created_by, ir.total_amount, ir.note, ir.created_at
FROM import_receipts ir
ORDER BY ir.receipt_id DESC
LIMIT 5;

SELECT iri.receipt_id, iri.product_id, p.product_name, iri.quantity, iri.unit_price
FROM import_receipt_items iri
JOIN products p ON p.product_id = iri.product_id
WHERE iri.receipt_id = ?;

-- INVMOV-01: lịch sử movement cho invoice/import
SELECT movement_id, product_id, movement_type, quantity, stock_before, stock_after,
       reference_type, reference_id, unit_cost, created_at
FROM inventory_movements
WHERE reference_type IN ('invoice', 'import_receipt')
  AND reference_id = ?
ORDER BY movement_id;

-- RBAC-01: quyền theo role
SELECT r.role_name, p.permission_name
FROM role_permissions rp
JOIN roles r ON r.role_id = rp.role_id
JOIN permissions p ON p.permission_id = rp.permission_id
WHERE r.role_name IN ('admin', 'manager', 'staff', 'warehouse')
ORDER BY r.role_name, p.permission_name;

-- USER-01: account demo hiện tại
SELECT user_id, username, role, role_id, employee_id, is_active, deleted_at
FROM users
WHERE username IN ('admin', 'manager01', 'staff01', 'warehouse01')
ORDER BY user_id;
```

**VII. RỦI RO CÒN LẠI SAU KHI TEST**
- `RỦI RO DEMO CAO` nhất là `A03/A04/A05`. Đây là nơi chứng minh lỗi CRM cũ đã vá thật. Nếu fail, ảnh hưởng trực tiếp `Hoạt động thương mại 20 điểm`.
- `RỦI RO DEMO CAO` thứ hai là `B01/B03/E03/E04`. Nếu login/landing/redirect sai, bài demo đứt ngay từ đầu và ảnh hưởng `Admin`, `Nhân sự`, `Kho`, `Kinh doanh`.
- `C01/C02/C03` chỉ nên demo đầy đủ nếu đã xác nhận DB có migration `032`. Nếu chưa, chỉ demo `C04` fallback và tránh trình diễn “thêm thưởng”.
- `D01-D04` dễ fail vì popup browser. Trước demo phải cho phép popup, nếu không sẽ bị hiểu nhầm là bug code.
- `E02 restore.sh` cần backup file thật; nếu chưa verify, không nên bấm restore sát giờ chấm.
- `E05 seed-demo CRM regression` nên test trên DB clone, không nên chạy force trên DB live dùng để demo nếu chưa cần.
- `Không nên bấm khi demo nếu chưa verify xong`: storefront/customer ngoài scope, bonus CRUD trên DB chưa migrate, restore DB live, reseed force trên DB demo.

**VIII. KẾT LUẬN**
- Nếu pass phần lớn các test `E01/E03/E04`, `B01-B04`, `A01-A06`, `F02-F05`, `D01-D03` thì có thể kết luận bản hiện tại **đủ an toàn để demo/chấm phần codebase 60 điểm**.
- Nếu fail `A03/A04/A05`, bài sẽ bị trừ nặng ở `Hoạt động thương mại`.
- Nếu fail `B01-B04`, bài bị trừ ở `Giao diện Admin` và tính đúng phân vai.
- Nếu fail `C01-C03` trên DB đã migrate, bài bị hụt ở `Nhân sự 20 điểm`.
- Nếu chỉ fail `C01-C03` nhưng `C04` pass trên DB cũ, có thể vẫn demo an toàn nếu **không trình diễn bonus workflow** và ghi chú rõ “cần chạy migration 032 để bật phần thưởng đầy đủ”.
- Bộ test quan trọng nhất để chứng minh “đã sửa xong thật” là: `A02 -> A03`, `A02 -> A04`, `A02 -> A05`, `B01`, `B03`, `C04`, `D01`, `E04`, `F02`, `F05`.

Nếu muốn, lượt tiếp theo mình có thể chuyển bộ này thành một **file UAT checklist Markdown hoàn chỉnh trong repo** hoặc thành một **bộ checklist ngắn dạng copy-paste cho QA/demo runner**.