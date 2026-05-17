import type { UserRole } from '@/constants/roles';

export interface SeoMeta {
  title?: string;
  description?: string;
  keywords?: string[];
}

export interface AuthUser {
  id: string;
  role: UserRole;
  mobile?: string;
}
