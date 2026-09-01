import { USER_ROLES, type UserRole } from '@/constants/roles';

const roleWeight: Record<UserRole, number> = {
  CUSTOMER: 1,
  OPERATOR: 2,
  CONTENT_MANAGER: 2,
  WAREHOUSE_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

export type AdminCapability = 'panel' | 'content' | 'catalog' | 'users' | 'commerce' | 'system';

const ADMIN_PANEL_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER'];

export const hasMinimumRole = (current: UserRole, required: UserRole): boolean => {
  return roleWeight[current] >= roleWeight[required];
};

export const isValidRole = (role: string): role is UserRole => {
  return USER_ROLES.includes(role as UserRole);
};

export function canAccessAdminPanel(role?: UserRole | string | null): boolean {
  return Boolean(role && ADMIN_PANEL_ROLES.includes(role as UserRole));
}

export function roleHasCapability(
  role: UserRole | string | undefined | null,
  capability: AdminCapability
): boolean {
  if (!role) return false;
  if (role === 'SUPER_ADMIN') return true;
  if (role === 'ADMIN') return true;
  if (role === 'CONTENT_MANAGER') {
    return capability === 'panel' || capability === 'content';
  }
  return false;
}
