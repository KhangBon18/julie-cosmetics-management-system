import { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { toast } from 'react-toastify';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);
const COLORS = ['#6366f1', '#059669', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue');
  const [year, setYear] = useState(2026);
  const [revenue, setRevenue] = useState(null);
  const [profit, setProfit] = useState(null);
  const [topProducts, setTopProducts] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [hrStats, setHrStats] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadTab(activeTab); }, [activeTab, year]);

  const loadTab = async (tab) => {
    setLoading(true);
    try {
      if (tab === 'revenue') {
        const d = await api.get('/reports/revenue', { params: { year } });
        setRevenue(d);
      } else if (tab === 'profit') {
        const d = await api.get('/reports/profit', { params: { year } });
        setProfit(d);
      } else if (tab === 'products') {
        const d = await api.get('/reports/top-products', { params: { year, limit: 10 } });
        setTopProducts(d);
      } else if (tab === 'inventory') {
        const d = await api.get('/reports/inventory', { params: { year } });
        setInventory(d);
      } else if (tab === 'hr') {
        const d = await api.get('/reports/hr', { params: { year } });
        setHrStats(d);
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const tabs = [
    { key: 'revenue', label: '📊 Doanh thu' },
    { key: 'profit', label: '💰 Lợi nhuận' },
    { key: 'products', label: '🏆 SP bán chạy' },
    { key: 'inventory', label: '📦 Kho hàng' },
    { key: 'hr', label: '👥 Nhân sự' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1>Báo cáo & Thống kê</h1><p>Phân tích hoạt động kinh doanh</p></div>
        <select className="form-control" style={{ width: 100 }} value={year} onChange={e => setYear(parseInt(e.target.value))}>
          <option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option>
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
        {tabs.map(t => (
          <button key={t.key} className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(t.key)} style={{ fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-container"><div className="spinner" /></div>}

      {/* ═══ DOANH THU ═══ */}
      {!loading && activeTab === 'revenue' && revenue && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon green">📊</div><div className="stat-content"><h4>Tổng doanh thu {year}</h4><div className="stat-value">{fmt(revenue.summary?.total_revenue || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon blue">🧾</div><div className="stat-content"><h4>Tổng hóa đơn</h4><div className="stat-value">{revenue.summary?.total_invoices || 0}</div></div></div>
          </div>
          <div className="card">
            <div className="card-header"><h3>Doanh thu theo tháng — {year}</h3></div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={revenue.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={v => fmt(v)} />
                  <Tooltip formatter={v => fmt(v) + 'đ'} />
                  <Legend />
                  <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ═══ LỢI NHUẬN ═══ */}
      {!loading && activeTab === 'profit' && profit && (
        <div className="card">
          <div className="card-header"><h3>Doanh thu vs Chi phí nhập vs Lợi nhuận — {year}</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={profit.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={v => fmt(v)} />
                <Tooltip formatter={v => fmt(v) + 'đ'} />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cost" name="Chi phí nhập" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Lợi nhuận" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ═══ TOP SẢN PHẨM ═══ */}
      {!loading && activeTab === 'products' && topProducts && (
        <div className="card">
          <div className="card-header"><h3>🏆 Top 10 sản phẩm bán chạy — {year}</h3></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topProducts.data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" />
                <YAxis dataKey="product_name" type="category" width={160} tick={{ fontSize: 12 }} />
                <Tooltip formatter={v => fmt(v)} />
                <Legend />
                <Bar dataKey="total_sold" name="Số lượng bán" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>STT</th><th>Sản phẩm</th><th>Giá bán</th><th>SL bán</th><th>Doanh thu</th></tr></thead>
              <tbody>
                {topProducts.data.map((p, i) => (
                  <tr key={p.product_id}>
                    <td style={{ fontWeight: 700, color: i < 3 ? '#f59e0b' : '#64748b' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td>{fmt(p.sell_price)}đ</td>
                    <td style={{ fontWeight: 600 }}>{p.total_sold}</td>
                    <td style={{ fontWeight: 600, color: '#059669' }}>{fmt(p.total_revenue)}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ KHO HÀNG ═══ */}
      {!loading && activeTab === 'inventory' && inventory && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon orange">📦</div><div className="stat-content"><h4>Tổng nhập kho</h4><div className="stat-value">{fmt(inventory.import_summary?.total_import_value || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon green">📤</div><div className="stat-content"><h4>Tổng xuất kho</h4><div className="stat-value">{fmt(inventory.export_summary?.total_export_value || 0)}đ</div></div></div>
            <div className="stat-card"><div className="stat-icon blue">📋</div><div className="stat-content"><h4>Phiếu nhập</h4><div className="stat-value">{inventory.import_summary?.total_receipts || 0}</div></div></div>
            <div className="stat-card"><div className="stat-icon pink">📊</div><div className="stat-content"><h4>Tổng SP đã xuất</h4><div className="stat-value">{fmt(inventory.export_summary?.total_exported || 0)}</div></div></div>
          </div>

          {inventory.low_stock?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3>⚠️ Sản phẩm sắp hết hàng (≤ 10)</h3></div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Sản phẩm</th><th>Tồn kho</th><th>Giá bán</th></tr></thead>
                  <tbody>
                    {inventory.low_stock.map(p => (
                      <tr key={p.product_id}>
                        <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                        <td style={{ color: p.stock_quantity <= 5 ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>{p.stock_quantity}</td>
                        <td>{fmt(p.sell_price)}đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ NHÂN SỰ ═══ */}
      {!loading && activeTab === 'hr' && hrStats && (
        <div>
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card"><div className="stat-icon blue">👥</div><div className="stat-content"><h4>Tổng nhân viên</h4><div className="stat-value">{hrStats.employees?.total || 0}</div></div></div>
            <div className="stat-card"><div className="stat-icon green">✅</div><div className="stat-content"><h4>Đang làm việc</h4><div className="stat-value">{hrStats.employees?.active || 0}</div></div></div>
            <div className="stat-card"><div className="stat-icon orange">❌</div><div className="stat-content"><h4>Đã nghỉ</h4><div className="stat-value">{hrStats.employees?.inactive || 0}</div></div></div>
          </div>

          {hrStats.salary_monthly?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header"><h3>Tổng lương + Thưởng theo tháng — {year}</h3></div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={hrStats.salary_monthly.map(s => ({ ...s, label: `T${s.month}` }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={v => fmt(v)} />
                    <Tooltip formatter={v => fmt(v) + 'đ'} />
                    <Legend />
                    <Bar dataKey="total_salary" name="Tổng lương" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_bonus" name="Tổng thưởng" fill="#059669" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Tháng</th><th>Số NV</th><th>Tổng lương</th><th>Tổng thưởng</th></tr></thead>
                  <tbody>
                    {hrStats.salary_monthly.map(s => (
                      <tr key={s.month}>
                        <td>Tháng {s.month}</td>
                        <td>{s.employee_count}</td>
                        <td style={{ fontWeight: 600, color: '#2563eb' }}>{fmt(s.total_salary)}đ</td>
                        <td style={{ color: '#059669' }}>{s.total_bonus > 0 ? `+${fmt(s.total_bonus)}đ` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
