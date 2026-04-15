import { useState, useRef, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import { FiMenu } from 'react-icons/fi';

export default function TopHeader({ title, subtitle, toggleSidebar }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler, { passive: true });
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.full_name || user?.username || '?').charAt(0).toUpperCase();

  const roleLabels = { admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên', warehouse: 'Thủ kho' };

  return (
    <header className="top-header">
      <div className="top-header-left">
        <button className="mobile-menu-btn" onClick={toggleSidebar} aria-label="Menu" type="button">
          <FiMenu />
        </button>
        <div>
          <h2>{title}</h2>
          {subtitle ? <div className="top-header-subtitle">{subtitle}</div> : null}
        </div>
      </div>
      <div className="top-header-right">
        <div className="user-menu" ref={ref}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            aria-expanded={showDropdown}
            aria-haspopup="true"
            aria-label="Menu người dùng"
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', padding: '6px 12px' }}
          >
            <div className="user-avatar" aria-hidden="true">{initials}</div>
            <div>
              <div className="user-info-name">{user?.full_name || user?.username}</div>
              <div className="user-info-role">{roleLabels[user?.role] || user?.role}</div>
            </div>
          </button>
          {showDropdown ? (
            <div className="user-dropdown" role="menu">
              <button onClick={logout} className="danger" role="menuitem">🚪 Đăng xuất</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
