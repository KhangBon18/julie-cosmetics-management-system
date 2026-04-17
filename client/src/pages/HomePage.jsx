import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminOverview from './AdminOverview';
import StaffDashboard from './staff/StaffDashboard';
import { getWorkspaceHomePath, resolveWorkspaceKey } from '../utils/workspace';

export default function HomePage() {
  const { user } = useAuth();
  const workspaceKey = resolveWorkspaceKey(user);

  if (workspaceKey === 'admin') {
    return <AdminOverview />;
  }

  if (workspaceKey === 'hr' || workspaceKey === 'warehouse' || workspaceKey === 'business') {
    return <Navigate to={getWorkspaceHomePath(user)} replace />;
  }

  return <StaffDashboard />;
}
