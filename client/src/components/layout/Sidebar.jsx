import { NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiPackage, FiShoppingBag, FiTruck, FiFileText, FiDollarSign, FiCalendar, FiStar, FiSettings, FiTag, FiGrid, FiUserCheck, FiClipboard } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const navSections = [
  {
    title: 'Tổng quan',
    items: [
      { path: '/admin', icon: FiHome, label: 'Dashboard' }
    ]
  },
  {
    title: 'Bán hàng',
    items: [
      { path: '/admin/invoices', icon: FiShoppingBag, label: 'Hóa đơn', roles: ['admin', 'manager', 'staff'] },
      { path: '/admin/customers', icon: FiUserCheck, label: 'Khách hàng', roles: ['admin', 'manager', 'staff'] },
      { path: '/admin/reviews', icon: FiStar, label: 'Đánh giá', roles: ['admin', 'manager'] }
    ]
  },
  {
    title: 'Kho hàng',
    items: [
      { path: '/admin/products', icon: FiPackage, label: 'Sản phẩm' },
      { path: '/admin/brands', icon: FiTag, label: 'Thương hiệu', roles: ['admin', 'manager'] },
      { path: '/admin/categories', icon: FiGrid, label: 'Danh mục', roles: ['admin', 'manager'] },
      { path: '/admin/suppliers', icon: FiTruck, label: 'Nhà cung cấp', roles: ['admin', 'manager', 'warehouse'] },
      { path: '/admin/imports', icon: FiClipboard, label: 'Nhập kho', roles: ['admin', 'manager', 'warehouse'] }
    ]
  },
  {
    title: 'Nhân sự',
    items: [
      { path: '/admin/employees', icon: FiUsers, label: 'Nhân viên', roles: ['admin', 'manager'] },
      { path: '/admin/positions', icon: FiFileText, label: 'Chức vụ', roles: ['admin', 'manager'] },
      { path: '/admin/leaves', icon: FiCalendar, label: 'Nghỉ phép' },
      { path: '/admin/salaries', icon: FiDollarSign, label: 'Bảng lương', roles: ['admin', 'manager'] }
    ]
  },
  {
    title: 'Hệ thống',
    items: [
      { path: '/admin/reports', icon: FiClipboard, label: 'Báo cáo', roles: ['admin', 'manager'] },
      { path: '/admin/users', icon: FiSettings, label: 'Tài khoản', roles: ['admin'] }
    ]
  }
];

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <aside className="sidebar" aria-label="Thanh điều hướng chính">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">💄</div>
        <div className="sidebar-brand-text">
          Julie Cosmetics
          <span>Hệ thống quản lý</span>
        </div>
      </div>

      {navSections.map((section) => {
        const visibleItems = section.items.filter((item) =>
          !item.roles || item.roles.includes(user?.role)
        );
        if (!visibleItems.length) return null;

        return (
          <div key={section.title} className="sidebar-section">
            <div className="sidebar-section-title">{section.title}</div>
            <nav className="sidebar-nav">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                >
                  <span className="sidebar-link-icon" aria-hidden="true"><item.icon /></span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        );
      })}
    </aside>
  );
}
