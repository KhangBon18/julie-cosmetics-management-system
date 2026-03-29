import { NavLink } from 'react-router-dom';
import { FiHome, FiUser, FiCalendar, FiDollarSign, FiLogOut } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const navItems = [
  { path: '/staff', icon: FiHome, label: 'Tổng quan', end: true },
  { path: '/staff/profile', icon: FiUser, label: 'Hồ sơ cá nhân' },
  { path: '/staff/leaves', icon: FiCalendar, label: 'Nghỉ phép' },
  { path: '/staff/salaries', icon: FiDollarSign, label: 'Bảng lương' },
];

export default function StaffSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">💄</div>
        <div className="sidebar-brand-text">
          Julie Cosmetics
          <span>Cổng nhân viên</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-section-title">Menu</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-link-icon"><item.icon /></span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="sidebar-section" style={{ marginTop: 'auto', paddingBottom: 20 }}>
        <div className="sidebar-section-title">Tài khoản</div>
        <div style={{ padding: '8px 20px', fontSize: 13, color: '#94a3b8' }}>
          👤 {user?.full_name || user?.username}
        </div>
        <nav className="sidebar-nav">
          <a href="/admin" className="sidebar-link" style={{ color: '#6366f1' }}>
            <span className="sidebar-link-icon">🔧</span>
            {(user?.role === 'admin' || user?.role === 'manager') ? 'Trang quản trị' : ''}
          </a>
          <button
            className="sidebar-link"
            onClick={logout}
            style={{ border: 'none', background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: '#ef4444' }}
          >
            <span className="sidebar-link-icon"><FiLogOut /></span>
            Đăng xuất
          </button>
        </nav>
      </div>
    </aside>
  );
}
