**Vai trò của bạn:**
Bạn là một **Senior Solution Architect + Senior QA Lead + Senior Product Analyst + Security Reviewer + UI/UX Auditor**, chuyên kiểm tra các hệ thống doanh nghiệp và nền tảng bán hàng quy mô thực tế.

**Bối cảnh hệ thống:**
Tôi có một hệ thống **bán mỹ phẩm và quản lý doanh nghiệp**, gồm:

1. **Giao diện bán hàng cho khách online**
   - Có **2 giao diện bán hàng cho khách**
   - Dùng để khách xem sản phẩm, tìm kiếm, thêm giỏ hàng, đặt hàng, thanh toán, theo dõi đơn, quản lý tài khoản, v.v.

2. **Giao diện Admin / Backoffice**
   - Có tài khoản **Admin** quản lý toàn bộ hệ thống
   - Có tài khoản **Nhân viên**, mỗi tài khoản được phân quyền theo role nên sẽ thấy chức năng khác nhau

3. Hệ thống có đầy đủ các tầng cần kiểm tra:
   - **Frontend (UI/UX)**
   - **Backend / API / Business logic**
   - **Database**
   - **Phân quyền / role**
   - **Quy trình nghiệp vụ**
   - **Các module chức năng**
   - **Luồng xử lý toàn hệ thống**
   - **Tính ổn định, bảo mật, khả năng phát sinh lỗi**

---

## Mục tiêu

Hãy thực hiện một cuộc **audit toàn diện, sâu và thực tế** cho toàn bộ hệ thống của tôi để đánh giá:

1. Hệ thống hiện tại đã **hoàn chỉnh** chưa
2. Có **lỗi nào đang tồn tại** không
3. Có khu vực nào **dễ phát sinh lỗi trong tương lai** không
4. Có **lỗi nghiêm trọng / critical** nào không
5. Có **logic nghiệp vụ nào sai** không
6. Có **chức năng nào sai logic / hoạt động không đúng / không hoạt động được** không
7. Có điểm nào **thiết kế chưa tốt, khó mở rộng, khó bảo trì** không
8. Có lỗ hổng nào liên quan đến **bảo mật, phân quyền, dữ liệu, hiệu năng, tính nhất quán** không
9. Trải nghiệm người dùng ở cả **user side** và **admin side** có hợp lý chưa
10. Toàn bộ hệ thống có đủ mức độ sẵn sàng để vận hành thực tế chưa

---

## Dữ liệu đầu vào bạn sẽ được cung cấp

Bạn sẽ sử dụng toàn bộ tài nguyên tôi cung cấp để audit, có thể bao gồm:

- Link môi trường chạy thực tế: http://localhost:5173/shop
- Link giao diện admin: http://localhost:5173/admin
- Tài khoản test user: 0961111111 / 123123
- Tài khoản admin: admin / 123123
- Tài khoản nhân viên theo từng role: staff01 / 123123 - manager01 / 123123 - warehouse01 / 123123
- Source code FE: @/Users/heisenbon/Documents/Workspace Code/HTTTDN/Julie Cosmetics/client
- Source code BE: @/Users/heisenbon/Documents/Workspace Code/HTTTDN/Julie Cosmetics/server
- Database schema / ERD / migration / dump: @/Users/heisenbon/Documents/Workspace Code/HTTTDN/Julie Cosmetics/server/db

Nếu thiếu dữ liệu, hãy nêu rõ **thiếu cái gì** và **việc thiếu đó ảnh hưởng thế nào đến độ chính xác của audit**.

---

## Phạm vi kiểm tra bắt buộc

### 1) Kiểm tra tổng thể kiến trúc hệ thống

Phân tích toàn bộ kiến trúc FE / BE / DB / module / tầng xử lý để đánh giá:

- Thiết kế có rõ ràng, hợp lý, dễ mở rộng không
- Có coupling cao, phụ thuộc chéo, khó bảo trì không
- Có điểm nghẽn kiến trúc hoặc thiết kế dễ gây lỗi dây chuyền không
- Có logic nào đang đặt sai tầng không
  Ví dụ:
  - Logic nghiệp vụ đặt ở FE thay vì BE
  - Validation chỉ có ở FE mà BE không kiểm soát
  - Rule phân quyền xử lý không nhất quán
  - Tính toán quan trọng nằm ở client

---

### 2) Kiểm tra Frontend toàn diện (cả user và admin)

Kiểm tra sâu toàn bộ giao diện:

#### Về UI/UX

- Bố cục có hợp lý không
- Flow thao tác có tự nhiên không
- Có gây nhầm lẫn cho user/admin không
- Có bước thừa, khó hiểu, thiếu trạng thái phản hồi không
- Form có dễ dùng không
- Label, placeholder, validation message, cảnh báo lỗi có rõ ràng không
- Trạng thái loading / empty / error / success có đầy đủ không
- Có vấn đề responsive không
- Có vấn đề accessibility cơ bản không
- Có inconsistency giữa các màn hình không

#### Về chức năng FE

- Nút bấm, form, modal, table, filter, sort, pagination, upload, export, import, thao tác hàng loạt có hoạt động đúng không
- Điều hướng có lỗi không
- Có lỗi state, lỗi đồng bộ dữ liệu, lỗi refresh, lỗi cache cũ không
- Có bug khi thao tác nhanh, thao tác lặp, click nhiều lần không
- Có bug ở các case đặc biệt, dữ liệu rỗng, dữ liệu dài, ký tự lạ, số âm, số rất lớn, ảnh lỗi, file lỗi không
- Có lỗi hiển thị sai dữ liệu theo role không
- Có chỗ FE hiển thị khác logic thật của BE không

---

### 3) Kiểm tra Backend / API / service / business logic

Audit toàn bộ BE theo hướng thực chiến:

- API có đúng chuẩn, nhất quán, dễ hiểu không
- Có validate input đầy đủ không
- Có xử lý lỗi rõ ràng không
- Có thiếu kiểm tra quyền không
- Có endpoint nào dễ bị gọi sai role không
- Có race condition / double submit / duplicate request / xử lý lặp không
- Có lỗi transaction không
- Có logic xử lý đơn hàng, tồn kho, thanh toán, khuyến mãi, voucher, hoàn đơn, huỷ đơn, đổi trạng thái bị sai không
- Có case nào gây sai dữ liệu khi nhiều người thao tác đồng thời không
- Có bug khi retry request không
- Có logic nào mâu thuẫn giữa các module không
- Có chỗ nào dễ phát sinh lỗi nhưng hiện chưa lộ rõ không

Hãy kiểm tra thêm:

- Authentication
- Authorization / RBAC
- Session / token / refresh token
- Idempotency cho hành động quan trọng
- Logging, monitoring, audit log
- Background jobs / queue / cron (nếu có)
- Xử lý webhook / callback từ bên thứ ba (nếu có)

---

### 4) Kiểm tra Database

Phân tích database theo cả góc độ thiết kế lẫn vận hành:

- Thiết kế bảng có hợp lý không
- Quan hệ giữa các bảng có đúng nghiệp vụ không
- Có thừa / thiếu bảng, thừa / thiếu cột quan trọng không
- Kiểu dữ liệu có phù hợp không
- Có index chưa hợp lý hoặc thiếu index không
- Có rủi ro full scan, query chậm, N+1, join nặng không
- Có ràng buộc dữ liệu chưa đủ chặt không
- Có vấn đề về unique, foreign key, cascade, nullability, soft delete không
- Có rủi ro mất nhất quán dữ liệu không
- Có nguy cơ sai số tiền / sai tồn kho / sai trạng thái đơn không
- Có khả năng phát sinh dữ liệu rác, dữ liệu orphan, dữ liệu trùng, dữ liệu không đồng bộ không
- Migration có an toàn không
- Có vấn đề backup / restore / audit trail không

---

### 5) Kiểm tra nghiệp vụ bán mỹ phẩm

Đây là phần rất quan trọng. Hãy kiểm tra nghiệp vụ theo đúng logic hệ thống bán mỹ phẩm và bán hàng online / quản trị doanh nghiệp.

Đặc biệt rà soát các module nghiệp vụ như:

- Đăng ký / đăng nhập / quên mật khẩu
- Hồ sơ khách hàng
- Danh mục sản phẩm
- Brand / category / thuộc tính sản phẩm
- SKU / biến thể / dung tích / màu / loại da / công dụng
- Giá bán / giá gốc / giá khuyến mãi
- Voucher / coupon / combo / flash sale / quà tặng
- Tồn kho / xuất nhập / cảnh báo tồn
- Giỏ hàng
- Checkout
- Phí ship
- Địa chỉ giao hàng
- Thanh toán
- Tạo đơn hàng
- Xử lý đơn hàng
- Huỷ đơn
- Hoàn đơn / hoàn tiền
- Đổi trạng thái đơn
- Tracking đơn
- Đánh giá sản phẩm
- Yêu thích / wishlist
- Tích điểm / hạng thành viên nếu có
- Banner / nội dung / landing page nếu có
- Quản lý khách hàng
- Quản lý nhân viên và phân quyền
- Báo cáo / thống kê / dashboard
- Thông báo / email / SMS / push nếu có

Với từng nghiệp vụ, hãy kiểm tra:

- Logic có đúng bản chất nghiệp vụ không
- Luồng có đầy đủ không
- Có case nào thiếu không
- Có trạng thái nào chuyển sai không
- Có quy tắc tính tiền nào sai không
- Có quy tắc voucher / khuyến mãi chồng chéo sai không
- Có khả năng âm kho / sai kho / giữ hàng sai không
- Có case đặt hàng thành công nhưng dữ liệu không đồng bộ không
- Có tình huống user/admin/nhân viên thao tác gây lệch dữ liệu không

---

### 6) Kiểm tra phân quyền và role

Audit cực kỹ phần role-based access:

- Admin có toàn quyền đúng như yêu cầu không
- Nhân viên theo từng role có thấy đúng chức năng cần thấy không
- Có menu nào bị lộ cho sai role không
- Có màn hình ẩn nhưng API vẫn gọi được không
- Có hành động nguy hiểm nào không chặn quyền không
- Có lỗ hổng leo thang đặc quyền không
- Có trường hợp role thấp nhưng sửa/xoá/xem dữ liệu không được phép không
- Có trường hợp role bị thiếu quyền cần thiết làm gián đoạn vận hành không

Hãy kiểm tra cả:

- Quyền xem
- Quyền tạo
- Quyền sửa
- Quyền xoá
- Quyền duyệt
- Quyền export/import
- Quyền xem báo cáo nhạy cảm
- Quyền thao tác trên đơn hàng / khách hàng / nhân sự / cấu hình hệ thống

---

### 7) Kiểm tra bảo mật

Hãy audit theo mức ứng dụng doanh nghiệp thực tế:

- SQL Injection
- XSS
- CSRF
- IDOR
- Broken Access Control
- Lộ thông tin nhạy cảm
- Hardcode secret / token / key
- Upload file không an toàn
- Thiếu rate limit
- Thiếu kiểm soát brute force
- Session/token xử lý chưa an toàn
- Lộ dữ liệu khách hàng
- API trả dữ liệu dư thừa
- Log làm lộ thông tin nhạy cảm
- Thiếu kiểm soát các thao tác tài chính / đơn hàng / phân quyền

Không chỉ nêu tên lỗ hổng; hãy chỉ rõ:

- Nó nằm ở đâu
- Cách tái hiện
- Mức độ nghiêm trọng
- Ảnh hưởng thực tế
- Hướng khắc phục

---

### 8) Kiểm tra hiệu năng và độ ổn định

Hãy đánh giá:

- FE có chậm không
- API nào chậm
- Query nào có nguy cơ nghẽn
- Có vấn đề N+1 không
- Có đoạn xử lý đồng bộ quá nặng không
- Có chỗ dễ timeout không
- Có cache sai / stale data không
- Có điểm nào dễ sập khi tải tăng không
- Có thao tác nào dễ gây deadlock / race condition không
- Có hành động nào nhạy cảm với concurrent users không
  Ví dụ:
  - nhiều người cùng mua 1 sản phẩm
  - nhiều nhân viên cùng xử lý 1 đơn
  - user bấm đặt hàng nhiều lần
  - áp voucher cùng lúc
  - cập nhật tồn kho song song

---

### 9) Kiểm tra tính hoàn chỉnh của từng module

Với mỗi module, hãy trả lời rõ:

- Module này đã hoàn chỉnh chưa
- Có thiếu case nào không
- Có lỗi logic nào không
- Có lỗi UI/UX nào không
- Có lỗi kỹ thuật nào không
- Có rủi ro phát sinh lỗi cao không
- Mức độ ưu tiên xử lý là gì

---

### 10) Kiểm tra end-to-end toàn hệ thống

Bạn phải kiểm tra theo các luồng xuyên suốt, không chỉ từng màn hình riêng lẻ.

Ví dụ các luồng bắt buộc:

- User đăng ký → đăng nhập → tìm sản phẩm → thêm giỏ → áp voucher → checkout → thanh toán → tạo đơn → theo dõi đơn
- Admin tạo sản phẩm / cập nhật giá / cập nhật tồn kho → user mua hàng → đơn vào hệ thống → nhân viên xử lý → đổi trạng thái → báo cáo cập nhật
- Nhân viên role A chỉ xem được phần A, role B chỉ thao tác phần B
- User huỷ đơn / admin huỷ đơn / hoàn tiền / đổi trạng thái đơn
- Khuyến mãi thay đổi nhưng giá hiển thị và giá thanh toán vẫn đúng
- Tồn kho thay đổi đúng sau các thao tác liên quan

Hãy kiểm tra xem có lỗi đứt luồng, lệch dữ liệu, sai trạng thái, sai hiển thị, hoặc sai nghiệp vụ ở bất kỳ điểm nối nào không.

---

## Phương pháp làm việc yêu cầu

Tôi không cần một bản nhận xét chung chung.
Tôi cần bạn làm việc như một đội audit thật sự.

Hãy thực hiện theo phương pháp sau:

1. **Khảo sát tổng quan hệ thống**
2. **Liệt kê tất cả module / vai trò / luồng chính**
3. **Kiểm tra từng tầng: FE / BE / DB / nghiệp vụ / bảo mật / hiệu năng**
4. **Kiểm tra từng role**
5. **Kiểm tra từng module**
6. **Kiểm tra end-to-end**
7. **Tổng hợp lỗi, rủi ro và mức độ hoàn thiện**
8. **Đề xuất hướng sửa theo thứ tự ưu tiên**

---

## Cách trả kết quả bắt buộc

Hãy trả kết quả theo cấu trúc sau:

### A. Executive Summary

- Đánh giá tổng thể hệ thống hiện tại
- Mức độ hoàn thiện: `% ước lượng`
- Có đủ sẵn sàng để vận hành chưa
- Các rủi ro lớn nhất
- Kết luận ngắn gọn nhưng rõ ràng

### B. Danh sách module và trạng thái

Bảng gồm:

- Tên module
- Mức độ hoàn thiện
- Có lỗi không
- Có sai logic không
- Có rủi ro cao không
- Mức độ ưu tiên

### C. Danh sách lỗi chi tiết

Với mỗi lỗi, bắt buộc nêu:

- ID lỗi
- Tên lỗi
- Khu vực bị lỗi
- Mô tả lỗi
- Cách tái hiện
- Kết quả hiện tại
- Kết quả đúng mong đợi
- Mức độ nghiêm trọng: `Critical / High / Medium / Low`
- Mức độ ưu tiên xử lý: `P0 / P1 / P2 / P3`
- Nguyên nhân gốc có thể có
- Ảnh hưởng nghiệp vụ / kỹ thuật
- Đề xuất sửa

### D. Danh sách sai logic nghiệp vụ

- Nghiệp vụ nào sai
- Sai ở đâu
- Vì sao sai
- Hậu quả thực tế
- Cách chỉnh đúng theo flow đề xuất

### E. Danh sách rủi ro tiềm ẩn

Bao gồm cả lỗi chưa xảy ra nhưng rất dễ phát sinh:

- Điểm yếu thiết kế
- Điểm yếu dữ liệu
- Điểm yếu phân quyền
- Điểm yếu hiệu năng
- Điểm yếu bảo mật
- Điểm yếu vận hành

### F. Đánh giá theo từng tầng

- Frontend
- UI/UX
- Backend
- API
- Database
- Business logic
- Role/Permission
- Security
- Performance
- Maintainability
- Scalability

Mỗi tầng cần có:

- Nhận định
- Vấn đề
- Mức độ nghiêm trọng
- Hướng cải thiện

### G. Danh sách kiểm tra theo role

- Admin
- Nhân viên từng role
- User cuối

Nêu rõ:

- Role thấy gì
- Role làm được gì
- Role không nên làm gì nhưng hiện có thể làm
- Role cần làm nhưng hiện lại không làm được

### H. Kiểm tra các luồng end-to-end

Liệt kê từng luồng đã kiểm tra, kết quả:

- Pass
- Pass nhưng có rủi ro
- Fail

### I. Ưu tiên xử lý

Chia theo:

- **P0**: lỗi phải sửa ngay
- **P1**: lỗi nghiêm trọng nên sửa sớm
- **P2**: lỗi trung bình
- **P3**: lỗi tối ưu thêm

### J. Kết luận cuối cùng

Trả lời dứt điểm:

- Hệ thống đã hoàn chỉnh chưa
- Có thể đưa vào vận hành ổn định chưa
- Những phần nào chưa đạt
- Những phần nào phải sửa trước khi mở rộng hoặc scale

---

## Quy tắc đánh giá

Khi audit, hãy ưu tiên phát hiện các lỗi kiểu sau:

- Lỗi khiến chức năng **không hoạt động được**
- Lỗi khiến **sai dữ liệu**
- Lỗi khiến **sai tiền / sai tồn kho / sai đơn hàng**
- Lỗi **phân quyền**
- Lỗi **logic nghiệp vụ**
- Lỗi **bảo mật**
- Lỗi **dễ phát sinh khi dùng thực tế**
- Lỗi **chỉ xảy ra ở case biên, case đồng thời, case hiếm**
- Lỗi **gây khó mở rộng, khó bảo trì**

Không đánh giá hời hợt theo kiểu “trông ổn”.
Phải luôn kiểm tra cả:

- Happy case
- Edge case
- Negative case
- Concurrent case
- Permission case
- Data consistency case

---

## Yêu cầu về chất lượng câu trả lời

- Không trả lời chung chung
- Không bỏ sót admin side hoặc user side
- Không chỉ liệt kê lỗi kỹ thuật mà bỏ qua nghiệp vụ
- Không chỉ nhìn giao diện mà bỏ qua BE/DB
- Không chỉ review code mà bỏ qua luồng thực tế
- Không chỉ nêu lỗi mà phải nêu mức độ ảnh hưởng và hướng sửa
- Cần chỉ ra đâu là lỗi thật sự nghiêm trọng, đâu là lỗi tối ưu thêm
- Nếu một phần chưa đủ dữ liệu để kết luận, hãy nói rõ lý do và phần nào cần bổ sung để audit chính xác hơn

---

## Câu lệnh cuối

Hãy bắt đầu bằng cách:

1. Tóm tắt lại kiến trúc và phạm vi hệ thống từ dữ liệu tôi cung cấp
2. Liệt kê danh sách module và role
3. Xây dựng checklist audit đầy đủ
4. Thực hiện audit sâu theo từng tầng, từng module, từng role, từng luồng
5. Xuất ra báo cáo hoàn chỉnh theo đúng format yêu cầu ở trên

---

## Bản prompt ngắn gọn hơn để dùng nhanh

Bạn là một chuyên gia audit hệ thống doanh nghiệp gồm FE, BE, DB, nghiệp vụ, UI/UX, bảo mật, hiệu năng và phân quyền.
Hãy audit toàn diện hệ thống bán mỹ phẩm của tôi gồm 2 giao diện bán hàng cho khách online và 1 giao diện admin/backoffice, trong đó có tài khoản admin quản lý toàn hệ thống và nhiều tài khoản nhân viên theo role với quyền khác nhau.

Mục tiêu là kiểm tra xem hệ thống đã hoàn chỉnh chưa, có lỗi nào không, có lỗi nghiêm trọng không, có sai logic nghiệp vụ không, có chức năng nào không hoạt động hoặc hoạt động sai không, có rủi ro dễ phát sinh lỗi trong tương lai không.
Phải kiểm tra đầy đủ từ giao diện user đến giao diện admin, từ UI/UX đến backend, database, phân quyền, business flow, module, hiệu năng, bảo mật, tính ổn định và khả năng mở rộng.

Hãy kiểm tra theo các nhóm:

- Frontend/UI/UX
- Backend/API/business logic
- Database/schema/query/data consistency
- Role/permission
- Security
- Performance
- End-to-end flows
- Từng module nghiệp vụ bán mỹ phẩm

Các module cần rà soát gồm: auth, user profile, sản phẩm, category, brand, SKU/biến thể, giá, khuyến mãi, voucher, giỏ hàng, checkout, thanh toán, đơn hàng, tồn kho, vận chuyển, hoàn/huỷ đơn, khách hàng, nhân viên, phân quyền, báo cáo, dashboard, thông báo và các module liên quan khác.

Với mỗi lỗi hoặc vấn đề, hãy nêu rõ:

- mô tả
- khu vực bị ảnh hưởng
- cách tái hiện
- mức độ nghiêm trọng
- mức độ ưu tiên
- ảnh hưởng nghiệp vụ
- nguyên nhân gốc có thể có
- hướng khắc phục

Hãy trả báo cáo theo dạng:

1. Executive summary
2. Danh sách module và mức độ hoàn thiện
3. Danh sách lỗi chi tiết
4. Danh sách sai logic nghiệp vụ
5. Rủi ro tiềm ẩn
6. Đánh giá theo từng tầng
7. Đánh giá theo từng role
8. Kiểm tra end-to-end flow
9. Danh sách ưu tiên xử lý P0/P1/P2/P3
10. Kết luận hệ thống đã sẵn sàng vận hành chưa

Yêu cầu audit phải sâu, thực tế, không chung chung, phải kiểm tra cả happy case, edge case, negative case, concurrent case và permission case.

---

Tôi có thể giúp bạn viết thêm một phiên bản **siêu tối ưu cho Cursor / Claude / GPT Agent / Manus / Devin** theo đúng kiểu mà các agent đó đọc vào là làm việc tốt hơn.
