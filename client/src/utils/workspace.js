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
    homePath: '/hr/employees'
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

export const normalizeUserRole = (user) => String(user?.role_name || user?.role || '')
  .trim()
  .toLowerCase();

export const resolveWorkspaceKey = (user) => {
  const normalizedRole = normalizeUserRole(user);
  return ROLE_WORKSPACE_MAP[normalizedRole] || 'staff';
};

export const resolveWorkspaceMeta = (user) => WORKSPACE_CONFIG[resolveWorkspaceKey(user)] || WORKSPACE_CONFIG.staff;

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

export const getWorkspaceHomePath = (user) => resolveWorkspaceMeta(user).homePath;
