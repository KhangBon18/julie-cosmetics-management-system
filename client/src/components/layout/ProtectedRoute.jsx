import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getWorkspaceHomePath } from '../../utils/workspace';

/**
 * ProtectedRoute — kiểm tra quyền trước khi render.
 *
 * Props:
 *   - allowedRoles: string[] — (backward compat) danh sách roles cho phép
 *   - permission: string — permission key cần thiết (e.g. 'employees.read')
 *   - children: React.ReactNode
 *
 * Ưu tiên: permission > allowedRoles
 */
export default function ProtectedRoute({ allowedRoles, permission, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const workspaceHome = getWorkspaceHomePath(user, location.pathname);

  // Permission-based check (new system)
  if (permission) {
    // Admin always passes
    if (user.role === 'admin') return children;

    const userPerms = new Set(user.permissions || []);
    if (userPerms.has(permission)) return children;

    // No permission — redirect
    return <Navigate to={workspaceHome} replace />;
  }

  // Legacy role-based check (backward compat)
  if (allowedRoles && allowedRoles.length) {
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to={workspaceHome} replace />;
    }
  }

  return children;
}
