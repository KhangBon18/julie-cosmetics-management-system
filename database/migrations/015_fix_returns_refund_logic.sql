USE julie_cosmetics;

ALTER TABLE return_items
  ADD COLUMN refund_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER unit_price;

DROP TRIGGER IF EXISTS trg_invoice_after_update;

DELIMITER $$
CREATE TRIGGER trg_invoice_after_update
AFTER UPDATE ON invoices
FOR EACH ROW
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE products p
    JOIN invoice_items ii ON p.product_id = ii.product_id
    SET p.stock_quantity = p.stock_quantity + ii.quantity
    WHERE ii.invoice_id = NEW.invoice_id;

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

  IF OLD.status = 'cancelled' AND (NEW.status = 'paid' OR NEW.status = 'completed') THEN
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
DELIMITER ;
