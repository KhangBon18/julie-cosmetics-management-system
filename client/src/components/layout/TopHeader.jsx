import { useState, useRef, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';

export default function TopHeader({ title }) {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShowDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (user?.full_name || user?.username || '?').charAt(0).toUpperCase();

  const roleLabels = { admin: 'Quản trị viên', manager: 'Quản lý', staff: 'Nhân viên', warehouse: 'Thủ kho' };

  return (
    <header className="top-header">
      <div className="top-header-left">
        <h2>{title}</h2>
      </div>
      <div className="top-header-right">
        <div className="user-menu" ref={ref} onClick={() => setShowDropdown(!showDropdown)}>
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-info-name">{user?.full_name || user?.username}</div>
            <div className="user-info-role">{roleLabels[user?.role] || user?.role}</div>
          </div>
          {showDropdown && (
            <div className="user-dropdown">
              <button onClick={logout} className="danger">🚪 Đăng xuất</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
