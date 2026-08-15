'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin/client';
import { buildAdminListUrl } from '@/lib/admin/list-search';

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
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPage(1);
  }, []);

  const load = useCallback(
    async (targetPage: number, q: string) => {
      setLoading(true);
      setError('');
      const url = buildAdminListUrl(endpoint, targetPage, pageSize, q || undefined);
      const { ok, data, error: fetchError } = await adminFetch<ListResponse<T>>(url);
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
    void load(page, debouncedSearch);
  }, [load, page, debouncedSearch]);

  return {
    items,
    page,
    setPage,
    search,
    setSearch,
    totalPages,
    total,
    loading,
    error,
    reload: () => load(page, debouncedSearch)
  };
}
