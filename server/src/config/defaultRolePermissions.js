const SYSTEM_ROLE_DEFINITIONS = {
  admin: {
    description: 'Quản trị viên hệ thống - toàn quyền',
    permissions: '*'
  },
  manager: {
    description: 'Quản lý - quản lý nhân sự, duyệt đơn, xem báo cáo',
    permissions: [
      'employees.read',
      'employees.create',
      'employees.update',
      'employees.delete',
      'employees.export',
      'positions.read',
      'positions.create',
      'positions.update',
      'positions.delete',
      'leaves.read',
      'leaves.create',
      'leaves.update',
      'attendances.read',
      'attendances.create',
      'attendances.update',
      'attendances.export',
      'promotions.read',
      'promotions.create',
      'promotions.update',
      'promotions.delete',
      'payments.read',
      'payments.update',
      'shipping.read',
      'shipping.update',
      'returns.read',
      'returns.update',
      'salaries.read',
      'salaries.create',
      'salaries.update',
      'salaries.delete',
      'salaries.export',
      'reports.read',
      'reports.export'
    ]
  },
  staff_portal: {
    description: 'Nhan vien tu phuc vu - ho so ca nhan, nghi phep va bang luong',
    permissions: [
      'leaves.read',
      'leaves.create'
    ]
  },
  sales: {
    description: 'Nhan vien kinh doanh - ban hang noi bo, cham soc khach hang va xem bao cao kinh doanh',
    permissions: [
      'invoices.read',
      'invoices.create',
      'invoices.export',
      'customers.read',
      'customers.create',
      'customers.update',
      'customers.export',
      'products.read',
      'shipping.read',
      'returns.read',
      'returns.create',
      'reports.read',
      'reports.export'
    ]
  },
  staff: {
    description: 'Nhan vien ban hang - tao hoa don, quan ly khach hang',
    permissions: [
      'invoices.read',
      'invoices.create',
      'invoices.export',
      'customers.read',
      'customers.create',
      'customers.update',
      'customers.export',
      'products.read',
      'shipping.read',
      'returns.read',
      'returns.create',
      'leaves.read',
      'leaves.create'
    ]
  },
  warehouse: {
    description: 'Thu kho - quan ly nhap kho, kiem kho',
    permissions: [
      'products.read',
      'products.create',
      'products.update',
      'products.delete',
      'products.export',
      'brands.read',
      'brands.create',
      'brands.update',
      'brands.delete',
      'categories.read',
      'categories.create',
      'categories.update',
      'categories.delete',
      'suppliers.read',
      'suppliers.create',
      'suppliers.update',
      'suppliers.delete',
      'imports.read',
      'imports.create',
      'imports.delete',
      'shipping.read',
      'shipping.update',
      'returns.read',
      'reports.read',
      'reports.export',
      'leaves.read',
      'leaves.create'
    ]
  }
};

const SYSTEM_ROLE_NAMES = Object.keys(SYSTEM_ROLE_DEFINITIONS);

const normalizeRoleName = (roleName) => String(roleName || '').trim().toLowerCase();

const getSystemRoleDescription = (roleName) => {
  const normalizedRoleName = normalizeRoleName(roleName);
  return SYSTEM_ROLE_DEFINITIONS[normalizedRoleName]?.description || `System role: ${normalizedRoleName}`;
};

const getDefaultPermissionNamesForRole = (roleName, allPermissionNames = []) => {
  const normalizedRoleName = normalizeRoleName(roleName);
  const config = SYSTEM_ROLE_DEFINITIONS[normalizedRoleName];

  if (!config) {
    return [];
  }

  if (config.permissions === '*') {
    return [...new Set(allPermissionNames)].sort();
  }

  return [...new Set(config.permissions)].sort();
};

module.exports = {
  SYSTEM_ROLE_DEFINITIONS,
  SYSTEM_ROLE_NAMES,
  normalizeRoleName,
  getSystemRoleDescription,
  getDefaultPermissionNamesForRole
};
