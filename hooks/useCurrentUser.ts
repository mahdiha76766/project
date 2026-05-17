import { useEffect, useState } from 'react';
import type { AuthUser } from '@/types/common';

export const useCurrentUser = (): AuthUser | null => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) {
          if (active) setUser(null);
          return;
        }
        const data = await res.json();
        if (active) setUser(data.user ?? null);
      } catch {
        if (active) setUser(null);
      }
    };

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  return user;
};
