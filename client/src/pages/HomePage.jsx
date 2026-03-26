import { useState, useEffect } from 'react';
import { FiUsers, FiPackage, FiShoppingBag, FiDollarSign, FiTag, FiTruck } from 'react-icons/fi';
import { productService, customerService, invoiceService, employeeService, brandService } from '../services/dataService';

export default function DashboardPage() {
  const [stats, setStats] = useState({ products: 0, customers: 0, invoices: 0, employees: 0, brands: 0, revenue: 0 });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [products, customers, invoices, employees, brands] = await Promise.all([
        productService.getAll({ limit: 1 }),
        customerService.getAll({ limit: 1 }),
        invoiceService.getAll({ limit: 5 }),
        employeeService.getAll({ limit: 1 }),
        brandService.getAll()
      ]);

      const totalRevenue = invoices.invoices?.reduce((sum, inv) => sum + parseFloat(inv.final_total || 0), 0) || 0;

      setStats({
        products: products.total || 0,
        customers: customers.total || 0,
        invoices: invoices.total || 0,
        employees: employees.total || 0,
        brands: brands?.length || 0,
        revenue: totalRevenue
      });
      setRecentInvoices(invoices.invoices || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Tổng quan hệ thống Julie Cosmetics</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FiPackage /></div>
          <div className="stat-content">
            <h4>Sản phẩm</h4>
            <div className="stat-value">{stats.products}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiUsers /></div>
          <div className="stat-content">
            <h4>Khách hàng</h4>
            <div className="stat-value">{stats.customers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiShoppingBag /></div>
          <div className="stat-content">
            <h4>Hóa đơn</h4>
            <div className="stat-value">{stats.invoices}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiDollarSign /></div>
          <div className="stat-content">
            <h4>Doanh thu</h4>
            <div className="stat-value">{fmt(stats.revenue)}đ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pink"><FiTag /></div>
          <div className="stat-content">
            <h4>Thương hiệu</h4>
            <div className="stat-value">{stats.brands}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon cyan"><FiTruck /></div>
          <div className="stat-content">
            <h4>Nhân viên</h4>
            <div className="stat-value">{stats.employees}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3>Hóa đơn gần đây</h3></div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Khách hàng</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {recentInvoices.map(inv => (
                <tr key={inv.invoice_id}>
                  <td>#{inv.invoice_id}</td>
                  <td>{inv.customer_name || 'Khách vãng lai'}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(inv.final_total)}đ</td>
                  <td><span className={`badge badge-${inv.payment_method === 'cash' ? 'success' : inv.payment_method === 'card' ? 'info' : 'purple'}`}>{inv.payment_method}</span></td>
                  <td>{new Date(inv.created_at).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
              {!recentInvoices.length && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Chưa có hóa đơn nào</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
