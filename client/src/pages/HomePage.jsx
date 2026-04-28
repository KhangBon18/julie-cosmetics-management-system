import { useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminOverview from './AdminOverview';
import StaffDashboard from './staff/StaffDashboard';
import ManagerDashboard from './hr/ManagerDashboard';
import BusinessDashboard from './business/BusinessDashboard';
import WarehouseDashboard from './warehouse/WarehouseDashboard';
import { resolveWorkspaceKey } from '../utils/workspace';

export default function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const workspaceKey = resolveWorkspaceKey(user, location.pathname);

  if (workspaceKey === 'admin') {
    return <AdminOverview />;
  }

  if (workspaceKey === 'hr') {
    return <ManagerDashboard />;
  }

  if (workspaceKey === 'warehouse') {
    return <WarehouseDashboard />;
  }

  if (workspaceKey === 'business') {
    return <BusinessDashboard />;
  }

  return <StaffDashboard />;
}
