export const USER_ROLES = [
  'CUSTOMER',
  'ADMIN',
  'SUPER_ADMIN',
  'OPERATOR',
  'WAREHOUSE_MANAGER',
  'CONTENT_MANAGER'
] as const;

export type UserRole = (typeof USER_ROLES)[number];
