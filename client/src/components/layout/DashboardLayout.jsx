import { Navigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopHeader from './TopHeader';
import useAuth from '../../hooks/useAuth';

export default function DashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <TopHeader title="Julie Cosmetics" />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
