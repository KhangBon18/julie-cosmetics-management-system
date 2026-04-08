/**
 * Module Registry — Frontend mirror of server config.
 * Single source of truth for sidebar rendering and permission checks.
 *
 * Khi thêm module mới:
 *   1. Thêm entry ở đây
 *   2. Thêm entry tương ứng trong server/src/config/moduleRegistry.js
 *   3. Chạy migration INSERT permissions
 */
import {
  FiHome, FiUsers, FiPackage, FiShoppingBag, FiTruck,
  FiFileText, FiDollarSign, FiCalendar, FiStar, FiSettings, FiUser,
  FiTag, FiGrid, FiUserCheck, FiClipboard, FiShield, FiBarChart2
} from 'react-icons/fi';

const MODULES = [
  // ─── Tổng quan ───
  {
    key: 'dashboard',
    name: 'Dashboard',
    section: 'Tổng quan',
    path: '/admin',
    icon: FiHome,
    sortOrder: 0,
    showInSidebar: true,
    actions: [],
    isPublic: true,
  },

  // ─── Cá nhân ───
  {
    key: 'my_profile',
    name: 'Hồ sơ của tôi',
    section: 'Cá nhân',
    path: '/admin/profile',
    icon: FiUser,
    sortOrder: 1,
    showInSidebar: true,
    actions: [],
    isPublic: true,
  },
  {
    key: 'my_leaves',
    name: 'Nghỉ phép',
    section: 'Cá nhân',
    path: '/admin/my-leaves',
    icon: FiCalendar,
    sortOrder: 2,
    showInSidebar: true,
    actions: [],
    isPublic: true,
  },
  {
    key: 'my_salary',
    name: 'Bảng lương',
    section: 'Cá nhân',
    path: '/admin/my-salary',
    icon: FiDollarSign,
    sortOrder: 3,
    showInSidebar: true,
    actions: [],
    isPublic: true,
  },

  // ─── Bán hàng ───
  {
    key: 'invoices',
    name: 'Hóa đơn',
    section: 'Bán hàng',
    path: '/admin/invoices',
    icon: FiShoppingBag,
    sortOrder: 10,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'customers',
    name: 'Khách hàng',
    section: 'Bán hàng',
    path: '/admin/customers',
    icon: FiUserCheck,
    sortOrder: 11,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'reviews',
    name: 'Đánh giá',
    section: 'Bán hàng',
    path: '/admin/reviews',
    icon: FiStar,
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
    icon: FiPackage,
    sortOrder: 20,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'brands',
    name: 'Thương hiệu',
    section: 'Kho hàng',
    path: '/admin/brands',
    icon: FiTag,
    sortOrder: 21,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'categories',
    name: 'Danh mục',
    section: 'Kho hàng',
    path: '/admin/categories',
    icon: FiGrid,
    sortOrder: 22,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'suppliers',
    name: 'Nhà cung cấp',
    section: 'Kho hàng',
    path: '/admin/suppliers',
    icon: FiTruck,
    sortOrder: 23,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'imports',
    name: 'Nhập kho',
    section: 'Kho hàng',
    path: '/admin/imports',
    icon: FiClipboard,
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
    icon: FiUsers,
    sortOrder: 30,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
  },
  {
    key: 'positions',
    name: 'Chức vụ',
    section: 'Nhân sự',
    path: '/admin/positions',
    icon: FiFileText,
    sortOrder: 31,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'leaves',
    name: 'Nghỉ phép',
    section: 'Nhân sự',
    path: '/admin/leaves',
    icon: FiCalendar,
    sortOrder: 32,
    showInSidebar: true,
    actions: ['read', 'create', 'update'],
  },
  {
    key: 'salaries',
    name: 'Bảng lương',
    section: 'Nhân sự',
    path: '/admin/salaries',
    icon: FiDollarSign,
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
    icon: FiBarChart2,
    sortOrder: 40,
    showInSidebar: true,
    actions: ['read', 'export'],
  },
  {
    key: 'users',
    name: 'Tài khoản',
    section: 'Hệ thống',
    path: '/admin/users',
    icon: FiSettings,
    sortOrder: 41,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
  {
    key: 'roles',
    name: 'Nhóm quyền',
    section: 'Hệ thống',
    path: '/admin/roles',
    icon: FiShield,
    sortOrder: 42,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete'],
  },
];

// Action labels (Vietnamese)
export const ACTION_LABELS = {
  read: 'Xem',
  create: 'Thêm',
  update: 'Sửa',
  delete: 'Xóa',
  export: 'Xuất',
};

/**
 * Build sidebar sections from module registry, filtered by user permissions.
 * @param {string[]} userPermissions — array of permission_name strings
 * @param {string} userRole — user's role ENUM ('admin', 'manager', 'staff', etc.)
 * @returns {Array<{title, items[]}>}
 */
export const buildSidebarSections = (userPermissions = [], userRole = '') => {
  const isAdmin = userRole === 'admin';
  const permSet = new Set(userPermissions);
  const sectionMap = new Map();

  for (const mod of MODULES) {
    if (!mod.showInSidebar) continue;

    // Hide 'Cá nhân' section for admin accounts
    if (isAdmin && mod.section === 'Cá nhân') continue;

    // Admin sees everything; public modules always visible; others need module.read permission
    const isVisible = isAdmin || mod.isPublic || permSet.has(`${mod.key}.read`);
    if (!isVisible) continue;

    if (!sectionMap.has(mod.section)) {
      sectionMap.set(mod.section, []);
    }
    sectionMap.get(mod.section).push(mod);
  }

  const sections = [];
  for (const [title, items] of sectionMap) {
    sections.push({
      title,
      items: items.sort((a, b) => a.sortOrder - b.sortOrder),
    });
  }
  return sections;
};

/**
 * Get modules that have permission actions (for permission matrix).
 */
export const getPermissionModules = () => {
  return MODULES.filter(m => m.actions.length > 0);
};

export default MODULES;
