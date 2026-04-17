/**
 * Module Registry — Single source of truth for all system modules & permissions.
 *
 * Khi thêm module mới:
 *   1. Thêm entry vào MODULES array bên dưới
 *   2. Chạy migration INSERT permissions tương ứng vào bảng `permissions`
 *   3. Frontend sẽ tự render sidebar + permission matrix từ registry này
 */

const MODULES = [
  // ─── Tổng quan ───
  {
    key: 'dashboard',
    name: 'Dashboard',
    section: 'Tổng quan',
    path: '/admin',
    icon: 'FiHome',
    sortOrder: 0,
    showInSidebar: true,
    // Dashboard không cần quyền riêng — ai đăng nhập admin đều xem được
    actions: [],
    isPublic: true, // không kiểm tra permission
  },

  // ─── Bán hàng ───
  {
    key: 'invoices',
    name: 'Hóa đơn',
    section: 'Bán hàng',
    path: '/admin/invoices',
    icon: 'FiShoppingBag',
    sortOrder: 10,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'customers',
    name: 'Khách hàng',
    section: 'Bán hàng',
    path: '/admin/customers',
    icon: 'FiUserCheck',
    sortOrder: 11,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'reviews',
    name: 'Đánh giá',
    section: 'Bán hàng',
    path: '/admin/reviews',
    icon: 'FiStar',
    sortOrder: 12,
    showInSidebar: true,
    actions: ['read', 'update', 'delete'],
  },

  // ─── Kho hàng ───
  {
    key: 'products',
    name: 'Sản phẩm',
    section: 'Kho hàng',
    path: '/admin/products',
    icon: 'FiPackage',
    sortOrder: 20,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'brands',
    name: 'Thương hiệu',
    section: 'Kho hàng',
    path: '/admin/brands',
    icon: 'FiTag',
    sortOrder: 21,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'categories',
    name: 'Danh mục',
    section: 'Kho hàng',
    path: '/admin/categories',
    icon: 'FiGrid',
    sortOrder: 22,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'suppliers',
    name: 'Nhà cung cấp',
    section: 'Kho hàng',
    path: '/admin/suppliers',
    icon: 'FiTruck',
    sortOrder: 23,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'imports',
    name: 'Nhập kho',
    section: 'Kho hàng',
    path: '/admin/imports',
    icon: 'FiClipboard',
    sortOrder: 24,
    showInSidebar: true,
    actions: ['read', 'create', 'delete'],
  },

  // ─── Nhân sự ───
  {
    key: 'employees',
    name: 'Nhân viên',
    section: 'Nhân sự',
    path: '/admin/employees',
    icon: 'FiUsers',
    sortOrder: 30,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'positions',
    name: 'Chức vụ',
    section: 'Nhân sự',
    path: '/admin/positions',
    icon: 'FiFileText',
    sortOrder: 31,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'leaves',
    name: 'Duyệt nghỉ phép',
    section: 'Nhân sự',
    path: '/admin/leaves',
    icon: 'FiCalendar',
    sortOrder: 32,
    showInSidebar: true,
    actions: ['read', 'create', 'update'],
  },
  {
    key: 'salaries',
    name: 'Bảng lương',
    section: 'Nhân sự',
    path: '/admin/salaries',
    icon: 'FiDollarSign',
    sortOrder: 33,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },

  // ─── Hệ thống ───
  {
    key: 'reports',
    name: 'Báo cáo',
    section: 'Hệ thống',
    path: '/admin/reports',
    icon: 'FiBarChart2',
    sortOrder: 40,
    showInSidebar: true,
    actions: ['read', 'export'],
  },
  {
    key: 'users',
    name: 'Tài khoản',
    section: 'Hệ thống',
    path: '/admin/users',
    icon: 'FiSettings',
    sortOrder: 41,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
    systemOnly: true,
  },
  {
    key: 'roles',
    name: 'Nhóm quyền',
    section: 'Hệ thống',
    path: '/admin/roles',
    icon: 'FiShield',
    sortOrder: 42,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
    systemOnly: true,
  },
  {
    key: 'settings',
    name: 'Cấu hình',
    section: 'Hệ thống',
    path: '/admin/settings',
    icon: 'FiSettings',
    sortOrder: 43,
    showInSidebar: true,
    actions: ['read', 'update'],
    systemOnly: true,
  },
];

// ─── Action labels (Vietnamese) ───
const ACTION_LABELS = {
  read: 'Xem',
  create: 'Thêm',
  update: 'Sửa',
  delete: 'Xóa',
  export: 'Xuất',
};

// ─── Helper: Get flat permission keys for a module ───
const getModulePermissionKeys = (moduleKey) => {
  const mod = MODULES.find(m => m.key === moduleKey);
  if (!mod) return [];
  return mod.actions.map(action => `${moduleKey}.${action}`);
};

// ─── Helper: Get all permission keys ───
const getAllPermissionKeys = () => {
  const keys = [];
  for (const mod of MODULES) {
    for (const action of mod.actions) {
      keys.push(`${mod.key}.${action}`);
    }
  }
  return keys;
};

// ─── Sections (grouped) for frontend rendering ───
const getSections = () => {
  const sectionMap = new Map();
  for (const mod of MODULES) {
    if (!mod.showInSidebar) continue;
    if (!sectionMap.has(mod.section)) {
      sectionMap.set(mod.section, []);
    }
    sectionMap.get(mod.section).push(mod);
  }
  const sections = [];
  for (const [title, items] of sectionMap) {
    sections.push({ title, items: items.sort((a, b) => a.sortOrder - b.sortOrder) });
  }
  return sections;
};

module.exports = {
  MODULES,
  ACTION_LABELS,
  getModulePermissionKeys,
  getAllPermissionKeys,
  getSections,
};
