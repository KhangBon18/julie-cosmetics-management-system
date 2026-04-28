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
  FiTag, FiGrid, FiUserCheck, FiClipboard, FiShield, FiBarChart2, FiClock
} from 'react-icons/fi';
import { rebaseInternalPath } from '../utils/workspace';

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
    workspaceKeys: ['admin', 'hr', 'warehouse', 'business', 'staff'],
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
    allowedRoles: ['manager', 'staff', 'warehouse', 'employee', 'staff_portal'],
    workspaceKeys: ['hr', 'warehouse', 'business', 'staff'],
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
    allowedRoles: ['manager', 'staff', 'warehouse', 'employee', 'staff_portal'],
    workspaceKeys: ['hr', 'warehouse', 'business', 'staff'],
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
    allowedRoles: ['manager', 'staff', 'warehouse', 'employee', 'staff_portal'],
    workspaceKeys: ['hr', 'warehouse', 'business', 'staff'],
  },
  {
    key: 'my_attendance',
    name: 'Chấm công của tôi',
    section: 'Cá nhân',
    path: '/admin/my-attendance',
    icon: FiClock,
    sortOrder: 4,
    showInSidebar: true,
    actions: [],
    isPublic: true,
    allowedRoles: ['manager', 'staff', 'warehouse', 'employee', 'staff_portal'],
    workspaceKeys: ['hr', 'warehouse', 'business', 'staff'],
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
    workspaceKeys: ['admin', 'business'],
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
    workspaceKeys: ['admin', 'business'],
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
    workspaceKeys: ['admin', 'business'],
  },
  {
    key: 'promotions',
    name: 'Khuyến mãi',
    section: 'Bán hàng',
    path: '/admin/promotions',
    icon: FiTag,
    sortOrder: 13,
    showInSidebar: false,
    actions: ['read', 'create', 'update', 'delete'],
    workspaceKeys: ['admin', 'business'],
  },
  {
    key: 'payments',
    name: 'Thanh toán',
    section: 'Bán hàng',
    path: '/admin/payments',
    icon: FiDollarSign,
    sortOrder: 14,
    showInSidebar: false,
    actions: ['read', 'update'],
    workspaceKeys: ['admin', 'business'],
  },
  {
    key: 'shipping',
    name: 'Vận chuyển',
    section: 'Bán hàng',
    path: '/admin/shipping',
    icon: FiTruck,
    sortOrder: 15,
    showInSidebar: false,
    actions: ['read', 'update'],
    workspaceKeys: ['admin', 'business'],
  },
  {
    key: 'returns',
    name: 'Đổi trả',
    section: 'Bán hàng',
    path: '/admin/returns',
    icon: FiClipboard,
    sortOrder: 16,
    showInSidebar: false,
    actions: ['read', 'create', 'update'],
    workspaceKeys: ['admin', 'business'],
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
    workspaceKeys: ['admin', 'warehouse'],
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
    workspaceKeys: ['admin', 'warehouse'],
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
    workspaceKeys: ['admin', 'warehouse'],
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
    workspaceKeys: ['admin', 'warehouse'],
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
    workspaceKeys: ['admin', 'warehouse'],
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
    workspaceKeys: ['admin', 'hr'],
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
    workspaceKeys: ['admin', 'hr'],
  },
  {
    key: 'leaves',
    name: 'Duyệt nghỉ phép',
    section: 'Nhân sự',
    path: '/admin/leaves',
    icon: FiCalendar,
    sortOrder: 32,
    showInSidebar: true,
    actions: ['read', 'create', 'update'],
    workspaceKeys: ['admin', 'hr'],
  },
  {
    key: 'attendances',
    name: 'Chấm công',
    section: 'Nhân sự',
    path: '/admin/attendances',
    icon: FiClock,
    sortOrder: 33,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
    workspaceKeys: ['admin', 'hr'],
  },
  {
    key: 'salaries',
    name: 'Tính lương',
    section: 'Nhân sự',
    path: '/admin/salaries',
    icon: FiDollarSign,
    sortOrder: 34,
    showInSidebar: true,
    actions: ['read', 'create', 'update', 'delete', 'export'],
    workspaceKeys: ['admin', 'hr'],
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
    workspaceKeys: ['admin', 'hr', 'warehouse', 'business'],
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
    systemOnly: true,
    workspaceKeys: ['admin'],
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
    systemOnly: true,
    workspaceKeys: ['admin'],
  },
  {
    key: 'settings',
    name: 'Cấu hình',
    section: 'Hệ thống',
    path: '/admin/settings',
    icon: FiSettings,
    sortOrder: 43,
    showInSidebar: true,
    actions: ['read', 'update'],
    systemOnly: true,
    workspaceKeys: ['admin'],
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
export const buildSidebarSections = (userPermissions = [], userRole = '', basePath = '/admin', workspaceKey = 'admin') => {
  const normalizedRole = String(userRole || '').trim().toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const permSet = new Set(userPermissions);
  const sectionMap = new Map();

  for (const mod of MODULES) {
    if (!mod.showInSidebar) continue;
    if (mod.workspaceKeys?.length && !mod.workspaceKeys.includes(workspaceKey)) continue;
    if (mod.allowedRoles?.length && !mod.allowedRoles.includes(normalizedRole)) continue;

    // Hide 'Cá nhân' section for admin accounts
    if (isAdmin && mod.section === 'Cá nhân') continue;

    // Admin sees everything; public modules always visible; others need any module permission
    const hasAnyAction = mod.actions?.some(action => permSet.has(`${mod.key}.${action}`));
    const isVisible = isAdmin || mod.isPublic || permSet.has(`${mod.key}.read`) || hasAnyAction;
    if (!isVisible) continue;

    if (!sectionMap.has(mod.section)) {
      sectionMap.set(mod.section, []);
    }
    sectionMap.get(mod.section).push({
      ...mod,
      path: rebaseInternalPath(mod.path, basePath)
    });
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
