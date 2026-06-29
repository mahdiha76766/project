'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SitePageContent } from '@/lib/admin/page-content-config';
import { defaultSitePageContent } from '@/lib/admin/page-content-config';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isContentEditorRole } from '@/lib/auth/client-roles';

type SiteContentContextValue = {
  content: SitePageContent;
  loading: boolean;
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  patchContent: (partial: Partial<SitePageContent>) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);

export function SiteContentProvider({
  children,
  initial
}: {
  children: React.ReactNode;
  initial?: SitePageContent;
}) {
  const user = useCurrentUser();
  const [content, setContent] = useState<SitePageContent>(initial ?? defaultSitePageContent);
  const [loading, setLoading] = useState(!initial);
  const [editMode, setEditMode] = useState(false);

  const isAdmin = isContentEditorRole(user?.role);

  useEffect(() => {
    if (!isAdmin) setEditMode(false);
  }, [isAdmin]);

  useEffect(() => {
    document.body.classList.toggle('site-edit-mode', editMode && isAdmin);
    return () => document.body.classList.remove('site-edit-mode');
  }, [editMode, isAdmin]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/site-content', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.content) setContent(data.content);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initial) void refresh();
  }, [initial, refresh]);

  const patchContent = useCallback(async (partial: Partial<SitePageContent>) => {
    const res = await fetch('/api/admin/site-content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content: partial })
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.content) setContent(data.content);
    return true;
  }, []);

  const value = useMemo(
    () => ({ content, loading, isAdmin, editMode, setEditMode, patchContent, refresh }),
    [content, loading, isAdmin, editMode, patchContent, refresh]
  );

  return <SiteContentContext.Provider value={value}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) throw new Error('useSiteContent must be used within SiteContentProvider');
  return ctx;
}
