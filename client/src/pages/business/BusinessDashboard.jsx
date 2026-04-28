import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiArrowRight, FiClock, FiDollarSign, FiShoppingBag, FiTrendingUp, FiUserCheck } from 'react-icons/fi';
import { customerService, invoiceService } from '../../services/dataService';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { getWorkspaceBaseFromPath, getPreferredWorkspaceBasePath, rebaseInternalPath } from '../../utils/workspace';

const fmt = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

export default function BusinessDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    invoices: 0,
    customers: 0,
    pendingInvoices: 0,
    annualRevenue: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [pendingInvoice, setPendingInvoice] = useState(null);

  const currentYear = new Date().getFullYear();
  const basePath = getWorkspaceBaseFromPath(location.pathname) || getPreferredWorkspaceBasePath(user);
  const toWorkspace = (path) => rebaseInternalPath(path, basePath);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [invoiceData, customerData, pendingData, revenueData] = await Promise.all([
          invoiceService.getAll({ limit: 5 }),
          customerService.getAll({ limit: 1 }),
          invoiceService.getAll({ limit: 5, status: 'pending' }),
          api.get('/reports/revenue', { params: { year: currentYear, group_by: 'month' } }).catch(() => null),
        ]);

        const invoices = invoiceData?.invoices || [];
        const pendingInvoices = pendingData?.invoices || [];

        setStats({
          invoices: Number(invoiceData?.total || invoices.length || 0),
          customers: Number(customerData?.total || customerData?.customers?.length || 0),
          pendingInvoices: Number(pendingData?.total || pendingInvoices.length || 0),
          annualRevenue: Number(revenueData?.summary?.total_revenue || 0),
        });
        setRecentInvoices(invoices);
        setPendingInvoice(pendingInvoices[0] || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentYear]);

  const revenueHint = useMemo(() => {
    if (!pendingInvoice) {
      return 'Đã có thể demo đầy đủ luồng bán hàng, khách hàng và báo cáo doanh thu.';
    }

    return `Đang có sẵn hóa đơn demo #${pendingInvoice.invoice_id} ở trạng thái chờ thanh toán để trình diễn luồng xác nhận giao dịch.`;
  }, [pendingInvoice]);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard kinh doanh</h1>
          <p>Tổng quan nhanh cho khu bán hàng nội bộ, khách hàng và doanh thu năm {currentYear}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon green"><FiDollarSign /></div>
          <div className="stat-content">
            <h4>Doanh thu ròng năm</h4>
            <div className="stat-value">{fmt(stats.annualRevenue)}đ</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiShoppingBag /></div>
          <div className="stat-content">
            <h4>Tổng hóa đơn</h4>
            <div className="stat-value">{stats.invoices}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiClock /></div>
          <div className="stat-content">
            <h4>Hóa đơn chờ thanh toán</h4>
            <div className="stat-value">{stats.pendingInvoices}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><FiUserCheck /></div>
          <div className="stat-content">
            <h4>Khách hàng</h4>
            <div className="stat-value">{stats.customers}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3><FiTrendingUp /> Hóa đơn gần đây</h3>
              <Link to={toWorkspace('/admin/invoices')} className="view-all-link">
                Mở module hóa đơn <FiArrowRight size={12} />
              </Link>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Mã HĐ</th>
                    <th>Khách hàng</th>
                    <th>Thành tiền</th>
                    <th>Thanh toán</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((invoice) => (
                    <tr key={invoice.invoice_id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{invoice.invoice_id}</td>
                      <td>{invoice.customer_name || 'Khách vãng lai'}</td>
                      <td>{fmt(invoice.final_total)}đ</td>
                      <td>{invoice.payment_method}</td>
                      <td>{invoice.payment_status || invoice.status}</td>
                    </tr>
                  ))}
                  {!recentInvoices.length && (
                    <tr>
                      <td colSpan={5} className="crud-empty">Chưa có hóa đơn để hiển thị</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Case demo đang sẵn sàng</h3></div>
            <div className="card-body">
              <p style={{ margin: 0, lineHeight: 1.7 }}>{revenueHint}</p>
              {pendingInvoice ? (
                <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <strong>Gợi ý demo:</strong> vào module Hóa đơn, tìm note
                  {' '}
                  <code>[DEMO] Hóa đơn chờ xác nhận thanh toán</code>
                  {' '}
                  để trình diễn luồng xác nhận hoặc thất bại thanh toán.
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Thao tác nhanh</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to={toWorkspace('/admin/invoices')} className="quick-action-btn primary">
                <FiShoppingBag /> Lập hóa đơn bán hàng
              </Link>
              <Link to={toWorkspace('/admin/customers')} className="quick-action-btn outline">
                <FiUserCheck /> Quản lý khách hàng
              </Link>
              <Link to={toWorkspace('/admin/reports')} className="quick-action-btn outline">
                <FiTrendingUp /> Xem báo cáo doanh thu
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Phạm vi chấm phần II</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 10 }}>
                <div><strong>Hóa đơn / phiếu xuất:</strong> module Hóa đơn nội bộ</div>
                <div><strong>Thống kê xuất hàng:</strong> tab Kho hàng trong Báo cáo</div>
                <div><strong>Doanh thu / lợi nhuận:</strong> tab Doanh thu và Lợi nhuận</div>
                <div><strong>Khách hàng:</strong> module Khách hàng phục vụ bán hàng và CRM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
