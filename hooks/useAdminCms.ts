'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { defaultSitePageContent, type SitePageContent } from '@/lib/admin/page-content-config';

export function useAdminCms() {
  const [content, setContent] = useState<SitePageContent>(defaultSitePageContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const { ok, data, error: fetchError } = await adminFetch<{ content: SitePageContent }>('/api/admin/site-content');
    if (ok && data.content) setContent(data.content);
    else setError(fetchError);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (partial: Partial<SitePageContent>) => {
    setSaving(true);
    setError('');
    setMessage('');
    const { ok, data, error: saveError } = await adminFetch<{ content: SitePageContent; message?: string }>(
      '/api/admin/site-content',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: partial })
      }
    );
    setSaving(false);
    if (!ok) {
      setError(saveError);
      return false;
    }
    if (data.content) setContent(data.content);
    setMessage(data.message || 'ذخیره شد.');
    return true;
  };

  return { content, setContent, loading, saving, error, message, setError, setMessage, save, reload: load };
}
