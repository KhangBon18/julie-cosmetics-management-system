const KNOWN_BASES = ['/admin', '/hr', '/warehouse', '/business', '/staff'];

const WORKSPACE_CONFIG = {
  admin: {
    key: 'admin',
    title: 'Khu Quản trị Admin',
    subtitle: 'Quản trị tài khoản, phân quyền, cấu hình và báo cáo toàn hệ thống',
    defaultBasePath: '/admin',
    homePath: '/admin'
  },
  hr: {
    key: 'hr',
    title: 'Khu Quản lý Nhân sự',
    subtitle: 'Quản lý hồ sơ, nghỉ phép, lương thưởng và báo cáo nhân sự',
    defaultBasePath: '/hr',
    homePath: '/hr'
  },
  warehouse: {
    key: 'warehouse',
    title: 'Khu Kho',
    subtitle: 'Quản lý sản phẩm, nhập kho, nhà cung cấp và tồn kho',
    defaultBasePath: '/warehouse',
    homePath: '/warehouse/imports'
  },
  business: {
    key: 'business',
    title: 'Khu Kinh doanh',
    subtitle: 'Bán hàng, khách hàng, doanh thu và lợi nhuận',
    defaultBasePath: '/business',
    homePath: '/business/invoices'
  },
  staff: {
    key: 'staff',
    title: 'Cổng Nhân viên',
    subtitle: 'Tự phục vụ hồ sơ cá nhân, nghỉ phép và tiền lương',
    defaultBasePath: '/staff',
    homePath: '/staff'
  }
};

const ROLE_WORKSPACE_MAP = {
  admin: 'admin',
  manager: 'hr',
  hr: 'hr',
  warehouse: 'warehouse',
  business: 'business',
  sales: 'business',
  staff: 'business',
  employee: 'staff',
  staff_portal: 'staff'
};

const WORKSPACE_PERMISSION_PREFIXES = {
  admin: ['users.', 'roles.', 'settings.'],
  hr: ['employees.', 'positions.', 'leaves.', 'salaries.'],
  warehouse: ['products.', 'brands.', 'categories.', 'suppliers.', 'imports.'],
  business: ['invoices.', 'customers.', 'reviews.'],
  staff: []
};

export const normalizeUserRole = (user) => String(user?.role_name || user?.role || '')
  .trim()
  .toLowerCase();

const hasPermissionPrefix = (userPermissions = [], prefixes = []) => {
  if (!Array.isArray(userPermissions) || !prefixes.length) return false;
  return userPermissions.some(permission =>
    prefixes.some(prefix => permission.startsWith(prefix))
  );
};

export const getAccessibleWorkspaceKeys = (user) => {
  const normalizedRole = normalizeUserRole(user);
  const defaultWorkspaceKey = ROLE_WORKSPACE_MAP[normalizedRole] || 'staff';

  if (defaultWorkspaceKey === 'admin') {
    return Object.keys(WORKSPACE_CONFIG);
  }

  const accessibleWorkspaceKeys = new Set([defaultWorkspaceKey]);
  const permissionList = Array.isArray(user?.permissions) ? user.permissions : [];

  Object.entries(WORKSPACE_PERMISSION_PREFIXES).forEach(([workspaceKey, prefixes]) => {
    if (workspaceKey === 'staff') return;
    if (hasPermissionPrefix(permissionList, prefixes)) {
      accessibleWorkspaceKeys.add(workspaceKey);
    }
  });

  if (['manager', 'warehouse', 'staff', 'employee', 'staff_portal'].includes(normalizedRole)) {
    accessibleWorkspaceKeys.add('staff');
  }

  return [...accessibleWorkspaceKeys];
};

export const isWorkspaceAccessible = (user, workspaceKey) => {
  if (!workspaceKey) return false;
  return getAccessibleWorkspaceKeys(user).includes(workspaceKey);
};

export const resolveWorkspaceKey = (user, pathname = '') => {
  const currentBase = getWorkspaceBaseFromPath(pathname);
  const currentWorkspaceKey = currentBase ? currentBase.slice(1) : null;

  if (currentWorkspaceKey && isWorkspaceAccessible(user, currentWorkspaceKey)) {
    return currentWorkspaceKey;
  }

  const normalizedRole = normalizeUserRole(user);
  return ROLE_WORKSPACE_MAP[normalizedRole] || 'staff';
};

export const resolveWorkspaceMeta = (user, pathname = '') => (
  WORKSPACE_CONFIG[resolveWorkspaceKey(user, pathname)] || WORKSPACE_CONFIG.staff
);

export const getWorkspaceBaseFromPath = (pathname = '') => (
  KNOWN_BASES.find(base => pathname === base || pathname.startsWith(`${base}/`)) || null
);

export const getPreferredWorkspaceBasePath = (user) => resolveWorkspaceMeta(user).defaultBasePath;

export const resolveWorkspaceBasePath = (user, pathname = '') => {
  return getWorkspaceBaseFromPath(pathname) || getPreferredWorkspaceBasePath(user);
};

export const rebaseInternalPath = (path, basePath = '/admin') => {
  if (!path?.startsWith('/admin')) return path;
  return path.replace(/^\/admin/, basePath);
};

export const getWorkspaceHomePath = (user, pathname = '') => resolveWorkspaceMeta(user, pathname).homePath;
