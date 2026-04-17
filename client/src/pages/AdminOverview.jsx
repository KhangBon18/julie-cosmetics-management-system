import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTag, FiTruck, FiArrowRight, FiAlertTriangle, FiTrendingUp, FiCalendar } from 'react-icons/fi';
import { productService, customerService, invoiceService, employeeService, brandService } from '../services/dataService';
import api from '../services/api';
import useAuth from '../hooks/useAuth';
import { getPreferredWorkspaceBasePath, rebaseInternalPath } from '../utils/workspace';

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [stats, setStats] = useState({ products: 0, customers: 0, invoices: 0, employees: 0, brands: 0, revenue: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [products, customers, invoices, employees, brands, revenueData, lowStockData] = await Promise.all([
        productService.getAll({ limit: 1 }),
        customerService.getAll({ limit: 1 }),
        invoiceService.getAll({ limit: 5 }),
        employeeService.getAll({ limit: 1 }),
        brandService.getAll(),
        api.get('/reports/revenue', { params: { year: new Date().getFullYear() } }).catch(() => null),
        api.get('/products/low-stock').catch(() => ({ data: [] }))
      ]);

      setStats({
        products: products.total || 0,
        customers: customers.total || 0,
        invoices: invoices.total || 0,
        employees: employees.total || 0,
        brands: brands?.length || 0,
        revenue: parseFloat(revenueData?.summary?.total_revenue) || 0
      });
      setRecentInvoices(invoices.invoices || []);
      setLowStock(Array.isArray(lowStockData) ? lowStockData.slice(0, 5) : (lowStockData?.data || []).slice(0, 5));
      if (revenueData?.data) setMonthlyRevenue(revenueData.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container" aria-live="polite"><div className="spinner" aria-label="Đang tải…" role="status" /></div>;

  // Calculate max revenue for chart bar heights
  const maxRevenue = Math.max(...monthlyRevenue.map(m => parseFloat(m.revenue) || 0), 1);
  const workspaceBasePath = getPreferredWorkspaceBasePath(user);
  const toWorkspace = (path) => rebaseInternalPath(path, workspaceBasePath);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Tổng quan hệ thống Julie Cosmetics — {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/shop" className="btn btn-outline" style={{ fontSize: 13 }}>🛍️ Xem cửa hàng</Link>
        </div>
      </div>

      {/* ═══ STATS GRID ═══ */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orange" aria-hidden="true"><FiDollarSign /></div>
          <div className="stat-content">
            <h4>Doanh thu ròng năm</h4>
            <div className="stat-value">{fmt(stats.revenue)}đ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" aria-hidden="true"><FiShoppingBag /></div>
          <div className="stat-content">
            <h4>Hóa đơn</h4>
            <div className="stat-value">{stats.invoices}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple" aria-hidden="true"><FiPackage /></div>
          <div className="stat-content">
            <h4>Sản phẩm</h4>
            <div className="stat-value">{stats.products}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue" aria-hidden="true"><FiUsers /></div>
          <div className="stat-content">
            <h4>Khách hàng</h4>
            <div className="stat-value">{stats.customers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink" aria-hidden="true"><FiTag /></div>
          <div className="stat-content">
            <h4>Thương hiệu</h4>
            <div className="stat-value">{stats.brands}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan" aria-hidden="true"><FiTruck /></div>
          <div className="stat-content">
            <h4>Nhân viên</h4>
            <div className="stat-value">{stats.employees}</div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT GRID ═══ */}
      <div className="dashboard-grid">
        {/* LEFT: Revenue chart + Recent invoices */}
        <div>
          {/* Revenue Chart */}
          {monthlyRevenue.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-header">
                <h3><FiTrendingUp /> Doanh thu ròng theo tháng</h3>
                <span className="top-header-subtitle">Năm {new Date().getFullYear()}</span>
              </div>
              <div className="card-body">
                <div className="revenue-chart-container">
                  {monthlyRevenue.map((m, i) => {
                    const rev = parseFloat(m.revenue) || 0;
                    const height = Math.max((rev / maxRevenue) * 150, 4);
                    const isCurrentMonth = parseInt(m.month) === new Date().getMonth() + 1;
                    return (
                      <div key={i} className="revenue-bar-group">
                        <div className="revenue-bar-label">
                          {rev > 0 ? (rev >= 1000000 ? `${(rev / 1000000).toFixed(1)}M` : `${(rev / 1000).toFixed(0)}K`) : ''}
                        </div>
                        <div
                          className={`revenue-bar${isCurrentMonth ? ' current' : ''}`}
                          style={{ height }}
                          title={`${fmt(rev)}đ`}
                        />
                        <div className={`revenue-month-label${isCurrentMonth ? ' current' : ''}`}>
                          T{m.month}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Recent Invoices */}
          <div className="card">
            <div className="card-header">
              <h3><FiShoppingBag /> Hóa đơn gần đây</h3>
              <Link to={toWorkspace('/admin/invoices')} className="view-all-link">
                Xem tất cả <FiArrowRight size={12} />
              </Link>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Mã HĐ</th><th>Khách hàng</th><th>Tổng tiền</th><th>Thanh toán</th><th>Ngày tạo</th></tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv => (
                    <tr key={inv.invoice_id}>
                      <td><span style={{ fontWeight: 600, color: 'var(--primary)' }}>#{inv.invoice_id}</span></td>
                      <td>{inv.customer_name || 'Khách vãng lai'}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(inv.final_total)}đ</td>
                      <td><span className={`badge badge-${inv.payment_method === 'cash' ? 'success' : inv.payment_method === 'card' ? 'info' : 'purple'}`}>{inv.payment_method}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(inv.created_at))}</td>
                    </tr>
                  ))}
                  {recentInvoices.length === 0 && <tr><td colSpan={5} className="crud-empty">Chưa có hóa đơn nào</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Quick actions + Low stock */}
        <div>
          {/* Quick Actions */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>⚡ Thao tác nhanh</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to={toWorkspace('/admin/invoices')} className="quick-action-btn primary">
                <FiShoppingBag /> Tạo hóa đơn mới
              </Link>
              <Link to={toWorkspace('/admin/products')} className="quick-action-btn outline">
                <FiPackage /> Quản lý sản phẩm
              </Link>
              <Link to={toWorkspace('/admin/imports')} className="quick-action-btn outline">
                <FiTruck /> Nhập kho
              </Link>
              <Link to={toWorkspace('/admin/reports')} className="quick-action-btn outline">
                <FiCalendar /> Xem báo cáo
              </Link>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="card">
            <div className="card-header">
              <h3><FiAlertTriangle style={{ color: 'var(--warning)' }} /> Sắp hết hàng</h3>
              <Link to={toWorkspace('/admin/products')} className="view-all-link">Xem tất cả</Link>
            </div>
            <div className="card-body">
              {lowStock.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {lowStock.map(p => (
                    <div key={p.product_id} className="low-stock-item">
                      <div className="low-stock-thumb">
                        {p.image_url && <img src={p.image_url} alt=""
                          onError={e => { e.target.style.display = 'none'; }} />}
                      </div>
                      <div className="low-stock-info">
                        <div className="low-stock-name">{p.product_name}</div>
                        <div className="low-stock-brand">{p.brand_name}</div>
                      </div>
                      <div className={`low-stock-badge ${p.stock_quantity <= 0 ? 'out' : 'low'}`}>
                        {p.stock_quantity <= 0 ? 'Hết' : `Còn ${p.stock_quantity}`}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="crud-empty">
                  <FiPackage style={{ fontSize: 24, marginBottom: 8 }} /><br />
                  Tất cả sản phẩm đều còn hàng đầy đủ
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
