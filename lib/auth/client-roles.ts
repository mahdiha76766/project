import type { UserRole } from '@/constants/roles';

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN', 'CONTENT_MANAGER'];

export function isContentEditorRole(role?: UserRole | string | null) {
  return Boolean(role && ADMIN_ROLES.includes(role as UserRole));
}
