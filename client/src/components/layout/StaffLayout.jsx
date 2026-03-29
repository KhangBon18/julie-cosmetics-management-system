import { Navigate, Outlet } from 'react-router-dom';
import StaffSidebar from './StaffSidebar';
import TopHeader from './TopHeader';
import useAuth from '../../hooks/useAuth';

export default function StaffLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="app-layout">
      <StaffSidebar />
      <div className="main-content">
        <TopHeader title="Cổng Nhân Viên" />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
