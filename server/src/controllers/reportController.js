const { pool } = require('../config/db');

const reportController = {
  // GET /api/reports/revenue — Doanh thu theo tháng/quý/năm
  getRevenue: async (req, res, next) => {
    try {
      const { year, group_by } = req.query; // group_by: month, quarter, year
      const y = year || new Date().getFullYear();

      let query, params;
      if (group_by === 'quarter') {
        query = `SELECT QUARTER(created_at) as period, CONCAT('Q', QUARTER(created_at)) as label,
                 COUNT(*) as invoice_count, SUM(final_total) as revenue, SUM(subtotal - final_total) as discount_total
                 FROM invoices WHERE YEAR(created_at) = ? GROUP BY period, label ORDER BY period`;
        params = [y];
      } else {
        query = `SELECT MONTH(created_at) as period, CONCAT('T', MONTH(created_at)) as label,
                 COUNT(*) as invoice_count, SUM(final_total) as revenue, SUM(subtotal - final_total) as discount_total
                 FROM invoices WHERE YEAR(created_at) = ? GROUP BY period, label ORDER BY period`;
        params = [y];
      }

      const [rows] = await pool.query(query, params);
      const [totalRow] = await pool.query(
        'SELECT COUNT(*) as total_invoices, SUM(final_total) as total_revenue FROM invoices WHERE YEAR(created_at) = ?', [y]
      );

      res.json({ data: rows, summary: totalRow[0], year: y });
    } catch (error) { next(error); }
  },

  // GET /api/reports/profit — Lợi nhuận = doanh thu - chi phí nhập
  getProfit: async (req, res, next) => {
    try {
      const { year } = req.query;
      const y = year || new Date().getFullYear();

      // Doanh thu theo tháng
      const [revenueRows] = await pool.query(
        `SELECT MONTH(created_at) as month, SUM(final_total) as revenue
         FROM invoices WHERE YEAR(created_at) = ? GROUP BY MONTH(created_at)`, [y]
      );

      // Chi phí nhập theo tháng
      const [costRows] = await pool.query(
        `SELECT MONTH(created_at) as month, SUM(total_amount) as cost
         FROM import_receipts WHERE YEAR(created_at) = ? GROUP BY MONTH(created_at)`, [y]
      );

      // Merge
      const data = [];
      for (let m = 1; m <= 12; m++) {
        const rev = revenueRows.find(r => r.month === m);
        const cost = costRows.find(c => c.month === m);
        const revenue = parseFloat(rev?.revenue) || 0;
        const importCost = parseFloat(cost?.cost) || 0;
        data.push({
          month: m,
          label: `T${m}`,
          revenue,
          cost: importCost,
          profit: revenue - importCost
        });
      }

      res.json({ data, year: y });
    } catch (error) { next(error); }
  },

  // GET /api/reports/top-products — Sản phẩm bán chạy
  getTopProducts: async (req, res, next) => {
    try {
      const { year, limit } = req.query;
      const y = year || new Date().getFullYear();
      const lim = parseInt(limit) || 10;

      const [rows] = await pool.query(
        `SELECT p.product_id, p.product_name, p.sell_price, p.image_url,
                SUM(ii.quantity) as total_sold, SUM(ii.subtotal) as total_revenue
         FROM invoice_items ii
         JOIN products p ON ii.product_id = p.product_id
         JOIN invoices i ON ii.invoice_id = i.invoice_id
         WHERE YEAR(i.created_at) = ?
         GROUP BY p.product_id ORDER BY total_sold DESC LIMIT ?`,
        [y, lim]
      );

      res.json({ data: rows, year: y });
    } catch (error) { next(error); }
  },

  // GET /api/reports/inventory — Tồn kho & nhập/xuất
  getInventory: async (req, res, next) => {
    try {
      const { year } = req.query;
      const y = year || new Date().getFullYear();

      // Sản phẩm tồn kho thấp
      const [lowStock] = await pool.query(
        'SELECT product_id, product_name, stock_quantity, sell_price FROM products WHERE is_active = 1 AND stock_quantity <= 10 ORDER BY stock_quantity ASC LIMIT 20'
      );

      // Tổng nhập/xuất trong năm
      const [importStats] = await pool.query(
        `SELECT COUNT(*) as total_receipts, SUM(total_amount) as total_import_value
         FROM import_receipts WHERE YEAR(created_at) = ?`, [y]
      );

      const [exportStats] = await pool.query(
        `SELECT SUM(ii.quantity) as total_exported, SUM(ii.subtotal) as total_export_value
         FROM invoice_items ii JOIN invoices i ON ii.invoice_id = i.invoice_id
         WHERE YEAR(i.created_at) = ?`, [y]
      );

      // Nhập theo tháng
      const [importMonthly] = await pool.query(
        `SELECT MONTH(created_at) as month, SUM(total_amount) as total
         FROM import_receipts WHERE YEAR(created_at) = ? GROUP BY MONTH(created_at) ORDER BY month`, [y]
      );

      res.json({
        low_stock: lowStock,
        import_summary: importStats[0],
        export_summary: exportStats[0],
        import_monthly: importMonthly,
        year: y
      });
    } catch (error) { next(error); }
  },

  // GET /api/reports/hr — Thống kê nhân sự
  getHRStats: async (req, res, next) => {
    try {
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
      const { year } = req.query;
      const y = year || new Date().getFullYear();
      const [rows] = await pool.query(
        `SELECT i.invoice_id, c.full_name as customer_name, c.phone as customer_phone,
                i.subtotal, i.discount_percent, i.discount_amount, i.final_total,
                i.points_earned, i.payment_method, i.created_at
         FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.customer_id
         WHERE YEAR(i.created_at) = ? ORDER BY i.created_at DESC`, [y]
      );

      const headers = ['Mã HĐ', 'Khách hàng', 'SĐT', 'Tổng tiền hàng', 'Giảm (%)', 'Giảm (đ)', 'Thành tiền', 'Điểm', 'Thanh toán', 'Ngày tạo'];
      const csvRows = rows.map(r => [
        r.invoice_id, r.customer_name || 'Khách vãng lai', r.customer_phone || '',
        r.subtotal, r.discount_percent, r.discount_amount, r.final_total,
        r.points_earned, r.payment_method, new Date(r.created_at).toLocaleString('vi-VN')
      ]);

      const csv = '\uFEFF' + [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=hoa-don-${y}.csv`);
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
      const [rows] = await pool.query(
        `SELECT c.customer_id, c.full_name, c.phone, c.email, c.address, c.gender,
                c.date_of_birth, c.membership_tier, c.total_points, c.total_spent,
                COUNT(i.invoice_id) as order_count, c.created_at
         FROM customers c
         LEFT JOIN invoices i ON c.customer_id = i.customer_id
         GROUP BY c.customer_id ORDER BY c.customer_id`
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
