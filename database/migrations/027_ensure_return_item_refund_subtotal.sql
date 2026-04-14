-- Migration 027: Ensure return_items has refund_subtotal for refund analytics

SET @has_refund_subtotal := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'return_items'
    AND COLUMN_NAME = 'refund_subtotal'
);

SET @refund_subtotal_sql := IF(
  @has_refund_subtotal = 0,
  'ALTER TABLE return_items ADD COLUMN refund_subtotal DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER unit_price',
  'SELECT ''refund_subtotal already exists'''
);

PREPARE stmt FROM @refund_subtotal_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
