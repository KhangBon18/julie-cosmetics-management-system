USE julie_cosmetics;

-- 1. Bổ sung status cho import_receipts
ALTER TABLE import_receipts ADD COLUMN status ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed' AFTER total_amount;

-- 2. Trigger hoàn kho và điểm CRM khi Invoice bị Cancel/Refund thay vì Xóa
DELIMITER $$
CREATE TRIGGER trg_invoice_after_update
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
  -- Nếu trạng thái vừa đổi sang 'cancelled' hoặc 'refunded' (mà trước đó chưa phải)
  IF (NEW.status = 'cancelled' OR NEW.status = 'refunded') AND (OLD.status != 'cancelled' AND OLD.status != 'refunded') THEN
    
    -- a. Hoàn lại tồn kho cho các sản phẩm trong hóa đơn này
    UPDATE products p
    JOIN invoice_items ii ON p.product_id = ii.product_id
    SET p.stock_quantity = p.stock_quantity + ii.quantity
    WHERE ii.invoice_id = NEW.invoice_id;

    -- b. Hoàn lại điểm CRM và tổng chi tiêu cho KH
    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET total_points = GREATEST(0, total_points - OLD.points_earned),
          total_spent  = GREATEST(0, total_spent - OLD.final_total),
          membership_tier = CASE
            WHEN GREATEST(0, total_points - OLD.points_earned) >= 500 THEN 'gold'
            WHEN GREATEST(0, total_points - OLD.points_earned) >= 100 THEN 'silver'
            ELSE 'standard'
          END
      WHERE customer_id = NEW.customer_id;
    END IF;

  END IF;
  
  -- Xử lý case ngược lại: Khôi phục từ Cancel về Paid (dự phòng)
  IF (OLD.status = 'cancelled' OR OLD.status = 'refunded') AND (NEW.status = 'paid' OR NEW.status = 'completed') THEN
    UPDATE products p
    JOIN invoice_items ii ON p.product_id = ii.product_id
    SET p.stock_quantity = p.stock_quantity - ii.quantity
    WHERE ii.invoice_id = NEW.invoice_id;

    IF NEW.customer_id IS NOT NULL THEN
      UPDATE customers
      SET total_points = total_points + NEW.points_earned,
          total_spent  = total_spent + NEW.final_total,
          membership_tier = CASE
            WHEN (total_points + NEW.points_earned) >= 500 THEN 'gold'
            WHEN (total_points + NEW.points_earned) >= 100 THEN 'silver'
            ELSE 'standard'
          END
      WHERE customer_id = NEW.customer_id;
    END IF;
  END IF;
END$$

-- 3. Trigger hoàn kho khi Import bị Cancel
CREATE TRIGGER trg_import_after_update
AFTER UPDATE ON import_receipts
FOR EACH ROW
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status = 'completed' THEN
    UPDATE products p
    JOIN import_receipt_items iri ON p.product_id = iri.product_id
    SET p.stock_quantity = p.stock_quantity - iri.quantity
    WHERE iri.receipt_id = NEW.receipt_id;
  END IF;
  
  IF OLD.status = 'cancelled' AND NEW.status = 'completed' THEN
    UPDATE products p
    JOIN import_receipt_items iri ON p.product_id = iri.product_id
    SET p.stock_quantity = p.stock_quantity + iri.quantity
    WHERE iri.receipt_id = NEW.receipt_id;
  END IF;
END$$

DELIMITER ;
