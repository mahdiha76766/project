import { useMemo } from 'react';
import type { AuthUser } from '@/types/common';

export const useCurrentUser = (): AuthUser | null => {
  return useMemo(() => null, []);
};
