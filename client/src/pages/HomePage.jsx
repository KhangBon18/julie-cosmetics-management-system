import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminOverview from './AdminOverview';
import StaffDashboard from './staff/StaffDashboard';
import ManagerDashboard from './hr/ManagerDashboard';
import { getWorkspaceHomePath, resolveWorkspaceKey } from '../utils/workspace';

export default function HomePage() {
  const { user } = useAuth();
  const workspaceKey = resolveWorkspaceKey(user);

  if (workspaceKey === 'admin') {
    return <AdminOverview />;
  }

  if (workspaceKey === 'hr') {
    return <ManagerDashboard />;
  }

  if (workspaceKey === 'warehouse' || workspaceKey === 'business') {
    return <Navigate to={getWorkspaceHomePath(user)} replace />;
  }

  return <StaffDashboard />;
}
