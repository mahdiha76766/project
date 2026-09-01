'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminFetch } from '@/lib/admin/client';
import type { SalesConfig } from '@/lib/commerce/sales-types';

export function AdminSalesStatusBanner({ canManage }: { canManage: boolean }) {
  const [config, setConfig] = useState<SalesConfig | null>(null);

  useEffect(() => {
    if (!canManage) return;
    void adminFetch<{ config: SalesConfig }>('/api/admin/sales').then((res) => {
      if (res.ok && res.data.config) setConfig(res.data.config);
    });
  }, [canManage]);

  if (!canManage || !config || config.salesEnabled) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.5rem] border border-gold-200 bg-paper-50 p-5">
      <div>
        <p className="text-sm font-black text-ink-900">فروش آنلاین غیرفعال است</p>
        <p className="mt-1 text-xs text-surface-500">سایت عمومی در حالت کاتالوگ است. سفارش‌های قبلی همچنان قابل مشاهده‌اند.</p>
      </div>
      <Link href="/admin/settings/sales" className="ph-btn-primary !py-2 !text-xs">
        فعال کردن فروش
      </Link>
    </div>
  );
}
