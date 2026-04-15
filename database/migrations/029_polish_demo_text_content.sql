USE julie_cosmetics;
SET NAMES utf8mb4;

UPDATE leave_requests
SET reason = 'Muốn đổi công việc khác'
WHERE request_id = 7;

UPDATE leave_requests
SET reject_reason = 'Lý do không chính đáng'
WHERE request_id = 5;

UPDATE notifications
SET title = 'Đơn nghỉ ốm bị từ chối'
WHERE notification_id = 1;

UPDATE notifications
SET title = 'Đơn nghỉ ốm đã được duyệt'
WHERE notification_id = 2;

UPDATE notifications
SET message = REPLACE(message, 'Lí do', 'Lý do')
WHERE notification_id = 1;

UPDATE salaries
SET notes = 'Lương được prorate theo 2 giai đoạn chức vụ: 2026-04-01→2026-04-10 Nhân viên Bán hàng (8.000.000đ) | 2026-04-11→2026-04-30 Kế toán (9.000.000đ)'
WHERE salary_id = 8;
