import { cookies } from 'next/headers';
import { verifyToken } from './token';
import type { UserRole } from '@/constants/roles';

export interface SessionUser { userId: string; role: UserRole; mobile: string }

export const getSessionUser = async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get('session_token')?.value;
  if (!raw) return null;
  return verifyToken<SessionUser>(raw);
};
