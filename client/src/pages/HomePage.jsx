import useAuth from '../hooks/useAuth';
import AdminOverview from './AdminOverview';
import StaffDashboard from './staff/StaffDashboard';

export default function HomePage() {
  const { user } = useAuth();
  if (user?.role === 'admin' || user?.role === 'manager') {
    return <AdminOverview />;
  }
  return <StaffDashboard />;
}
