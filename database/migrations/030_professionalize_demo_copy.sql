USE julie_cosmetics;
SET NAMES utf8mb4;

UPDATE positions
SET position_name = 'Quản lý cửa hàng',
    description = 'Điều hành hoạt động cửa hàng, phê duyệt đơn từ nội bộ và theo dõi báo cáo quản trị.'
WHERE position_id = 1;

UPDATE positions
SET description = 'Tư vấn sản phẩm, hỗ trợ bán hàng trực tiếp và lập hóa đơn cho khách hàng.'
WHERE position_id = 2;

UPDATE positions
SET description = 'Quản lý nhập - xuất - tồn kho, lập phiếu nhập và kiểm soát số liệu hàng hóa.'
WHERE position_id = 3;

UPDATE positions
SET description = 'Theo dõi tài chính, đối soát chứng từ và kiểm tra báo cáo doanh thu.'
WHERE position_id = 4;

UPDATE employee_positions
SET note = 'Đảm nhiệm vai trò quản lý cửa hàng kể từ ngày thành lập.'
WHERE id = 1;

UPDATE employee_positions
SET note = 'Tiếp nhận ở vị trí nhân viên bán hàng trong giai đoạn thử việc.'
WHERE id = 2;

UPDATE employee_positions
SET note = 'Điều chỉnh mức lương sau khi hoàn thành thử việc và ký hợp đồng chính thức.'
WHERE id = 3;

UPDATE employee_positions
SET note = 'Phụ trách công tác bán hàng tại cửa hàng.'
WHERE id IN (4, 6);

UPDATE employee_positions
SET note = 'Phụ trách quản lý kho và điều phối nhập - xuất hàng hóa.'
WHERE id = 5;

UPDATE employee_positions
SET note = 'Kết thúc hợp đồng lao động vào cuối năm 2023.'
WHERE id = 7;

UPDATE employee_positions
SET note = 'Điều chuyển sang vị trí kế toán theo kế hoạch điều phối nhân sự.'
WHERE id = 8;

UPDATE employee_positions
SET note = 'Điều chỉnh chức vụ trong quá trình rà soát nhân sự nội bộ.'
WHERE id = 10;

UPDATE suppliers
SET contact_person = 'Nguyễn Hoàng Anh'
WHERE supplier_id = 1;

UPDATE suppliers
SET contact_person = 'Trần Mỹ Linh'
WHERE supplier_id = 2;

UPDATE suppliers
SET contact_person = 'Lê Quang Minh'
WHERE supplier_id = 3;

UPDATE import_receipts
SET note = 'Nhập hàng định kỳ từ nhà cung cấp Hàn Quốc - kỳ tháng 3/2026.'
WHERE receipt_id = 1;

UPDATE import_receipts
SET note = 'Nhập hàng định kỳ từ nhà cung cấp Châu Âu - kỳ tháng 3/2026.'
WHERE receipt_id = 2;

UPDATE import_receipts
SET note = 'Nhập bổ sung nhóm hàng trang điểm - kỳ tháng 3/2026.'
WHERE receipt_id = 3;

UPDATE leave_requests
SET reason = 'Nghỉ phép năm theo kế hoạch đã đăng ký từ đầu năm.'
WHERE request_id = 1;

UPDATE leave_requests
SET reason = 'Nghỉ ốm để theo dõi sức khỏe, có xác nhận khám bệnh.'
WHERE request_id = 2;

UPDATE leave_requests
SET reason = 'Nghỉ phép để giải quyết việc gia đình theo kế hoạch đã sắp xếp trước.'
WHERE request_id = 3;

UPDATE leave_requests
SET reason = 'Xin nghỉ không lương do phát sinh việc gia đình cần trực tiếp xử lý.'
WHERE request_id = 4;

UPDATE leave_requests
SET reason = 'Xin nghỉ ốm để theo dõi sức khỏe.',
    reject_reason = 'Hồ sơ chưa đủ căn cứ để phê duyệt.'
WHERE request_id = 5;

UPDATE leave_requests
SET reason = 'Xin nghỉ ốm 1 ngày để theo dõi sức khỏe.'
WHERE request_id = 6;

UPDATE leave_requests
SET reason = 'Đề nghị nghỉ việc để chuyển hướng công việc cá nhân.'
WHERE request_id = 7;

UPDATE salaries
SET notes = 'Thưởng doanh số theo kết quả bán hàng tháng 2.'
WHERE salary_id = 1;

UPDATE salaries
SET notes = 'Phát sinh 1 ngày nghỉ phép năm trong tháng.'
WHERE salary_id = 3;

UPDATE salaries
SET notes = 'Phát sinh 2 ngày nghỉ trong tháng, gồm 1 ngày phép năm và 1 ngày nghỉ không lương.'
WHERE salary_id = 5;

UPDATE salaries
SET notes = 'Lương tháng được phân bổ theo 2 giai đoạn chức vụ: 2026-04-01 đến 2026-04-10 - Nhân viên Bán hàng (8.000.000đ); 2026-04-11 đến 2026-04-30 - Kế toán (9.000.000đ).'
WHERE salary_id = 8;

UPDATE notifications
SET title = 'Đơn nghỉ ốm chưa được phê duyệt',
    message = 'Đơn nghỉ ốm của bạn cho ngày 14/4/2026 chưa được phê duyệt. Lý do: Hồ sơ chưa đủ căn cứ để phê duyệt.'
WHERE notification_id = 1;

UPDATE notifications
SET title = 'Đơn nghỉ ốm đã được phê duyệt',
    message = 'Đơn nghỉ ốm của bạn từ 13/4/2026 đến 15/4/2026 đã được phê duyệt.'
WHERE notification_id = 2;

UPDATE reviews
SET comment = 'Khả năng dưỡng ẩm tốt, da cải thiện rõ sau khoảng một tuần sử dụng.'
WHERE review_id = 1;

UPDATE reviews
SET comment = 'Sản phẩm cho hiệu quả tích cực sau khoảng hai tuần sử dụng.'
WHERE review_id = 2;

UPDATE reviews
SET comment = 'Toner dịu nhẹ, mùi trà xanh dễ chịu và phù hợp dùng hằng ngày.'
WHERE review_id = 3;

UPDATE reviews
SET comment = 'Mặt nạ ngủ cấp ẩm tốt, sáng hôm sau da mềm và căng hơn.'
WHERE review_id = 4;

UPDATE reviews
SET comment = 'Màu son đẹp, độ bám ổn và phù hợp dùng hằng ngày.'
WHERE review_id = 5;

UPDATE reviews
SET comment = 'Hiệu quả làm dài mi khá tốt, tuy nhiên cần tẩy trang kỹ.'
WHERE review_id = 6;
