USE julie_cosmetics;

DROP TRIGGER IF EXISTS trg_import_item_insert;

DELIMITER $$
CREATE TRIGGER trg_import_item_insert
AFTER INSERT ON import_receipt_items
FOR EACH ROW
BEGIN
  UPDATE products
  SET import_price = IF(
        stock_quantity + NEW.quantity > 0,
        (import_price * stock_quantity + NEW.unit_price * NEW.quantity) / (stock_quantity + NEW.quantity),
        import_price
      ),
      stock_quantity = stock_quantity + NEW.quantity
  WHERE product_id = NEW.product_id;
END$$
DELIMITER ;
