'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';

type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function useAdminList<T>(endpoint: string, pageSize = 10) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(
    async (targetPage: number) => {
      setLoading(true);
      setError('');
      const { ok, data, error: fetchError } = await adminFetch<ListResponse<T>>(
        `${endpoint}?page=${targetPage}&limit=${pageSize}`
      );
      setLoading(false);
      if (!ok) {
        setError(fetchError);
        setItems([]);
        return;
      }
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(data.page || targetPage);
    },
    [endpoint, pageSize]
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  return {
    items,
    page,
    setPage,
    totalPages,
    total,
    loading,
    error,
    reload: () => load(page)
  };
}
