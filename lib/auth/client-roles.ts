import type { UserRole } from '@/constants/roles';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'];

export function isContentEditorRole(role?: UserRole | string | null) {
  return Boolean(role && ADMIN_ROLES.includes(role as UserRole));
}

export function isAdminPanelRole(role?: UserRole | string | null) {
  return isContentEditorRole(role);
}

export function canManageCatalog(role?: UserRole | string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function canManageUsers(role?: UserRole | string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function canManageCommerce(role?: UserRole | string | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function roleLabelFa(role?: string | null) {
  if (role === 'SUPER_ADMIN') return 'مدیر ارشد';
  if (role === 'ADMIN') return 'مدیر';
  if (role === 'CONTENT_MANAGER') return 'ویراستار';
  if (role === 'OPERATOR') return 'اپراتور';
  if (role === 'WAREHOUSE_MANAGER') return 'انباردار';
  if (role === 'CUSTOMER') return 'کاربر';
  return role || 'کاربر';
}
