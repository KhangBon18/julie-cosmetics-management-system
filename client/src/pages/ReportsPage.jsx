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

  const renderGroupSelector = (value, setValue) => (
    <select className="form-control" style={{ width: 140 }} value={value} onChange={event => setValue(event.target.value)}>
      <option value="month">Theo tháng</option>
      <option value="quarter">Theo quý</option>
      <option value="year">Theo năm</option>
    </select>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1>Báo cáo & Thống kê</h1><p>Phân tích số liệu bám trạng thái nghiệp vụ thực tế</p></div>
        <select className="form-control" style={{ width: 100 }} value={year} onChange={event => setYear(parseInt(event.target.value, 10))}>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
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
          </div>

          {hrStats.salary_monthly?.length ? (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3>Tổng lương + thưởng theo tháng — {year}</h3></div>
              <div className="card-body">
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
