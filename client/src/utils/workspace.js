export const resolveWorkspaceMeta = (user) => {
  const permissions = new Set(user?.permissions || []);

  if (user?.role === 'admin') {
    return {
      key: 'admin',
      title: 'Khu Quản trị Admin',
      subtitle: 'Quản trị tài khoản, phân quyền, cấu hình và báo cáo toàn hệ thống',
      defaultBasePath: '/admin'
    };
  }

  if (permissions.has('employees.read') || permissions.has('leaves.read') || permissions.has('salaries.read')) {
    return {
      key: 'hr',
      title: 'Khu Nhân sự',
      subtitle: 'Quản lý hồ sơ, nghỉ phép, nghỉ việc và bảng lương',
      defaultBasePath: '/hr'
    };
  }

  if (permissions.has('imports.read') || permissions.has('suppliers.read') || permissions.has('products.read')) {
    return {
      key: 'warehouse',
      title: 'Khu Kho',
      subtitle: 'Quản lý sản phẩm, nhập kho, nhà cung cấp và tồn kho',
      defaultBasePath: '/warehouse'
    };
  }

  if (permissions.has('invoices.read') || permissions.has('customers.read')) {
    return {
      key: 'business',
      title: 'Khu Kinh doanh',
      subtitle: 'Bán hàng, khách hàng, doanh thu và lợi nhuận',
      defaultBasePath: '/business'
    };
  }

  return {
    key: 'staff',
    title: 'Cổng Nhân viên',
    subtitle: 'Tự phục vụ hồ sơ cá nhân, nghỉ phép và tiền lương',
    defaultBasePath: '/staff'
  };
};

export const resolveWorkspaceBasePath = (user, pathname = '') => {
  const knownBases = ['/admin', '/hr', '/warehouse', '/business', '/staff'];
  const matched = knownBases.find(base => pathname === base || pathname.startsWith(`${base}/`));
  if (matched) return matched;
  return resolveWorkspaceMeta(user).defaultBasePath;
};

export const rebaseInternalPath = (path, basePath = '/admin') => {
  if (!path?.startsWith('/admin')) return path;
  return path.replace(/^\/admin/, basePath);
};

export const getWorkspaceHomePath = (user, pathname = '') => resolveWorkspaceBasePath(user, pathname);
