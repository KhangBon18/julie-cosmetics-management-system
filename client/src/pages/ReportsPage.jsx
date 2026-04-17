import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import api from '../services/api';
import { toast } from 'react-toastify';

const fmt = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
const COLORS = ['#6366f1', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const generatedAtLabel = () => new Date().toLocaleString('vi-VN');

const leaveTypeLabels = {
  annual: 'Phép năm',
  sick: 'Ốm đau',
  maternity: 'Thai sản',
  unpaid: 'Không lương',
  resignation: 'Nghỉ việc'
};

const groupByLabel = {
  month: 'tháng',
  quarter: 'quý',
  year: 'năm'
};

const openPrintWindow = (html, title) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Trình duyệt đã chặn cửa sổ in. Vui lòng cho phép popup để tiếp tục.');
  }

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body{font-family:'Segoe UI',sans-serif;padding:28px;color:#1e293b}
          h1{text-align:center;color:#1d4ed8;margin-bottom:4px}
          h2{text-align:center;color:#64748b;font-weight:500;margin-top:0;margin-bottom:24px}
          .meta{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:20px}
          .meta-card{border:1px solid #dbeafe;background:#f8fbff;border-radius:12px;padding:14px 16px}
          .meta-label{font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.04em}
          .meta-value{font-size:18px;font-weight:700;color:#0f172a;margin-top:4px}
          .section-title{margin:28px 0 10px;font-size:18px;font-weight:700;color:#0f172a}
          .note{font-size:12px;color:#475569;line-height:1.6;margin:12px 0}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border:1px solid #cbd5e1;padding:10px 12px;font-size:13px}
          th{background:#eef2ff;font-weight:700;text-align:center}
          td{text-align:right;vertical-align:top}
          td.text-left{text-align:left}
          td.text-center{text-align:center}
          .subtotal-row td{background:#f8fafc;font-weight:700}
          .grand-total td{background:#dbeafe;font-weight:800}
          .footer{margin-top:28px;text-align:center;color:#94a3b8;font-size:12px}
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

const renderTableRowsHtml = (rows) => rows.map((row) => `
  <tr>
    ${row.map((cell, index) => {
      const value = typeof cell === 'object' && cell !== null ? cell.value : cell;
      const className = typeof cell === 'object' && cell !== null ? cell.className || '' : '';
      return `<td${className ? ` class="${className}"` : ''}>${value}</td>`;
    }).join('')}
  </tr>
`).join('');

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [year, setYear] = useState(new Date().getFullYear());
  const [revenueGroupBy, setRevenueGroupBy] = useState('month');
  const [profitGroupBy, setProfitGroupBy] = useState('month');
  const [inventoryGroupBy, setInventoryGroupBy] = useState('month');
  const [revenue, setRevenue] = useState(null);
  const [profit, setProfit] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [hrStats, setHrStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const periodScopeLabel = (groupBy) => (
    groupBy === 'year'
      ? `${year - 4}-${year}`
      : `${year}`
  );

  useEffect(() => { loadTab(activeTab); }, [activeTab, year, revenueGroupBy, profitGroupBy, inventoryGroupBy]);

  const loadTab = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'revenue') {
        const data = await api.get('/reports/revenue', { params: { year, group_by: revenueGroupBy } });
        setRevenue(data);
      } else if (tab === 'profit') {
        const data = await api.get('/reports/profit', { params: { year, group_by: profitGroupBy } });
        setProfit(data);
      } else if (tab === 'products') {
        const data = await api.get('/reports/top-products', { params: { year, limit: 10 } });
        setTopProducts(data);
      } else if (tab === 'inventory') {
        const data = await api.get('/reports/inventory', { params: { year, group_by: inventoryGroupBy } });
        setInventory(data);
      } else if (tab === 'hr') {
        const data = await api.get('/reports/hr', { params: { year } });
        setHrStats(data);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'revenue', label: '📊 Doanh thu' },
    { key: 'profit', label: '💰 Lợi nhuận' },
    { key: 'products', label: '🏆 SP bán chạy' },
    { key: 'inventory', label: '📦 Kho hàng' },
    { key: 'hr', label: '👥 Nhân sự' }
  ];

  const leaveStatsPieData = useMemo(() => {
    if (!hrStats?.leave_stats?.length) return [];
    return hrStats.leave_stats.map((row, index) => ({
      name: `${leaveTypeLabels[row.leave_type] || row.leave_type} • ${row.status}`,
      value: Number(row.count || 0),
      color: COLORS[index % COLORS.length]
    }));
  }, [hrStats]);

  const hrCompensationSummary = useMemo(() => {
    if (!hrStats?.salary_monthly?.length) {
      return { annualSalary: 0, annualBonus: 0, averageMonthlyBonus: 0 };
    }

    const annualSalary = hrStats.salary_monthly.reduce((sum, row) => sum + Number(row.total_salary || 0), 0);
    const annualBonus = hrStats.salary_monthly.reduce((sum, row) => sum + Number(row.total_bonus || 0), 0);

    return {
      annualSalary,
      annualBonus,
      averageMonthlyBonus: hrStats.salary_monthly.length ? annualBonus / hrStats.salary_monthly.length : 0
    };
  }, [hrStats]);

  const renderGroupSelector = (value, setValue) => (
    <select className="form-control" style={{ width: 140 }} value={value} onChange={event => setValue(event.target.value)}>
      <option value="month">Theo tháng</option>
      <option value="quarter">Theo quý</option>
      <option value="year">Theo năm</option>
    </select>
  );

  const handlePrintProfitReport = () => {
    if (!profit?.data?.length) {
      toast.info('Chưa có dữ liệu lợi nhuận để in.');
      return;
    }

    const rows = profit.data.map((row) => ([
      { value: row.label, className: 'text-center' },
      `${fmt(row.revenue)}đ`,
      `${fmt(row.cost)}đ`,
      `${fmt(row.profit)}đ`
    ]));

    openPrintWindow(`
      <h1>JULIE COSMETICS</h1>
      <h2>Báo cáo lợi nhuận theo ${groupByLabel[profit.group_by] || 'tháng'} — ${periodScopeLabel(profit.group_by)}</h2>
      <div class="meta">
        <div class="meta-card">
          <div class="meta-label">Doanh thu ròng</div>
          <div class="meta-value">${fmt(profit.summary?.total_revenue || 0)}đ</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Giá vốn ròng</div>
          <div class="meta-value">${fmt(profit.summary?.total_cogs || 0)}đ</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Lợi nhuận ròng</div>
          <div class="meta-value">${fmt(profit.summary?.total_profit || 0)}đ</div>
        </div>
      </div>
      <div class="note">
        <strong>Quy tắc tính:</strong> ${profit.meta?.cogs_rule || 'Lợi nhuận = doanh thu ròng - giá vốn ròng'}<br/>
        Refund doanh thu: <strong>${fmt(profit.meta?.refunded_revenue_total || 0)}đ</strong>
        • Giá vốn hoàn nhập: <strong>${fmt(profit.meta?.returned_cogs_total || 0)}đ</strong>
      </div>
      <div class="section-title">Bảng số liệu lợi nhuận</div>
      <table>
        <thead>
          <tr><th>Kỳ</th><th>Doanh thu ròng</th><th>Giá vốn ròng</th><th>Lợi nhuận ròng</th></tr>
        </thead>
        <tbody>
          ${renderTableRowsHtml(rows)}
          <tr class="grand-total">
            <td class="text-center">Tổng năm ${year}</td>
            <td>${fmt(profit.summary?.total_revenue || 0)}đ</td>
            <td>${fmt(profit.summary?.total_cogs || 0)}đ</td>
            <td>${fmt(profit.summary?.total_profit || 0)}đ</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">In lúc ${generatedAtLabel()} — Báo cáo lợi nhuận Julie Cosmetics</div>
    `, `Bao cao loi nhuan ${year}`);
  };

  const handlePrintInventoryReport = () => {
    if (!inventory) {
      toast.info('Chưa có dữ liệu kho để in.');
      return;
    }

    const importRows = (inventory.import_periodic || []).map((row) => ([
      { value: row.label, className: 'text-center' },
      `${fmt(row.total)}đ`
    ]));
    const exportRows = (inventory.export_periodic || []).map((row) => ([
      { value: row.label, className: 'text-center' },
      `${fmt(row.total_exported)}`
    ]));
    const lowStockRows = (inventory.low_stock || []).map((row) => ([
      { value: row.product_name, className: 'text-left' },
      `${fmt(row.stock_quantity)}`,
      `${fmt(row.sell_price)}đ`
    ]));

    openPrintWindow(`
      <h1>JULIE COSMETICS</h1>
      <h2>Báo cáo kho hàng theo ${groupByLabel[inventory.group_by] || 'tháng'} — ${periodScopeLabel(inventory.group_by)}</h2>
      <div class="meta">
        <div class="meta-card">
          <div class="meta-label">Tổng nhập kho</div>
          <div class="meta-value">${fmt(inventory.import_summary?.total_import_value || 0)}đ</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Giá trị xuất ròng</div>
          <div class="meta-value">${fmt(inventory.export_summary?.total_export_value || 0)}đ</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">SL xuất ròng</div>
          <div class="meta-value">${fmt(inventory.export_summary?.total_exported || 0)}</div>
        </div>
      </div>
      <div class="note">
        <strong>Quy tắc thống kê:</strong> ${inventory.meta?.scope_rule || 'Dữ liệu lấy theo phiếu nhập hoàn tất và hóa đơn bán hàng thực thu'}<br/>
        Hóa đơn hủy: <strong>${fmt(inventory.meta?.cancelled_invoices || 0)}</strong>
        • Hoàn tiền toàn phần: <strong>${fmt(inventory.meta?.fully_refunded_invoices || 0)}</strong>
        • Phiếu nhập hủy: <strong>${fmt(inventory.meta?.cancelled_import_receipts || 0)}</strong>
      </div>
      <div class="section-title">Giá trị nhập kho theo kỳ</div>
      <table>
        <thead><tr><th>Kỳ</th><th>Giá trị nhập kho</th></tr></thead>
        <tbody>
          ${renderTableRowsHtml(importRows)}
        </tbody>
      </table>
      <div class="section-title">Xuất hàng ròng theo kỳ</div>
      <table>
        <thead><tr><th>Kỳ</th><th>Số lượng xuất ròng</th></tr></thead>
        <tbody>
          ${renderTableRowsHtml(exportRows)}
        </tbody>
      </table>
      <div class="section-title">Sản phẩm sắp hết hàng</div>
      <table>
        <thead><tr><th>Sản phẩm</th><th>Tồn kho</th><th>Giá bán</th></tr></thead>
        <tbody>
          ${lowStockRows.length ? renderTableRowsHtml(lowStockRows) : '<tr><td colspan="3" class="text-center">Không có sản phẩm nào dưới ngưỡng cảnh báo</td></tr>'}
        </tbody>
      </table>
      <div class="footer">In lúc ${generatedAtLabel()} — Báo cáo kho Julie Cosmetics</div>
    `, `Bao cao kho ${year}`);
  };

  const handlePrintExportReport = () => {
    if (!inventory?.export_periodic?.length) {
      toast.info('Chưa có dữ liệu xuất hàng để in.');
      return;
    }

    const exportRows = inventory.export_periodic.map((row) => ([
      { value: row.label, className: 'text-center' },
      `${fmt(row.gross_exported)}`,
      `${fmt(row.returned_quantity)}`,
      `${fmt(row.total_exported)}`,
      `${fmt(row.total_export_value)}đ`
    ]));

    openPrintWindow(`
      <h1>JULIE COSMETICS</h1>
      <h2>Báo cáo xuất hàng theo ${groupByLabel[inventory.group_by] || 'tháng'} — ${periodScopeLabel(inventory.group_by)}</h2>
      <div class="meta">
        <div class="meta-card">
          <div class="meta-label">SL xuất gộp</div>
          <div class="meta-value">${fmt(inventory.export_summary?.gross_exported || 0)}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">SL trả lại</div>
          <div class="meta-value">${fmt(inventory.export_summary?.returned_quantity || 0)}</div>
        </div>
        <div class="meta-card">
          <div class="meta-label">Giá trị xuất ròng</div>
          <div class="meta-value">${fmt(inventory.export_summary?.total_export_value || 0)}đ</div>
        </div>
      </div>
      <div class="note">
        <strong>Quy tắc thống kê:</strong> ${inventory.meta?.scope_rule || 'Xuất hàng được trừ theo hóa đơn thực thu sau khi loại trừ phần hoàn trả hoàn tất'}
      </div>
      <table>
        <thead>
          <tr><th>Kỳ</th><th>SL xuất gộp</th><th>SL trả lại</th><th>SL xuất ròng</th><th>Giá trị xuất ròng</th></tr>
        </thead>
        <tbody>
          ${renderTableRowsHtml(exportRows)}
          <tr class="grand-total">
            <td class="text-center">Tổng năm ${year}</td>
            <td>${fmt(inventory.export_summary?.gross_exported || 0)}</td>
            <td>${fmt(inventory.export_summary?.returned_quantity || 0)}</td>
            <td>${fmt(inventory.export_summary?.total_exported || 0)}</td>
            <td>${fmt(inventory.export_summary?.total_export_value || 0)}đ</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">In lúc ${generatedAtLabel()} — Báo cáo xuất hàng Julie Cosmetics</div>
    `, `Bao cao xuat hang ${year}`);
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Báo cáo & Thống kê</h1><p>Phân tích số liệu bám trạng thái nghiệp vụ thực tế</p></div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {activeTab === 'profit' && profit ? (
            <button className="btn btn-outline" onClick={handlePrintProfitReport}>🖨️ In báo cáo lợi nhuận</button>
          ) : null}
          {activeTab === 'inventory' && inventory ? (
            <>
              <button className="btn btn-outline" onClick={handlePrintInventoryReport}>🖨️ In báo cáo kho</button>
              <button className="btn btn-outline" onClick={handlePrintExportReport}>🖨️ In báo cáo xuất hàng</button>
            </>
          ) : null}
          <select className="form-control" style={{ width: 100 }} value={year} onChange={event => setYear(parseInt(event.target.value, 10))}>
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button key={tab.key} className={`btn ${activeTab === tab.key ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(tab.key)} style={{ fontSize: 13 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-container"><div className="spinner" /></div> : null}

      {!loading && activeTab === 'revenue' && revenue ? (
        <div>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div />
            {renderGroupSelector(revenueGroupBy, setRevenueGroupBy)}
          </div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon blue">🧾</div><div className="stat-content"><h4>Hóa đơn được ghi nhận</h4><div className="stat-value">{revenue.summary?.total_invoices || 0}</div></div></div>
            <div className="stat-card"><div className="stat-icon orange">↩️</div><div className="stat-content"><h4>Refund completed</h4><div className="stat-value">{fmt(revenue.summary?.refunded_revenue || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon green">📊</div><div className="stat-content"><h4>Doanh thu ròng năm {year}</h4><div className="stat-value">{fmt(revenue.summary?.total_revenue || 0)}đ</div></div></div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Doanh thu ròng theo {groupByLabel[revenue.group_by] || 'tháng'} — {periodScopeLabel(revenue.group_by)}</h3></div>
            <div className="card-body">
              <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, color: '#475569', fontSize: 13 }}>
                <div><strong>Rule:</strong> {revenue.meta?.scope_rule}</div>
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenue.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={value => fmt(value)} />
                  <Tooltip formatter={value => `${fmt(value)}đ`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Doanh thu ròng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === 'profit' && profit ? (
        <div>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div />
            {renderGroupSelector(profitGroupBy, setProfitGroupBy)}
          </div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon blue">💵</div><div className="stat-content"><h4>Doanh thu ròng</h4><div className="stat-value">{fmt(profit.summary?.total_revenue || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon orange">📉</div><div className="stat-content"><h4>Giá vốn ròng</h4><div className="stat-value">{fmt(profit.summary?.total_cogs || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon green">💰</div><div className="stat-content"><h4>Lợi nhuận ròng</h4><div className="stat-value">{fmt(profit.summary?.total_profit || 0)}đ</div></div></div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Lợi nhuận theo {groupByLabel[profit.group_by] || 'tháng'} — {periodScopeLabel(profit.group_by)}</h3></div>
            <div className="card-body">
              <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, color: '#475569', fontSize: 13 }}>
                <div><strong>Rule:</strong> {profit.meta?.cogs_rule}</div>
                <div style={{ marginTop: 6 }}>
                  Refund doanh thu: <strong>{fmt(profit.meta?.refunded_revenue_total || 0)}đ</strong>
                  {' • '}Giá vốn hoàn nhập: <strong>{fmt(profit.meta?.returned_cogs_total || 0)}đ</strong>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={profit.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={value => fmt(value)} />
                  <Tooltip formatter={value => `${fmt(value)}đ`} />
                  <Legend />
                  <Bar dataKey="revenue" name="Doanh thu ròng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="Giá vốn ròng" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name="Lợi nhuận ròng" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Kỳ</th><th>Doanh thu ròng</th><th>Giá vốn ròng</th><th>Lợi nhuận ròng</th></tr></thead>
                <tbody>
                  {profit.data.map(row => (
                    <tr key={row.label}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.label}</td>
                      <td>{fmt(row.revenue)}đ</td>
                      <td>{fmt(row.cost)}đ</td>
                      <td style={{ color: row.profit >= 0 ? '#059669' : '#ef4444', fontWeight: 700 }}>{fmt(row.profit)}đ</td>
                    </tr>
                  ))}
                  {!profit.data.length ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Chưa có dữ liệu lợi nhuận</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === 'products' && topProducts ? (
        <div className="card">
          <div className="card-header"><h3>Top 10 sản phẩm bán ròng — {year}</h3></div>
          <div className="card-body">
            <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, color: '#475569', fontSize: 13 }}>
              <strong>Rule:</strong> {topProducts.meta?.scope_rule}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProducts.data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" />
                <YAxis dataKey="product_name" type="category" width={180} tick={{ fontSize: 12 }} />
                <Tooltip formatter={value => fmt(value)} />
                <Legend />
                <Bar dataKey="total_sold" name="Số lượng bán ròng" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Sản phẩm</th><th>Giá bán</th><th>SL bán ròng</th><th>SL trả</th><th>Doanh thu ròng</th></tr></thead>
              <tbody>
                {topProducts.data.map(product => (
                  <tr key={product.product_id}>
                    <td style={{ fontWeight: 600 }}>{product.product_name}</td>
                    <td>{fmt(product.sell_price)}đ</td>
                    <td>{product.total_sold}</td>
                    <td>{product.returned_quantity || 0}</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>{fmt(product.total_revenue)}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {!loading && activeTab === 'inventory' && inventory ? (
        <div>
          <div className="page-header" style={{ marginBottom: 16 }}>
            <div />
            {renderGroupSelector(inventoryGroupBy, setInventoryGroupBy)}
          </div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon orange">📦</div><div className="stat-content"><h4>Tổng nhập kho năm {year}</h4><div className="stat-value">{fmt(inventory.import_summary?.total_import_value || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon green">📤</div><div className="stat-content"><h4>Giá trị xuất bán ròng</h4><div className="stat-value">{fmt(inventory.export_summary?.total_export_value || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon blue">🧮</div><div className="stat-content"><h4>SL xuất ròng</h4><div className="stat-value">{fmt(inventory.export_summary?.total_exported || 0)}</div></div></div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Xuất hàng theo {groupByLabel[inventory.group_by] || 'tháng'} — {periodScopeLabel(inventory.group_by)}</h3></div>
            <div className="card-body">
              <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, color: '#475569', fontSize: 13 }}>
                <strong>Rule:</strong> {inventory.meta?.scope_rule}
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={inventory.export_periodic || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_exported" name="SL xuất ròng" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returned_quantity" name="SL trả lại" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Kỳ</th><th>SL xuất gộp</th><th>SL trả lại</th><th>SL xuất ròng</th><th>Giá trị xuất ròng</th></tr></thead>
                <tbody>
                  {(inventory.export_periodic || []).map(row => (
                    <tr key={row.label}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.label}</td>
                      <td>{fmt(row.gross_exported)}</td>
                      <td>{fmt(row.returned_quantity)}</td>
                      <td>{fmt(row.total_exported)}</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>{fmt(row.total_export_value)}đ</td>
                    </tr>
                  ))}
                  {!inventory.export_periodic?.length ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Chưa có dữ liệu xuất hàng</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Giá trị nhập kho theo {groupByLabel[inventory.group_by] || 'tháng'} — {periodScopeLabel(inventory.group_by)}</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={inventory.import_periodic || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={value => fmt(value)} />
                  <Tooltip formatter={value => `${fmt(value)}đ`} />
                  <Legend />
                  <Bar dataKey="total" name="Giá trị nhập" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Kỳ</th><th>Giá trị nhập kho</th></tr></thead>
                <tbody>
                  {(inventory.import_periodic || []).map(row => (
                    <tr key={row.label}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{row.label}</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>{fmt(row.total)}đ</td>
                    </tr>
                  ))}
                  {!inventory.import_periodic?.length ? <tr><td colSpan={2} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Chưa có dữ liệu nhập kho</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>

          {inventory.low_stock?.length ? (
            <div className="card">
              <div className="card-header"><h3>Sản phẩm sắp hết hàng (≤ 10)</h3></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Sản phẩm</th><th>Tồn kho</th><th>Giá bán</th></tr></thead>
                  <tbody>
                    {inventory.low_stock.map(product => (
                      <tr key={product.product_id}>
                        <td style={{ fontWeight: 600 }}>{product.product_name}</td>
                        <td style={{ color: product.stock_quantity <= 5 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>{product.stock_quantity}</td>
                        <td>{fmt(product.sell_price)}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!loading && activeTab === 'hr' && hrStats ? (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon blue">👥</div><div className="stat-content"><h4>Tổng nhân viên</h4><div className="stat-value">{hrStats.employees?.total || 0}</div></div></div>
            <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-content"><h4>Đang làm việc</h4><div className="stat-value">{hrStats.employees?.active || 0}</div></div></div>
            <div className="stat-card"><div className="stat-icon orange">❌</div><div className="stat-content"><h4>Đã nghỉ</h4><div className="stat-value">{hrStats.employees?.inactive || 0}</div></div></div>
            <div className="stat-card"><div className="stat-icon green">🎁</div><div className="stat-content"><h4>Tổng thưởng năm {year}</h4><div className="stat-value">{fmt(hrCompensationSummary.annualBonus)}đ</div></div></div>
          </div>

          {hrStats.salary_monthly?.length ? (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3>Tổng lương + thưởng theo tháng — {year}</h3></div>
              <div className="card-body">
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, color: '#475569', fontSize: 13 }}>
                  <div><strong>Quỹ lương năm:</strong> {fmt(hrCompensationSummary.annualSalary)}đ</div>
                  <div><strong>Tổng thưởng năm:</strong> {fmt(hrCompensationSummary.annualBonus)}đ</div>
                  <div><strong>Thưởng bình quân/tháng:</strong> {fmt(hrCompensationSummary.averageMonthlyBonus)}đ</div>
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={hrStats.salary_monthly.map(row => ({ ...row, label: `T${row.month}` }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={value => fmt(value)} />
                    <Tooltip formatter={value => `${fmt(value)}đ`} />
                    <Legend />
                    <Bar dataKey="total_salary" name="Tổng lương" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_bonus" name="Tổng thưởng" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          <div className="card">
            <div className="card-header"><h3>Thống kê nghỉ phép / nghỉ việc — {year}</h3></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) 1fr', gap: 20 }}>
              <div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={leaveStatsPieData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {leaveStatsPieData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={value => `${value} đơn`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Loại đơn</th><th>Trạng thái</th><th>Số lượng</th></tr></thead>
                  <tbody>
                    {(hrStats.leave_stats || []).map((row, index) => (
                      <tr key={`${row.leave_type}-${row.status}-${index}`}>
                        <td>{leaveTypeLabels[row.leave_type] || row.leave_type}</td>
                        <td>{row.status}</td>
                        <td style={{ fontWeight: 600 }}>{row.count}</td>
                      </tr>
                    ))}
                    {!hrStats.leave_stats?.length ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>Chưa có dữ liệu leave</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
