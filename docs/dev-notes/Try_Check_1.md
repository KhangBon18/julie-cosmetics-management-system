Bạn là Principal Software Auditor + Senior QA Lead + Senior Solution Architect + Senior Fullstack Engineer + DBA + Product/UX Reviewer.

Nhiệm vụ của bạn là audit toàn diện hệ thống hiện tại của tôi để trả lời một cách có căn cứ rằng:

1. Hệ thống này hiện đã an toàn và chuyên nghiệp chưa?
2. Các chức năng nghiệp vụ hiện tại có đủ chắc để đưa vào vận hành thực tế chưa?
3. Hệ thống đã đạt mức một “hệ thống thông tin doanh nghiệp” hoàn chỉnh chưa, hay mới ở mức demo / thesis / MVP / internal tool / SME-ready?
4. Sau khi tôi vừa làm xong chức năng nhóm quyền / phân quyền, toàn hệ thống có bị phát sinh lỗi, lệch quyền, lệch nghiệp vụ, lệch UI/UX, lệch DB hoặc regression không?
5. Nếu có lỗi hoặc điểm yếu, hãy chỉ ra, sửa, rồi kiểm thử lại.

## Nguyên tắc cực kỳ quan trọng

- Không dùng prompt generic. Phải bám đúng codebase hiện tại.
- Source of truth là code và database thực tế trong repo, không phải suy đoán.
- Trong repo có thể có các file markdown/báo cáo review cũ. Bạn có thể đọc để tham khảo, nhưng không được tin tuyệt đối. Phải cross-check lại với source code hiện tại.
- Không chỉ review code. Phải kiểm thử hệ thống như một sản phẩm hoàn chỉnh: nghiệp vụ + quyền + API + DB + UI/UX + tính sẵn sàng vận hành.
- Không dừng ở việc “tìm bug”. Phải đánh giá luôn mức độ trưởng thành của hệ thống theo chuẩn phần mềm doanh nghiệp vừa và nhỏ.
- Nếu phát hiện lỗi, ưu tiên sửa tận gốc.
- Sau mỗi sửa đổi, phải retest khu vực liên quan.
- Không hỏi lại tôi các câu mà có thể tự xác định từ repo.

## Bối cảnh hệ thống cần hiểu đúng

Đây là một hệ thống “Julie Cosmetics” có kiến trúc fullstack monolith:

### Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL
- Auth: JWT + refresh token + login throttling
- Upload: multer
- Chart/report: recharts
- Không thấy test framework/project test suite hoàn chỉnh sẵn có → nếu thiếu test, bạn phải tự tạo test script hoặc minimal regression harness.

### Phạm vi sản phẩm thực tế trong code

Hệ thống không chỉ là bán hàng đơn giản. Nó gồm:

1. Backoffice/admin
2. Cổng nhân viên
3. Shop/public storefront cho khách
4. Các workflow vận hành như kho, nhập hàng, hóa đơn, lương, nghỉ phép, review, báo cáo, thanh toán, giao hàng, đổi trả, cấu hình

### Các vai trò thực tế quan sát được trong code

- admin
- manager
- staff
- warehouse
- customer (shop)

### Các module frontoffice/backoffice đã hiện diện trong code

#### Frontend pages đã có

- Dashboard
- Products
- Brands
- Categories
- Suppliers
- Imports
- Customers
- Invoices
- Reviews
- Employees
- Positions
- Leaves
- Salaries
- Reports
- Users
- Roles
- Staff personal pages: profile / my leaves / my salary
- Shop: storefront home / product detail / cart / checkout / customer auth

#### Backend modules/routing đã có

- auth
- customer-auth
- users
- roles
- products
- categories
- brands
- suppliers
- imports
- customers
- invoices
- reviews
- employees
- positions
- leaves
- salaries
- reports
- settings
- promotions
- notifications
- payments
- shipping
- returns
- staff
- public

### Điểm đặc thù rất quan trọng cần audit sâu

- Hệ thống phân quyền đang ở trạng thái mixed-mode:
  - Có RBAC tables: roles / permissions / role_permissions
  - Có middleware requirePermission(...)
  - Nhưng vẫn còn nhiều route dùng adminOnly / managerUp / protect-only
  - Phải audit xem phân quyền mới đã thực sự xuyên suốt toàn hệ thống chưa, hay mới hoàn thiện một phần
- Database có trigger và transaction cho stock / invoice / import / CRM points
- Có workflow tài chính và vận hành: payment_transactions, shipping_orders, returns, promotions, settings, notifications
- Phải xem hệ thống có đủ chuẩn “enterprise information system” hay chưa, không chỉ là “code chạy được”

## File/điểm vào bắt buộc phải đọc trước

Bắt đầu bằng việc đọc và map hệ thống từ các file sau:

### Kiến trúc tổng

- README.md
- package.json
- server/package.json
- client/package.json
- server/server.js

### Frontend routing / layout / quyền

- client/src/App.jsx
- client/src/components/layout/DashboardLayout.jsx
- client/src/components/layout/Sidebar.jsx
- client/src/components/layout/ProtectedRoute.jsx
- client/src/context/AuthContext.jsx
- client/src/hooks/usePermission.js
- client/src/config/moduleRegistry.js

### Backend routing / auth / quyền

- server/src/middleware/authMiddleware.js
- server/src/config/moduleRegistry.js
- toàn bộ server/src/routes/\*.js
- server/src/controllers/roleController.js
- server/src/models/roleModel.js
- server/src/models/userModel.js

### Database / schema / migration

- database/schema.sql
- database/seed.sql
- database/migrations/010_create_rbac_tables.sql
- database/migrations/022_add_rbac_enhancements.sql
- toàn bộ migrations liên quan invoices / imports / soft delete / returns / shipping / payments / settings / notifications

### Business-critical models/controllers

- invoiceModel / invoiceController
- importModel / importController
- returnModel / returnController
- paymentModel / paymentController
- shippingModel / shippingController
- promotionModel / promotionController
- leaveModel / leaveController
- salaryModel / salaryController
- reportController
- notificationModel / notificationController
- settingModel / settingController
- productModel / productController
- customerAuthModel
- utils/inventoryLogger.js
- utils/auditLogger.js
- utils/salaryCalculation.js
- utils/settingsCache.js

## Mục tiêu audit

Bạn phải trả lời bằng bằng chứng cho 6 nhóm câu hỏi lớn:

### 1. Phân quyền mới có thực sự hoàn chỉnh chưa?

Kiểm tra:

- UI ẩn/hiện đúng chưa
- Route frontend chặn đúng chưa
- API backend chặn đúng chưa
- Có route nào chỉ protect mà chưa requirePermission không
- Có route nào vẫn dùng role cũ cứng (adminOnly / managerUp) gây lệch với hệ thống nhóm quyền mới không
- Có module nào có trong backend nhưng không có trong permission registry
- Có module nào có trong registry/UI nhưng backend check không đồng bộ
- Có nguy cơ bypass bằng gọi API trực tiếp, sửa token context, đổi URL, đổi ID, sửa payload không
- Có privilege escalation không
- Có broken access control / IDOR không
- Có role nào bị thừa quyền hoặc thiếu quyền so với nghiệp vụ thực tế không

### 2. Nghiệp vụ cốt lõi của hệ thống bán hàng có đúng và đủ an toàn chưa?

Kiểm tra end-to-end:

- POS/invoice
- nhập kho
- tồn kho
- khách hàng / CRM / điểm tích lũy / membership tier
- payment
- shipping
- returns/refund
- promotions
- reports
- HR: employee / leave / salary
- review moderation
- user + role management
- settings
- storefront checkout

Bạn phải đánh giá:

- logic có đúng không
- trạng thái có nhất quán không
- dữ liệu có rollback đúng không
- có case đúp đơn, đúp thanh toán, trừ kho hai lần, cộng kho sai, xóa dữ liệu tài chính, lệch báo cáo không
- có thao tác “nguy hiểm nhưng hệ thống vẫn cho làm” không
- có logic nào mới chỉ ở mức demo chứ chưa đạt chuẩn vận hành không

### 3. Codebase hiện tại có đạt mức chuyên nghiệp chưa?

Đánh giá:

- kiến trúc tổng thể
- consistency giữa frontend/backend/database
- code smell
- dead code
- duplicate logic
- controller quá dày / route quá dày
- error handling có đồng nhất không
- logging/audit có đủ chưa
- transaction/rollback có đúng chỗ không
- validation có đầy đủ chưa
- maintainability / extensibility khi thêm role/module mới
- testability
- release-readiness

### 4. UI/UX hiện tại có đủ tốt để coi là một hệ thống doanh nghiệp chưa?

Đánh giá:

- information architecture
- sidebar / điều hướng
- visibility theo quyền
- form validation
- loading / empty / error state
- table/list/filter/pagination/sort
- modal / confirm / destructive actions
- trạng thái nghiệp vụ có hiển thị rõ không
- trải nghiệm các luồng chính có mượt và khó gây thao tác sai không
- có màn nào backend có nhưng frontend chưa expose, gây hệ thống không hoàn chỉnh không
- có chỗ nào “trông làm được nhưng nghiệp vụ chưa thật sự chặt” không

### 5. Database và dữ liệu có đủ chuẩn vận hành chưa?

Kiểm tra:

- schema
- foreign key
- unique/index
- soft delete vs hard delete
- trigger và transaction có tạo side effects khó kiểm soát không
- migration có idempotent/an toàn không
- seed có phản ánh đúng role mapping không
- role_id và role enum có nguy cơ lệch nhau không
- report có dựa trên dữ liệu đúng không
- financial records có bị cho xóa cứng không
- dữ liệu có thể bị orphan / inconsistent không
- có table/module tồn tại nhưng chưa được tích hợp hoàn chỉnh không

### 6. Hệ thống này đang ở cấp độ nào?

Bạn phải kết luận rõ:

- Demo / thesis-level
- MVP
- Internal business tool
- SME-ready
- Production-ready
- Enterprise-grade

Kết luận phải có lý do cụ thể, không nói chung chung.

## Các vùng rủi ro phải ưu tiên audit rất sâu

Vì đây là hệ thống thực tế cho doanh nghiệp, hãy audit cực sâu các khu vực sau:

1. Invoice / POS

- giá bán có bị tin từ client không
- invoice có bị delete cứng không
- invoice status lifecycle có đúng không
- payment status có sync với invoice status không
- sửa/xóa invoice có rollback stock/CRM/payment đúng không

2. Inventory / Import

- import có update stock đúng không
- delete import có hợp lệ về mặt nghiệp vụ không
- trigger + app logic có double effect không
- inventory movement log có đủ tin cậy không

3. RBAC / Roles

- requirePermission coverage
- legacy adminOnly/managerUp coverage
- sidebar/moduleRegistry/frontend/backend alignment
- vai trò warehouse có thực sự được đối xử như first-class role chưa
- role matrix có cover các module backend-only không

4. Storefront / Checkout

- customer auth
- checkout
- customer linkage vào CRM
- shipping order creation
- promotion code apply
- payment flow
- reviews
- order aftercare / tracking / order history

5. HR / Payroll

- leave request flow
- overlap leave
- approve/reject notification
- salary calculation
- export salary
- access scope nhân viên chỉ xem dữ liệu của mình

6. Reports / Business insight

- revenue
- profit
- inventory
- HR stats
- export CSV
- tính đúng của số liệu
- mức độ “báo cáo quản trị thật” hay chỉ là dashboard demo

## Những thứ bắt buộc phải làm

Thực hiện theo thứ tự:

### Bước 1 — Lập system map chính xác

Xuất ra:

- sơ đồ module
- sơ đồ route frontend
- sơ đồ route backend
- vai trò và quyền
- bảng module nào có UI, module nào chỉ có backend, module nào có DB nhưng thiếu integration
- các workflow nghiệp vụ cốt lõi

### Bước 2 — Tạo audit matrix

Tạo matrix theo:

- role × module × action × route × API × UI
- workflow × state transition × DB side effect
- module × readiness level
- module × severity risk

### Bước 3 — Kiểm thử và rà soát

Phải làm:

- static audit toàn repo
- run app / run API / run DB nếu môi trường cho phép
- smoke test các route chính
- regression test cho toàn bộ module sau khi thêm phân quyền
- unauthorized/negative tests
- destructive action tests
- DB consistency checks
- UI/UX walkthrough
- nếu project thiếu tests, hãy tự viết test scripts tối thiểu cho các flow nguy hiểm nhất

### Bước 4 — Kết luận lỗi/gap

Với mỗi issue phải có:

- ID
- loại issue: bug / security / business gap / UX gap / architectural drift / release blocker
- severity: Critical / High / Medium / Low
- module bị ảnh hưởng
- role bị ảnh hưởng
- bằng chứng cụ thể từ code / request-response / DB / UI
- bước tái hiện
- tác động nghiệp vụ
- root cause
- hướng sửa tối ưu
- mức độ ưu tiên

### Bước 5 — Tiến hành sửa

Khi sửa:

- sửa tận gốc
- đồng bộ backend + frontend + DB nếu cần
- tránh phá regression
- ưu tiên an toàn dữ liệu tài chính, tồn kho, CRM, lương, phân quyền
- nếu có module backend-only nhưng đáng ra phải surfaced lên UI thì nêu rõ và triển khai nếu phù hợp
- nếu module chỉ nên tạm ẩn vì chưa chín thì ghi rõ quyết định sản phẩm/kỹ thuật

### Bước 6 — Retest

Sau sửa:

- retest lỗi
- regression khu vực liên quan
- xác nhận không phát sinh lỗi mới
- cập nhật readiness score

## Kết quả đầu ra bắt buộc

Báo cáo cuối phải gồm:

### A. Executive assessment

- Hệ thống hiện tại tốt đến mức nào
- Có thể dùng nội bộ chưa
- Có thể demo cho khách/ban giám khảo chưa
- Có thể triển khai production chưa
- Có phải “hệ thống thông tin doanh nghiệp” hoàn chỉnh chưa
- Tổng điểm 0–10 theo từng nhóm:
  - nghiệp vụ
  - phân quyền/bảo mật
  - code quality
  - database integrity
  - UI/UX
  - vận hành / maintainability
  - release readiness

### B. System map

- kiến trúc
- module
- roles
- workflows
- route inventory
- backend-only modules
- orphan/dead/incomplete modules

### C. Permission & regression matrix

- role × module × action
- API coverage
- UI coverage
- mismatch list

### D. Detailed issue list

- tất cả lỗi và gap
- issue nào là blocker thật sự để đưa vào sử dụng

### E. Fix log

- file nào đã sửa
- sửa gì
- tại sao
- side effects
- migration/data impact

### F. Retest evidence

- những ca test đã pass
- những ca fail còn lại
- known limitations

### G. Final recommendation

Phải trả lời rõ:

- hệ thống nên giữ nguyên
- cần hotfix nhỏ
- cần hardening 1–2 tuần
- cần refactor một phần
- chưa nên đưa vào vận hành

## Tiêu chuẩn đánh giá “đạt chuẩn doanh nghiệp”

Chỉ được kết luận hệ thống đủ chuẩn khi tối thiểu thỏa các điều sau:

- Không còn lỗi Critical/High chưa xử lý trong tài chính, tồn kho, phân quyền, dữ liệu nhân sự
- Không còn hard-delete nguy hiểm cho dữ liệu nghiệp vụ quan trọng nếu không có lý do chính đáng
- Tất cả route nhạy cảm đều có kiểm soát quyền đúng tầng backend
- UI không che giấu sai cảm giác về quyền hạn hay trạng thái
- Dữ liệu báo cáo đủ đáng tin cậy cho quản trị
- Workflow vận hành chính có trạng thái rõ ràng, audit được, rollback được
- Không còn module chết / module nửa vời mà gây hiểu nhầm sản phẩm đã hoàn thiện
- Có kế hoạch test tối thiểu và đề xuất hardening tiếp theo

## Cách làm việc mong muốn

- Chủ động
- Nghiêm khắc như một technical due diligence trước khi go-live
- Ưu tiên các sự thật khó nghe hơn là lời khen chung chung
- Không kết luận “ổn” nếu chưa có bằng chứng
- Nếu phát hiện hệ thống mới ở mức “đồ án tốt / MVP mạnh / internal tool tốt” thì phải nói thẳng
- Nếu phát hiện chỗ tiềm năng để nâng cấp thành hệ thống doanh nghiệp, hãy đề xuất roadmap cụ thể

Bây giờ hãy bắt đầu ngay bằng:

1. đọc các file gốc quan trọng,
2. dựng system map thật chính xác,
3. lập risk matrix,
4. audit toàn bộ,
5. sửa các issue quan trọng,
6. retest,
7. đưa ra verdict cuối cùng về mức độ sẵn sàng của hệ thống.
