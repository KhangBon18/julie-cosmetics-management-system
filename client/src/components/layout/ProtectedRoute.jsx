import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

/**
 * ProtectedRoute — kiểm tra role trước khi render.
 * Nếu user không có role phù hợp → redirect về dashboard hoặc staff portal.
 * @param {string[]} allowedRoles — danh sách roles cho phép (e.g. ['admin', 'manager'])
 * @param {React.ReactNode} children — component con
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Nếu không chỉ định roles → cho phép tất cả authenticated users
  if (!allowedRoles || !allowedRoles.length) {
    return children;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect staff/warehouse về staff portal, admin/manager về admin dashboard
    if (['staff', 'warehouse'].includes(user.role)) {
      return <Navigate to="/staff" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return children;
}
