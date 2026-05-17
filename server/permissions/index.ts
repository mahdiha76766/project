import { USER_ROLES, type UserRole } from '@/constants/roles';

const roleWeight: Record<UserRole, number> = {
  CUSTOMER: 1,
  OPERATOR: 2,
  CONTENT_MANAGER: 2,
  WAREHOUSE_MANAGER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4
};

export const hasMinimumRole = (current: UserRole, required: UserRole): boolean => {
  return roleWeight[current] >= roleWeight[required];
};

export const isValidRole = (role: string): role is UserRole => {
  return USER_ROLES.includes(role as UserRole);
};
