import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight, FiClipboard, FiPackage, FiTruck } from 'react-icons/fi';
import { importService, productService, supplierService } from '../../services/dataService';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import { getWorkspaceBaseFromPath, getPreferredWorkspaceBasePath, rebaseInternalPath } from '../../utils/workspace';

const fmt = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

export default function WarehouseDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    suppliers: 0,
    importReceipts: 0,
    lowStock: 0,
  });
  const [recentImports, setRecentImports] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const currentYear = new Date().getFullYear();
  const basePath = getWorkspaceBaseFromPath(location.pathname) || getPreferredWorkspaceBasePath(user);
  const toWorkspace = (path) => rebaseInternalPath(path, basePath);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [productData, supplierData, importData, inventoryData] = await Promise.all([
          productService.getAll({ limit: 1 }),
          supplierService.getAll({ limit: 5 }),
          importService.getAll({ limit: 5 }),
          api.get('/reports/inventory', { params: { year: currentYear, group_by: 'month' } }).catch(() => null),
        ]);

        const imports = importData?.imports || [];
        const lowStock = inventoryData?.low_stock || [];

        setStats({
          products: Number(productData?.total || productData?.products?.length || 0),
          suppliers: Number(supplierData?.total || supplierData?.suppliers?.length || supplierData?.length || 0),
          importReceipts: Number(importData?.total || imports.length || 0),
          lowStock: lowStock.length,
        });
        setRecentImports(imports);
        setLowStockItems(lowStock.slice(0, 5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentYear]);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Dashboard kho</h1>
          <p>Tổng quan nhanh cho sản phẩm, nhà cung cấp, phiếu nhập và tồn kho năm {currentYear}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><FiPackage /></div>
          <div className="stat-content">
            <h4>Sản phẩm đang quản lý</h4>
            <div className="stat-value">{stats.products}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><FiTruck /></div>
          <div className="stat-content">
            <h4>Nhà cung cấp</h4>
            <div className="stat-value">{stats.suppliers}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><FiClipboard /></div>
          <div className="stat-content">
            <h4>Phiếu nhập đã ghi nhận</h4>
            <div className="stat-value">{stats.importReceipts}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><FiAlertTriangle /></div>
          <div className="stat-content">
            <h4>Sản phẩm sắp hết hàng</h4>
            <div className="stat-value">{stats.lowStock}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <h3><FiClipboard /> Phiếu nhập gần đây</h3>
              <Link to={toWorkspace('/admin/imports')} className="view-all-link">
                Mở module nhập kho <FiArrowRight size={12} />
              </Link>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Phiếu</th>
                    <th>Nhà cung cấp</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                  </tr>
                </thead>
                <tbody>
                  {recentImports.map((receipt) => (
                    <tr key={receipt.receipt_id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>#{receipt.receipt_id}</td>
                      <td>{receipt.supplier_name}</td>
                      <td>{fmt(receipt.total_amount)}đ</td>
                      <td>{receipt.status}</td>
                      <td>{new Date(receipt.created_at).toLocaleDateString('vi-VN')}</td>
                    </tr>
                  ))}
                  {!recentImports.length && (
                    <tr>
                      <td colSpan={5} className="crud-empty">Chưa có phiếu nhập nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Cảnh báo tồn kho</h3></div>
            <div className="card-body">
              {lowStockItems.length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {lowStockItems.map((product) => (
                    <div key={product.product_id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 12, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa' }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{product.product_name}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{fmt(product.sell_price)}đ</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#c2410c' }}>Còn {product.stock_quantity}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="crud-empty">Chưa có sản phẩm nào xuống dưới ngưỡng cảnh báo</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><h3>Thao tác nhanh</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to={toWorkspace('/admin/products')} className="quick-action-btn primary">
                <FiPackage /> Quản lý sản phẩm
              </Link>
              <Link to={toWorkspace('/admin/suppliers')} className="quick-action-btn outline">
                <FiTruck /> Quản lý nhà cung cấp
              </Link>
              <Link to={toWorkspace('/admin/imports')} className="quick-action-btn outline">
                <FiClipboard /> Lập phiếu nhập
              </Link>
              <Link to={toWorkspace('/admin/reports')} className="quick-action-btn outline">
                <FiAlertTriangle /> Xem báo cáo kho
              </Link>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Phạm vi chấm phần II</h3></div>
            <div className="card-body">
              <div style={{ display: 'grid', gap: 10 }}>
                <div><strong>Sản phẩm / giá / tồn / giá nhập:</strong> module Sản phẩm</div>
                <div><strong>Phiếu nhập:</strong> module Nhập kho</div>
                <div><strong>Nhà cung cấp:</strong> module Nhà cung cấp + mapping sản phẩm</div>
                <div><strong>Báo cáo sản phẩm theo tháng/năm:</strong> tab Kho hàng trong Báo cáo</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
