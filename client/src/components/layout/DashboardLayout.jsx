import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import useAuth from '../../hooks/useAuth';

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="main-content">
        <TopHeader title="Julie Cosmetics" toggleSidebar={toggleSidebar} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
