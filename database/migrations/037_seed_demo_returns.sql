-- Seed demo returns for audit/smoke verification

INSERT INTO returns (
  invoice_id,
  customer_id,
  return_type,
  status,
  reason,
  total_refund,
  note,
  created_at,
  updated_at
)
SELECT
  i.invoice_id,
  i.customer_id,
  'refund',
  'requested',
  'Sản phẩm bị lỗi — demo return',
  LEAST(ii.unit_price, i.final_total),
  '[DEMO] Seeded return fixture',
  NOW(),
  NOW()
FROM invoices i
JOIN invoice_items ii ON ii.item_id = (
  SELECT ii2.item_id
  FROM invoice_items ii2
  WHERE ii2.invoice_id = i.invoice_id
  ORDER BY ii2.item_id ASC
  LIMIT 1
)
WHERE i.status IN ('paid', 'completed')
  AND NOT EXISTS (
    SELECT 1
    FROM returns r
    WHERE r.invoice_id = i.invoice_id
  )
ORDER BY i.invoice_id DESC
LIMIT 2;

INSERT INTO return_items (
  return_id,
  product_id,
  quantity,
  unit_price,
  refund_subtotal,
  reason
)
SELECT
  r.return_id,
  ii.product_id,
  1,
  ii.unit_price,
  LEAST(ii.unit_price, i.final_total),
  'Lỗi sản phẩm — demo'
FROM returns r
JOIN invoices i ON i.invoice_id = r.invoice_id
JOIN invoice_items ii ON ii.item_id = (
  SELECT ii2.item_id
  FROM invoice_items ii2
  WHERE ii2.invoice_id = r.invoice_id
  ORDER BY ii2.item_id ASC
  LIMIT 1
)
WHERE r.note = '[DEMO] Seeded return fixture'
  AND NOT EXISTS (
    SELECT 1
    FROM return_items ri
    WHERE ri.return_id = r.return_id
  );
