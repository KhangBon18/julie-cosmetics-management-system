import { useMemo } from 'react';
import useAuth from './useAuth';

/**
 * usePermission — Hook kiểm tra quyền truy cập của user hiện tại.
 *
 * Sử dụng:
 *   const { hasPermission, canCreate, canUpdate, canDelete, hasModuleAccess } = usePermission();
 *   if (hasPermission('invoices.create')) { ... }
 *   if (canCreate('invoices')) { ... }
 */
const usePermission = () => {
  const { user } = useAuth();

  const permSet = useMemo(() => {
    if (!user?.permissions) return new Set();
    return new Set(user.permissions);
  }, [user?.permissions]);

  const isAdmin = user?.role === 'admin';

  /**
   * Check nếu user có permission cụ thể.
   * Admin luôn trả về true.
   */
  const hasPermission = (permKey) => {
    if (isAdmin) return true;
    return permSet.has(permKey);
  };

  /**
   * Check nếu user có bất kỳ permission nào trong danh sách.
   */
  const hasAnyPermission = (permKeys) => {
    if (isAdmin) return true;
    return permKeys.some(key => permSet.has(key));
  };

  /**
   * Check nếu user có quyền xem module.
   * Module sẽ hiện trên sidebar nếu trả true.
   */
  const hasModuleAccess = (moduleKey) => {
    if (isAdmin) return true;
    return permSet.has(`${moduleKey}.read`);
  };

  // Shortcut helpers cho CRUD
  const canCreate = (moduleKey) => hasPermission(`${moduleKey}.create`);
  const canUpdate = (moduleKey) => hasPermission(`${moduleKey}.update`);
  const canDelete = (moduleKey) => hasPermission(`${moduleKey}.delete`);
  const canExport = (moduleKey) => hasPermission(`${moduleKey}.export`);

  return {
    hasPermission,
    hasAnyPermission,
    hasModuleAccess,
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    isAdmin,
    permissions: permSet,
  };
};

export default usePermission;
