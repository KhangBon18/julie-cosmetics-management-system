import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import useAuth from '../../hooks/useAuth';
import { resolveWorkspaceBasePath, resolveWorkspaceMeta } from '../../utils/workspace';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);
  const workspace = resolveWorkspaceMeta(user);
  const basePath = resolveWorkspaceBasePath(user, location.pathname);
  const preferredBasePath = workspace.defaultBasePath;

  if (basePath !== preferredBasePath) {
    const redirectedPathname = location.pathname.replace(/^\/(admin|hr|warehouse|business|staff)/, preferredBasePath);
    return <Navigate to={`${redirectedPathname}${location.search}${location.hash}`} replace />;
  }

  return (
    <div className={`app-layout workspace-${workspace.key}`}>
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} workspace={workspace} basePath={basePath} />
      <div className="main-content">
        <TopHeader title={workspace.title} subtitle={workspace.subtitle} toggleSidebar={toggleSidebar} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
