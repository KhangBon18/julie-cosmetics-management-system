import { NavLink } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { buildSidebarSections } from '../../config/moduleRegistry';

export default function Sidebar({ isOpen, onClose, workspace, basePath }) {
  const { user } = useAuth();

  // Build sidebar sections dynamically from module registry + user permissions
  const sections = buildSidebarSections(user?.permissions || [], user?.role_name || user?.role || '', basePath);

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Thanh điều hướng chính">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">💄</div>
        <div className="sidebar-brand-text">
          Julie Cosmetics
          <span>{workspace?.title || 'Hệ thống quản lý'}</span>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.title} className="sidebar-section">
          <div className="sidebar-section-title">{section.title}</div>
          <nav className="sidebar-nav">
            {section.items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === basePath}
                onClick={onClose}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-link-icon" aria-hidden="true"><item.icon /></span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      ))}
    </aside>
  );
}
