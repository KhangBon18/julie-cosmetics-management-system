const { pool } = require('../config/db');
const { syncApprovedResignations } = require('../utils/employeeLifecycle');
const {
  REALIZED_INVOICE_STATUSES,
  SALES_ANALYTICS_INVOICE_STATUSES,
  COMPLETED_IMPORT_RECEIPT_STATUS,
  COMPLETED_RETURN_STATUS,
  REFUND_RETURN_TYPE,
  CANCELLED_INVOICE_STATUS,
  REFUNDED_INVOICE_STATUS,
  SALES_SCOPE_RULE,
  PROFIT_SCOPE_RULE,
  TOP_PRODUCTS_SCOPE_RULE,
  INVENTORY_SCOPE_RULE,
  COMPLETED_RETURN_INVOICE_AGGREGATE_SQL,
  COMPLETED_RETURN_ITEM_AGGREGATE_SQL,
  buildPlaceholders,
  buildLineNetRevenueSql,
  buildInvoiceRefundAmountSql,
  buildReturnedQuantitySql,
  buildRefundAmountSql,
  buildResolvedUnitCostSql
} = require('../utils/salesAnalyticsRules');

const toNumber = (value) => Number(value || 0);
const resolvePeriodConfig = (groupBy, anchorYear = new Date().getFullYear()) => {
  const year = Number(anchorYear) || new Date().getFullYear();

  if (groupBy === 'year') {
    return {
      groupBy: 'year',
      periodSelect: `YEAR(i.created_at) as period, YEAR(i.created_at) as label`,
      importPeriodSelect: `YEAR(created_at) as period, YEAR(created_at) as label`,
      periods: Array.from({ length: 5 }, (_, index) => year - 4 + index),
      title: 'năm',
      dataDateClause: 'YEAR(i.created_at) BETWEEN ? AND ?',
      dataDateParams: [year - 4, year],
      importDateClause: 'YEAR(created_at) BETWEEN ? AND ?',
      importDateParams: [year - 4, year]
    };
  }

  if (groupBy === 'quarter') {
    return {
      groupBy: 'quarter',
      periodSelect: `QUARTER(i.created_at) as period, CONCAT('Q', QUARTER(i.created_at)) as label`,
      importPeriodSelect: `QUARTER(created_at) as period, CONCAT('Q', QUARTER(created_at)) as label`,
      periods: [1, 2, 3, 4],
      title: 'quý',
      dataDateClause: 'YEAR(i.created_at) = ?',
      dataDateParams: [year],
      importDateClause: 'YEAR(created_at) = ?',
      importDateParams: [year]
    };
  }

  return {
    groupBy: 'month',
    periodSelect: `MONTH(i.created_at) as period, CONCAT('T', MONTH(i.created_at)) as label`,
    importPeriodSelect: `MONTH(created_at) as period, CONCAT('T', MONTH(created_at)) as label`,
    periods: Array.from({ length: 12 }, (_, index) => index + 1),
    title: 'tháng',
    dataDateClause: 'YEAR(i.created_at) = ?',
    dataDateParams: [year],
    importDateClause: 'YEAR(created_at) = ?',
    importDateParams: [year]
  };
};

const reportController = {
  // GET /api/reports/revenue — Doanh thu theo tháng/quý/năm
  getRevenue: async (req, res, next) => {
    try {
      const { year, group_by } = req.query; // group_by: month, quarter, year
      const y = year || new Date().getFullYear();
      const periodConfig = resolvePeriodConfig(group_by, y);
      const invoiceStatusPlaceholders = buildPlaceholders(SALES_ANALYTICS_INVOICE_STATUSES);
      const invoiceRefundSql = buildInvoiceRefundAmountSql({
        invoiceAlias: 'i',
        invoiceReturnsAlias: 'invoice_returns'
      });

      const query = `SELECT
                       ${periodConfig.periodSelect},
                       COUNT(*) as invoice_count,
                       SUM(i.final_total) as gross_revenue,
                       SUM(${invoiceRefundSql}) as refunded_revenue,
                       SUM(i.final_total - ${invoiceRefundSql}) as revenue,
                       SUM(i.discount_amount) as discount_total
                     FROM invoices i
                     LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
                       ON invoice_returns.invoice_id = i.invoice_id
                     WHERE ${periodConfig.dataDateClause} AND i.status IN (${invoiceStatusPlaceholders})
                     GROUP BY period, label
                     ORDER BY period`;

      const [rows] = await pool.query(query, [...periodConfig.dataDateParams, ...SALES_ANALYTICS_INVOICE_STATUSES]);
      const [totalRow] = await pool.query(
        `SELECT
           COUNT(*) as total_invoices,
           SUM(i.final_total) as gross_revenue,
           SUM(${invoiceRefundSql}) as refunded_revenue,
           SUM(i.final_total - ${invoiceRefundSql}) as total_revenue
         FROM invoices i
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         WHERE YEAR(i.created_at) = ? AND i.status IN (${invoiceStatusPlaceholders})`,
        [y, ...SALES_ANALYTICS_INVOICE_STATUSES]
      );

      const [metaRow] = await pool.query(
        `SELECT
            SUM(i.status = ?) as cancelled_invoices,
            SUM(i.status = ?) as fully_refunded_invoices,
            COALESCE((
              SELECT COUNT(*)
              FROM returns r
              JOIN invoices ir ON ir.invoice_id = r.invoice_id
              WHERE YEAR(ir.created_at) = ?
                AND r.status = ?
                AND r.return_type = ?
            ), 0) as completed_refund_requests,
            COALESCE((
              SELECT SUM(r.total_refund)
              FROM returns r
              JOIN invoices ir ON ir.invoice_id = r.invoice_id
              WHERE YEAR(ir.created_at) = ?
                AND r.status = ?
                AND r.return_type = ?
            ), 0) as completed_refund_value
         FROM invoices i
         WHERE YEAR(i.created_at) = ?`,
        [
          CANCELLED_INVOICE_STATUS,
          REFUNDED_INVOICE_STATUS,
          y,
          COMPLETED_RETURN_STATUS,
          REFUND_RETURN_TYPE,
          y,
          COMPLETED_RETURN_STATUS,
          REFUND_RETURN_TYPE,
          y
        ]
      );

      res.json({
        data: rows,
        summary: totalRow[0],
        year: y,
        group_by: periodConfig.groupBy,
        meta: {
          scope_rule: SALES_SCOPE_RULE,
          cancelled_invoices: toNumber(metaRow[0]?.cancelled_invoices),
          fully_refunded_invoices: toNumber(metaRow[0]?.fully_refunded_invoices),
          completed_refund_requests: toNumber(metaRow[0]?.completed_refund_requests),
          completed_refund_value: toNumber(metaRow[0]?.completed_refund_value)
        }
      });
    } catch (error) { next(error); }
  },

  // GET /api/reports/profit — Lợi nhuận = Doanh thu - Giá vốn hàng bán (COGS)
  getProfit: async (req, res, next) => {
    try {
      const { year, group_by } = req.query;
      const y = year || new Date().getFullYear();
      const periodConfig = resolvePeriodConfig(group_by, y);
      const invoiceStatusPlaceholders = buildPlaceholders(SALES_ANALYTICS_INVOICE_STATUSES);
      const invoiceRefundSql = buildInvoiceRefundAmountSql({
        invoiceAlias: 'i',
        invoiceReturnsAlias: 'invoice_returns'
      });
      const lineNetRevenueSql = buildLineNetRevenueSql('i', 'ii');
      const refundAmountSql = buildRefundAmountSql({
        invoiceAlias: 'i',
        lineNetRevenueSql,
        invoiceReturnsAlias: 'invoice_returns',
        itemReturnsAlias: 'item_returns'
      });
      const returnedQuantitySql = buildReturnedQuantitySql({
        invoiceAlias: 'i',
        itemAlias: 'ii',
        invoiceReturnsAlias: 'invoice_returns',
        itemReturnsAlias: 'item_returns'
      });
      const unitCostSql = buildResolvedUnitCostSql({
        invoiceAlias: 'i',
        invoiceIdExpr: 'ii.invoice_id',
        productIdExpr: 'ii.product_id',
        productAlias: 'p'
      });

      const [revenueRows] = await pool.query(
        `SELECT
           ${periodConfig.periodSelect},
           SUM(i.final_total) as gross_revenue,
           SUM(${invoiceRefundSql}) as refunded_revenue,
           SUM(i.final_total - ${invoiceRefundSql}) as revenue
         FROM invoices i
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         WHERE ${periodConfig.dataDateClause} AND i.status IN (${invoiceStatusPlaceholders})
         GROUP BY period, label
         ORDER BY period`,
        [...periodConfig.dataDateParams, ...SALES_ANALYTICS_INVOICE_STATUSES]
      );

      const [cogsRows] = await pool.query(
        `SELECT
            ${periodConfig.periodSelect},
            SUM(ii.quantity * ${unitCostSql}) as gross_cogs,
            SUM(${returnedQuantitySql} * ${unitCostSql}) as returned_cogs,
            SUM((ii.quantity - ${returnedQuantitySql}) * ${unitCostSql}) as cogs,
            SUM(CASE
              WHEN EXISTS (
                SELECT 1
                FROM inventory_movements im
                WHERE im.reference_type = 'invoice'
                  AND im.reference_id = ii.invoice_id
                  AND im.product_id = ii.product_id
                  AND im.movement_type = 'sale'
              ) THEN 1 ELSE 0 END) as movement_snapshot_items,
            SUM(CASE
              WHEN NOT EXISTS (
                SELECT 1
                FROM inventory_movements im
                WHERE im.reference_type = 'invoice'
                  AND im.reference_id = ii.invoice_id
                  AND im.product_id = ii.product_id
                  AND im.movement_type = 'sale'
              )
              AND EXISTS (
                SELECT 1
                FROM import_receipt_items iri
                JOIN import_receipts ir ON iri.receipt_id = ir.receipt_id
                WHERE iri.product_id = ii.product_id
                  AND ir.status = ?
                  AND ir.created_at <= i.created_at
              ) THEN 1 ELSE 0 END) as fallback_import_history_items,
            SUM(CASE
              WHEN NOT EXISTS (
                SELECT 1
                FROM inventory_movements im
                WHERE im.reference_type = 'invoice'
                  AND im.reference_id = ii.invoice_id
                  AND im.product_id = ii.product_id
                  AND im.movement_type = 'sale'
              )
              AND NOT EXISTS (
                SELECT 1
                FROM import_receipt_items iri
                JOIN import_receipts ir ON iri.receipt_id = ir.receipt_id
                WHERE iri.product_id = ii.product_id
                  AND ir.status = ?
                  AND ir.created_at <= i.created_at
              ) THEN 1 ELSE 0 END) as fallback_current_cost_items
         FROM invoice_items ii
         JOIN invoices i ON ii.invoice_id = i.invoice_id
         JOIN products p ON ii.product_id = p.product_id
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_ITEM_AGGREGATE_SQL}) item_returns
           ON item_returns.invoice_id = i.invoice_id
          AND item_returns.product_id = ii.product_id
         WHERE ${periodConfig.dataDateClause} AND i.status IN (${invoiceStatusPlaceholders})
         GROUP BY period, label
         ORDER BY period`,
        [
          COMPLETED_IMPORT_RECEIPT_STATUS,
          COMPLETED_IMPORT_RECEIPT_STATUS,
          ...periodConfig.dataDateParams,
          ...SALES_ANALYTICS_INVOICE_STATUSES
        ]
      );

      const data = [];
      let totalGrossRevenue = 0;
      let totalRefundedRevenue = 0;
      let totalRevenue = 0;
      let totalGrossCogs = 0;
      let totalReturnedCogs = 0;
      let totalCogs = 0;
      let movementSnapshotItems = 0;
      let fallbackImportHistoryItems = 0;
      let fallbackCurrentCostItems = 0;

      for (const period of periodConfig.periods) {
        const rev = revenueRows.find(r => Number(r.period) === period);
        const cgs = cogsRows.find(c => Number(c.period) === period);
        const grossRevenue = parseFloat(rev?.gross_revenue) || 0;
        const refundedRevenue = parseFloat(rev?.refunded_revenue) || 0;
        const revenue = parseFloat(rev?.revenue) || 0;
        const grossCogs = parseFloat(cgs?.gross_cogs) || 0;
        const returnedCogs = parseFloat(cgs?.returned_cogs) || 0;
        const cogs = parseFloat(cgs?.cogs) || 0;
        totalGrossRevenue += grossRevenue;
        totalRefundedRevenue += refundedRevenue;
        totalRevenue += revenue;
        totalGrossCogs += grossCogs;
        totalReturnedCogs += returnedCogs;
        totalCogs += cogs;
        movementSnapshotItems += parseInt(cgs?.movement_snapshot_items) || 0;
        fallbackImportHistoryItems += parseInt(cgs?.fallback_import_history_items) || 0;
        fallbackCurrentCostItems += parseInt(cgs?.fallback_current_cost_items) || 0;
        data.push({
          period,
          label: rev?.label || cgs?.label || (
            periodConfig.groupBy === 'quarter'
              ? `Q${period}`
              : periodConfig.groupBy === 'year'
                ? `${period}`
                : `T${period}`
          ),
          gross_revenue: grossRevenue,
          refunded_revenue: refundedRevenue,
          revenue,
          gross_cost: grossCogs,
          returned_cost: returnedCogs,
          cost: cogs,
          profit: revenue - cogs
        });
      }

      res.json({
        data,
        year: y,
        group_by: periodConfig.groupBy,
        summary: {
          gross_revenue: totalGrossRevenue,
          refunded_revenue: totalRefundedRevenue,
          total_revenue: totalRevenue,
          gross_cogs: totalGrossCogs,
          returned_cogs: totalReturnedCogs,
          total_cogs: totalCogs,
          total_profit: totalRevenue - totalCogs
        },
        meta: {
          cogs_rule: PROFIT_SCOPE_RULE,
          movement_snapshot_items: movementSnapshotItems,
          fallback_import_history_items: fallbackImportHistoryItems,
          fallback_current_cost_items: fallbackCurrentCostItems,
          refunded_revenue_total: totalRefundedRevenue,
          returned_cogs_total: totalReturnedCogs
        }
      });
    } catch (error) { next(error); }
  },

  // GET /api/reports/top-products — Sản phẩm bán chạy
  getTopProducts: async (req, res, next) => {
    try {
      const { year, limit } = req.query;
      const y = year || new Date().getFullYear();
      const lim = parseInt(limit) || 10;
      const invoiceStatusPlaceholders = buildPlaceholders(SALES_ANALYTICS_INVOICE_STATUSES);
      const lineNetRevenueSql = buildLineNetRevenueSql('i', 'ii');
      const refundAmountSql = buildRefundAmountSql({
        invoiceAlias: 'i',
        lineNetRevenueSql,
        invoiceReturnsAlias: 'invoice_returns',
        itemReturnsAlias: 'item_returns'
      });
      const returnedQuantitySql = buildReturnedQuantitySql({
        invoiceAlias: 'i',
        itemAlias: 'ii',
        invoiceReturnsAlias: 'invoice_returns',
        itemReturnsAlias: 'item_returns'
      });

      const [rows] = await pool.query(
        `SELECT
            p.product_id,
            p.product_name,
            p.sell_price,
            p.image_url,
            ROUND(SUM(GREATEST(0, ii.quantity - ${returnedQuantitySql})), 0) as total_sold,
            SUM(GREATEST(0, ${lineNetRevenueSql} - ${refundAmountSql})) as total_revenue,
            ROUND(SUM(${returnedQuantitySql}), 0) as returned_quantity,
            SUM(${refundAmountSql}) as refunded_revenue
         FROM invoice_items ii
         JOIN products p ON ii.product_id = p.product_id
         JOIN invoices i ON ii.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_ITEM_AGGREGATE_SQL}) item_returns
           ON item_returns.invoice_id = i.invoice_id
          AND item_returns.product_id = ii.product_id
         WHERE YEAR(i.created_at) = ? AND i.status IN (${invoiceStatusPlaceholders})
         GROUP BY p.product_id
         HAVING total_sold > 0 OR total_revenue > 0
         ORDER BY total_sold DESC, total_revenue DESC, p.product_name ASC
         LIMIT ?`,
        [y, ...SALES_ANALYTICS_INVOICE_STATUSES, lim]
      );

      res.json({
        data: rows,
        year: y,
        meta: {
          scope_rule: TOP_PRODUCTS_SCOPE_RULE
        }
      });
    } catch (error) { next(error); }
  },

  // GET /api/reports/inventory — Tồn kho & nhập/xuất
  getInventory: async (req, res, next) => {
    try {
      const { year, group_by } = req.query;
      const y = year || new Date().getFullYear();
      const periodConfig = resolvePeriodConfig(group_by, y);
      const invoiceStatusPlaceholders = buildPlaceholders(SALES_ANALYTICS_INVOICE_STATUSES);
      const lineNetRevenueSql = buildLineNetRevenueSql('i', 'ii');
      const refundAmountSql = buildRefundAmountSql({
        invoiceAlias: 'i',
        lineNetRevenueSql,
        invoiceReturnsAlias: 'invoice_returns',
        itemReturnsAlias: 'item_returns'
      });
      const returnedQuantitySql = buildReturnedQuantitySql({
        invoiceAlias: 'i',
        itemAlias: 'ii',
        invoiceReturnsAlias: 'invoice_returns',
        itemReturnsAlias: 'item_returns'
      });

      const [lowStock] = await pool.query(
        'SELECT product_id, product_name, stock_quantity, sell_price FROM products WHERE is_active = 1 AND stock_quantity <= 10 ORDER BY stock_quantity ASC LIMIT 20'
      );

      const [importStats] = await pool.query(
        `SELECT COUNT(*) as total_receipts, SUM(total_amount) as total_import_value
         FROM import_receipts
         WHERE YEAR(created_at) = ? AND status = ?`,
        [y, COMPLETED_IMPORT_RECEIPT_STATUS]
      );

      const [exportStats] = await pool.query(
        `SELECT
            SUM(ii.quantity) as gross_exported,
            SUM(${returnedQuantitySql}) as returned_quantity,
            SUM(GREATEST(0, ii.quantity - ${returnedQuantitySql})) as total_exported,
            SUM(${lineNetRevenueSql}) as gross_export_value,
            SUM(${refundAmountSql}) as refunded_export_value,
            SUM(GREATEST(0, ${lineNetRevenueSql} - ${refundAmountSql})) as total_export_value
         FROM invoice_items ii
         JOIN invoices i ON ii.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_ITEM_AGGREGATE_SQL}) item_returns
           ON item_returns.invoice_id = i.invoice_id
          AND item_returns.product_id = ii.product_id
         WHERE YEAR(i.created_at) = ? AND i.status IN (${invoiceStatusPlaceholders})`,
        [y, ...SALES_ANALYTICS_INVOICE_STATUSES]
      );

      const [importPeriodic] = await pool.query(
        `SELECT ${periodConfig.importPeriodSelect}, SUM(total_amount) as total
         FROM import_receipts
         WHERE ${periodConfig.importDateClause} AND status = ?
         GROUP BY period, label
         ORDER BY period`,
        [...periodConfig.importDateParams, COMPLETED_IMPORT_RECEIPT_STATUS]
      );

      const [exportPeriodic] = await pool.query(
        `SELECT
            ${periodConfig.periodSelect},
            SUM(ii.quantity) as gross_exported,
            SUM(${returnedQuantitySql}) as returned_quantity,
            SUM(GREATEST(0, ii.quantity - ${returnedQuantitySql})) as total_exported,
            SUM(${lineNetRevenueSql}) as gross_export_value,
            SUM(${refundAmountSql}) as refunded_export_value,
            SUM(GREATEST(0, ${lineNetRevenueSql} - ${refundAmountSql})) as total_export_value
         FROM invoice_items ii
         JOIN invoices i ON ii.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         LEFT JOIN (${COMPLETED_RETURN_ITEM_AGGREGATE_SQL}) item_returns
           ON item_returns.invoice_id = i.invoice_id
          AND item_returns.product_id = ii.product_id
         WHERE ${periodConfig.dataDateClause} AND i.status IN (${invoiceStatusPlaceholders})
         GROUP BY period, label
         ORDER BY period`,
        [...periodConfig.dataDateParams, ...SALES_ANALYTICS_INVOICE_STATUSES]
      );

      const [metaRows] = await pool.query(
        `SELECT
            (SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = ? AND status = ?) as cancelled_invoices,
            (SELECT COUNT(*) FROM invoices WHERE YEAR(created_at) = ? AND status = ?) as fully_refunded_invoices,
            (SELECT COUNT(*) FROM returns r
              JOIN invoices i ON i.invoice_id = r.invoice_id
              WHERE YEAR(i.created_at) = ?
                AND r.status = ?) as completed_return_requests,
            (SELECT COALESCE(SUM(ri.quantity), 0) FROM returns r
              JOIN invoices i ON i.invoice_id = r.invoice_id
              JOIN return_items ri ON ri.return_id = r.return_id
              WHERE YEAR(i.created_at) = ?
                AND r.status = ?) as completed_return_quantity,
            (SELECT COUNT(*) FROM import_receipts WHERE YEAR(created_at) = ? AND status = 'cancelled') as cancelled_import_receipts`,
        [
          y,
          CANCELLED_INVOICE_STATUS,
          y,
          REFUNDED_INVOICE_STATUS,
          y,
          COMPLETED_RETURN_STATUS,
          y,
          COMPLETED_RETURN_STATUS,
          y
        ]
      );

      res.json({
        low_stock: lowStock,
        import_summary: importStats[0],
        export_summary: exportStats[0],
        import_periodic: importPeriodic,
        export_periodic: exportPeriodic,
        year: y,
        group_by: periodConfig.groupBy,
        meta: {
          scope_rule: INVENTORY_SCOPE_RULE,
          cancelled_invoices: toNumber(metaRows[0]?.cancelled_invoices),
          fully_refunded_invoices: toNumber(metaRows[0]?.fully_refunded_invoices),
          completed_return_requests: toNumber(metaRows[0]?.completed_return_requests),
          completed_return_quantity: toNumber(metaRows[0]?.completed_return_quantity),
          cancelled_import_receipts: toNumber(metaRows[0]?.cancelled_import_receipts)
        }
      });
    } catch (error) { next(error); }
  },

  // GET /api/reports/hr — Thống kê nhân sự
  getHRStats: async (req, res, next) => {
    try {
      await syncApprovedResignations();
      const { year } = req.query;
      const y = year || new Date().getFullYear();

      // Tổng NV
      const [empCount] = await pool.query(
        "SELECT COUNT(*) as total, SUM(status='active') as active, SUM(status='inactive') as inactive FROM employees"
      );

      // Lương theo tháng
      const [salaryMonthly] = await pool.query(
        `SELECT month, SUM(net_salary) as total_salary, SUM(bonus) as total_bonus, COUNT(*) as employee_count
         FROM salaries WHERE year = ? GROUP BY month ORDER BY month`, [y]
      );

      // Thống kê nghỉ phép
      const [leaveStats] = await pool.query(
        `SELECT leave_type, status, COUNT(*) as count
         FROM leave_requests WHERE YEAR(created_at) = ?
         GROUP BY leave_type, status`, [y]
      );

      res.json({
        employees: empCount[0],
        salary_monthly: salaryMonthly,
        leave_stats: leaveStats,
        year: y
      });
    } catch (error) { next(error); }
  },

  // ═══ CSV EXPORTS ═══

  // GET /api/reports/export-invoices
  exportInvoices: async (req, res, next) => {
    try {
      const { year, scope } = req.query;
      const y = year || new Date().getFullYear();
      const realizedOnly = scope === 'realized';
      const invoiceStatusPlaceholders = buildPlaceholders(SALES_ANALYTICS_INVOICE_STATUSES);
      const invoiceRefundSql = buildInvoiceRefundAmountSql({
        invoiceAlias: 'i',
        invoiceReturnsAlias: 'invoice_returns'
      });
      const whereClause = realizedOnly
        ? `WHERE YEAR(i.created_at) = ? AND i.status IN (${invoiceStatusPlaceholders})`
        : 'WHERE YEAR(i.created_at) = ?';
      const params = realizedOnly ? [y, ...SALES_ANALYTICS_INVOICE_STATUSES] : [y];

      const [rows] = await pool.query(
        `SELECT i.invoice_id, c.full_name as customer_name, c.phone as customer_phone,
                i.subtotal, i.discount_percent, i.discount_amount, i.final_total,
                ${invoiceRefundSql} as refunded_amount,
                (i.final_total - ${invoiceRefundSql}) as net_revenue,
                i.points_earned, i.payment_method, i.status, i.created_at
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         LEFT JOIN (${COMPLETED_RETURN_INVOICE_AGGREGATE_SQL}) invoice_returns
           ON invoice_returns.invoice_id = i.invoice_id
         ${whereClause}
         ORDER BY i.created_at DESC`,
        params
      );

      const statusLabels = {
        paid: 'Đã thanh toán',
        completed: 'Hoàn tất',
        cancelled: 'Đã hủy',
        refunded: 'Đã hoàn tiền'
      };
      const headers = ['Mã HĐ', 'Khách hàng', 'SĐT', 'Tổng tiền hàng', 'Giảm (%)', 'Giảm (đ)', 'Thành tiền', 'Refund completed (đ)', 'Doanh thu ròng (đ)', 'Điểm', 'Thanh toán', 'Trạng thái', 'Ngày tạo'];
      const csvRows = rows.map(r => [
        r.invoice_id, r.customer_name || 'Khách vãng lai', r.customer_phone || '',
        r.subtotal, r.discount_percent, r.discount_amount, r.final_total,
        r.refunded_amount, r.net_revenue, r.points_earned, r.payment_method, statusLabels[r.status] || r.status, new Date(r.created_at).toLocaleString('vi-VN')
      ]);

      const csv = '\uFEFF' + [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${realizedOnly ? `hoa-don-so-lieu-rong-${y}` : `hoa-don-${y}`}.csv`);
      res.send(csv);
    } catch (error) { next(error); }
  },

  // GET /api/reports/export-products
  exportProducts: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT p.product_id, p.product_name, b.brand_name, c.category_name,
                p.import_price, p.sell_price, p.stock_quantity, p.volume, p.skin_type,
                CASE WHEN p.is_active THEN 'Đang bán' ELSE 'Ngừng bán' END as status
         FROM products p
         LEFT JOIN brands b ON p.brand_id = b.brand_id
         LEFT JOIN categories c ON p.category_id = c.category_id
         ORDER BY p.product_id`
      );

      const headers = ['Mã SP', 'Tên sản phẩm', 'Thương hiệu', 'Danh mục', 'Giá nhập', 'Giá bán', 'Tồn kho', 'Dung tích', 'Loại da', 'Trạng thái'];
      const csvRows = rows.map(r => [
        r.product_id, r.product_name, r.brand_name || '', r.category_name || '',
        r.import_price, r.sell_price, r.stock_quantity, r.volume || '', r.skin_type || '', r.status
      ]);

      const csv = '\uFEFF' + [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=san-pham.csv');
      res.send(csv);
    } catch (error) { next(error); }
  },

  // GET /api/reports/export-customers
  exportCustomers: async (req, res, next) => {
    try {
      const invoiceStatusPlaceholders = buildPlaceholders(REALIZED_INVOICE_STATUSES);
      const [rows] = await pool.query(
        `SELECT c.customer_id, c.full_name, c.phone, c.email, c.address, c.gender,
                c.date_of_birth, c.membership_tier, c.total_points, c.total_spent,
                COUNT(CASE WHEN i.status IN (${invoiceStatusPlaceholders}) THEN i.invoice_id END) as order_count, c.created_at
         FROM customers c
         LEFT JOIN invoices i ON c.customer_id = i.customer_id
         GROUP BY c.customer_id ORDER BY c.customer_id`,
        [...REALIZED_INVOICE_STATUSES]
      );

      const tierVN = { standard: 'Thường', silver: 'Bạc', gold: 'Vàng' };
      const headers = ['Mã KH', 'Họ tên', 'SĐT', 'Email', 'Địa chỉ', 'Giới tính', 'Ngày sinh', 'Hạng', 'Điểm', 'Tổng chi', 'Số đơn', 'Ngày tạo'];
      const csvRows = rows.map(r => [
        r.customer_id, r.full_name, r.phone, r.email || '', r.address || '', r.gender || '',
        r.date_of_birth || '', tierVN[r.membership_tier] || r.membership_tier,
        r.total_points, r.total_spent, r.order_count,
        new Date(r.created_at).toLocaleDateString('vi-VN')
      ]);

      const csv = '\uFEFF' + [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=khach-hang.csv');
      res.send(csv);
    } catch (error) { next(error); }
  }
};

module.exports = reportController;
