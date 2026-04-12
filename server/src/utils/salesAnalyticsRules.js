const REALIZED_INVOICE_STATUSES = ['paid', 'completed'];
const SALES_ANALYTICS_INVOICE_STATUSES = ['paid', 'completed', 'refunded'];
const EXCLUDED_INVOICE_STATUSES = ['cancelled', 'refunded'];
const COMPLETED_IMPORT_RECEIPT_STATUS = 'completed';
const COMPLETED_RETURN_STATUS = 'completed';
const REFUND_RETURN_TYPE = 'refund';
const EXCHANGE_RETURN_TYPE = 'exchange';
const CANCELLED_INVOICE_STATUS = 'cancelled';
const REFUNDED_INVOICE_STATUS = 'refunded';

const SALES_SCOPE_RULE =
  'Doanh thu ròng = tổng final_total của các hóa đơn phát sinh bán (paid/completed/refunded) theo kỳ của hóa đơn gốc, sau đó trừ các yêu cầu hoàn tiền completed của chính hóa đơn đó. Hóa đơn cancelled bị loại hoàn toàn.';

const PROFIT_SCOPE_RULE =
  'Lợi nhuận ròng = doanh thu ròng - giá vốn ròng. Giá vốn ròng được tính từ giá vốn snapshot lúc bán, rồi trừ phần giá vốn của hàng đã return completed. Refund làm giảm doanh thu; exchange chỉ làm giảm giá vốn và số lượng ròng vì hàng đã nhập lại kho.';

const TOP_PRODUCTS_SCOPE_RULE =
  'Sản lượng ròng = số lượng bán - số lượng hàng đã return completed (refund/exchange) theo hóa đơn gốc. Doanh thu ròng của từng sản phẩm = giá trị dòng hàng sau phân bổ discount trừ completed refund; exchange không làm giảm doanh thu.';

const INVENTORY_SCOPE_RULE =
  'Báo cáo kho dùng phiếu nhập completed và số lượng xuất ròng. Xuất ròng = quantity sale - quantity return completed (refund/exchange). Giá trị xuất bán ròng chỉ trừ completed refund; exchange chỉ ảnh hưởng quantity.';

const FEATURED_SCOPE_RULE =
  'Bestseller storefront xếp hạng theo số lượng ròng: quantity sold trừ quantity completed returns (refund/exchange).';

const COMPLETED_RETURN_INVOICE_AGGREGATE_SQL = `
  SELECT
    invoice_id,
    SUM(CASE WHEN return_type = 'refund' THEN 1 ELSE 0 END) AS completed_refund_requests,
    COUNT(*) AS completed_return_requests,
    SUM(CASE WHEN return_type = 'refund' THEN total_refund ELSE 0 END) AS completed_refund_total
  FROM returns
  WHERE status = 'completed'
  GROUP BY invoice_id
`;

const COMPLETED_RETURN_ITEM_AGGREGATE_SQL = `
  SELECT
    r.invoice_id,
    ri.product_id,
    SUM(ri.quantity) AS returned_quantity,
    SUM(CASE WHEN r.return_type = 'refund' THEN ri.refund_subtotal ELSE 0 END) AS refund_amount
  FROM returns r
  JOIN return_items ri ON r.return_id = ri.return_id
  WHERE r.status = 'completed'
  GROUP BY r.invoice_id, ri.product_id
`;

const buildPlaceholders = (values) => values.map(() => '?').join(', ');

const buildLineNetRevenueSql = (invoiceAlias = 'i', itemAlias = 'ii') => `
  GREATEST(
    0,
    ROUND(
      ${itemAlias}.subtotal - CASE
        WHEN COALESCE(${invoiceAlias}.subtotal, 0) > 0
          THEN COALESCE(${invoiceAlias}.discount_amount, 0) * (${itemAlias}.subtotal / ${invoiceAlias}.subtotal)
        ELSE 0
      END,
      2
    )
  )
`;

const buildInvoiceRefundAmountSql = (invoiceAlias = 'i', invoiceReturnsAlias = 'invoice_returns') => `
  LEAST(
    ${invoiceAlias}.final_total,
    CASE
      WHEN ${invoiceAlias}.status = '${REFUNDED_INVOICE_STATUS}'
        THEN ${invoiceAlias}.final_total
      ELSE COALESCE(${invoiceReturnsAlias}.completed_refund_total, 0)
    END
  )
`;

const buildReturnedQuantitySql = ({
  invoiceAlias = 'i',
  itemAlias = 'ii',
  invoiceReturnsAlias = 'invoice_returns',
  itemReturnsAlias = 'item_returns'
} = {}) => `
  LEAST(
    ${itemAlias}.quantity,
    CASE
      WHEN ${invoiceAlias}.status = '${REFUNDED_INVOICE_STATUS}'
        THEN ${itemAlias}.quantity
      ELSE COALESCE(${itemReturnsAlias}.returned_quantity, 0)
    END
  )
`;

const buildRefundAmountSql = ({
  invoiceAlias = 'i',
  lineNetRevenueSql,
  invoiceReturnsAlias = 'invoice_returns',
  itemReturnsAlias = 'item_returns'
} = {}) => `
  LEAST(
    ${lineNetRevenueSql},
    CASE
      WHEN ${invoiceAlias}.status = '${REFUNDED_INVOICE_STATUS}'
        THEN ${lineNetRevenueSql}
      ELSE COALESCE(${itemReturnsAlias}.refund_amount, 0)
    END
  )
`;

const buildResolvedUnitCostSql = ({
  invoiceAlias = 'i',
  invoiceIdExpr = 'ii.invoice_id',
  productIdExpr = 'ii.product_id',
  productAlias = 'p'
} = {}) => `
  COALESCE(
    (
      SELECT im.unit_cost
      FROM inventory_movements im
      WHERE im.reference_type = 'invoice'
        AND im.reference_id = ${invoiceIdExpr}
        AND im.product_id = ${productIdExpr}
        AND im.movement_type = 'sale'
      ORDER BY im.created_at DESC, im.movement_id DESC
      LIMIT 1
    ),
    (
      SELECT iri.unit_price
      FROM import_receipt_items iri
      JOIN import_receipts ir ON iri.receipt_id = ir.receipt_id
      WHERE iri.product_id = ${productIdExpr}
        AND ir.status = '${COMPLETED_IMPORT_RECEIPT_STATUS}'
        AND ir.created_at <= ${invoiceAlias}.created_at
      ORDER BY ir.created_at DESC, iri.item_id DESC
      LIMIT 1
    ),
    ${productAlias}.import_price
  )
`;

module.exports = {
  REALIZED_INVOICE_STATUSES,
  SALES_ANALYTICS_INVOICE_STATUSES,
  EXCLUDED_INVOICE_STATUSES,
  COMPLETED_IMPORT_RECEIPT_STATUS,
  COMPLETED_RETURN_STATUS,
  REFUND_RETURN_TYPE,
  EXCHANGE_RETURN_TYPE,
  CANCELLED_INVOICE_STATUS,
  REFUNDED_INVOICE_STATUS,
  SALES_SCOPE_RULE,
  PROFIT_SCOPE_RULE,
  TOP_PRODUCTS_SCOPE_RULE,
  INVENTORY_SCOPE_RULE,
  FEATURED_SCOPE_RULE,
  COMPLETED_RETURN_INVOICE_AGGREGATE_SQL,
  COMPLETED_RETURN_ITEM_AGGREGATE_SQL,
  buildPlaceholders,
  buildLineNetRevenueSql,
  buildInvoiceRefundAmountSql,
  buildReturnedQuantitySql,
  buildRefundAmountSql,
  buildResolvedUnitCostSql
};
