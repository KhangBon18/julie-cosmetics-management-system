import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getWorkspaceHomePath, normalizeUserRole, resolveWorkspaceKey } from '../../utils/workspace';

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
export default function ProtectedRoute({ allowedRoles, permission, workspaceKeys, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  const workspaceHome = getWorkspaceHomePath(user);
  const workspaceKey = resolveWorkspaceKey(user);
  const normalizedRole = normalizeUserRole(user);

  if (workspaceKeys?.length && workspaceKey !== 'admin' && !workspaceKeys.includes(workspaceKey)) {
    return <Navigate to={workspaceHome} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(normalizedRole)) {
    return <Navigate to={workspaceHome} replace />;
  }

  // Permission-based check (new system)
  if (permission) {
    // Admin always passes
    if (workspaceKey === 'admin') return children;

    const userPerms = new Set(user.permissions || []);
    if (userPerms.has(permission)) return children;

    // No permission — redirect
    return <Navigate to={workspaceHome} replace />;
  }

  // Legacy role-based check (backward compat)
  if (allowedRoles && allowedRoles.length) {
    return children;
  }

  return children;
}
