'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AdminAlert, AdminCard, AdminPageHeader } from '@/components/admin/ui';
import { AdminConfirmDialog } from '@/components/admin/AdminConfirmDialog';
import { adminFetch } from '@/lib/admin/client';
import type { SalesConfig } from '@/lib/commerce/sales-types';
import { defaultSalesConfig } from '@/lib/commerce/sales-types';

export default function AdminSalesSettingsPage() {
  const [config, setConfig] = useState<SalesConfig>(defaultSalesConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmOff, setConfirmOff] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await adminFetch<{ config: SalesConfig }>('/api/admin/sales');
    if (!res.ok) setError(res.error);
    else if (res.data.config) setConfig(res.data.config);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const persist = async (next: Pick<SalesConfig, 'salesEnabled' | 'showPricesWhenSalesDisabled'>) => {
    setSaving(true);
    setError('');
    setMessage('');
    const res = await adminFetch<{ config: SalesConfig; message?: string }>('/api/admin/sales', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'ذخیره انجام نشد.');
      return;
    }
    if (res.data.config) setConfig(res.data.config);
    setMessage(res.data.message || 'تنظیمات فروش ذخیره شد.');
  };

  const toggleSales = () => {
    if (config.salesEnabled) {
      setConfirmOff(true);
      return;
    }
    void persist({ salesEnabled: true, showPricesWhenSalesDisabled: config.showPricesWhenSalesDisabled });
  };

  const lastChanged = config.updatedAt
    ? new Date(config.updatedAt).toLocaleString('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  if (loading) return <p className="text-sm text-surface-500">در حال بارگذاری تنظیمات فروش...</p>;

  return (
    <main className="space-y-6">
      <AdminPageHeader
        title="تنظیمات فروش"
        description="کنترل سراسری فروش آنلاین روی کل سایت عمومی. این مقدار در پایگاه داده ذخیره می‌شود."
      />
      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <AdminCard title="وضعیت فروش آنلاین">
        <div className={`rounded-[1.5rem] border p-6 ${config.salesEnabled ? 'border-brand-200 bg-brand-50/50' : 'border-paper-200 bg-paper-100'}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-gold-600">ONLINE SALES</p>
              <h2 className="mt-2 text-2xl font-black text-ink-900">
                {config.salesEnabled ? 'فروش آنلاین فعال است' : 'فروش آنلاین غیرفعال است'}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-8 text-surface-500">
                {config.salesEnabled
                  ? 'کاربران می‌توانند محصولات را به سبد خرید اضافه کرده و سفارش ثبت کنند.'
                  : 'سایت در حالت معرفی محصولات قرار دارد و قابلیت‌های خرید برای کاربران نمایش داده نمی‌شود.'}
              </p>
              {lastChanged ? <p className="mt-3 text-xs text-surface-400">آخرین تغییر: {lastChanged}</p> : null}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={config.salesEnabled}
              disabled={saving}
              onClick={toggleSales}
              className={`relative h-9 w-16 rounded-full transition ${config.salesEnabled ? 'bg-ink-900' : 'bg-paper-300'}`}
            >
              <span className={`absolute top-1 h-7 w-7 rounded-full bg-paper-50 transition ${config.salesEnabled ? 'start-8' : 'start-1'}`} />
            </button>
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-[1.25rem] border border-paper-200 p-4 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={config.showPricesWhenSalesDisabled}
            disabled={saving}
            onChange={(e) =>
              void persist({
                salesEnabled: config.salesEnabled,
                showPricesWhenSalesDisabled: e.target.checked
              })
            }
          />
          <span>
            <strong className="block text-ink-900">نمایش قیمت در حالت کاتالوگ</strong>
            <span className="mt-1 block text-surface-500">
              اگر فروش خاموش باشد، به‌صورت پیش‌فرض قیمت‌ها هم مخفی هستند. با فعال کردن این گزینه فقط قیمت نمایش داده می‌شود، نه دکمه‌های خرید.
            </span>
          </span>
        </label>
      </AdminCard>

      <AdminConfirmDialog
        open={confirmOff}
        title="غیرفعال کردن فروش آنلاین"
        description="با غیرفعال کردن فروش آنلاین، تمام قابلیت‌های خرید، سبد خرید، ثبت سفارش و پرداخت در سایت عمومی غیرفعال خواهند شد. ادامه می‌دهید؟"
        confirmLabel="غیرفعال کردن"
        cancelLabel="انصراف"
        loading={saving}
        onClose={() => setConfirmOff(false)}
        onConfirm={() => {
          setConfirmOff(false);
          void persist({ salesEnabled: false, showPricesWhenSalesDisabled: config.showPricesWhenSalesDisabled });
        }}
      />

      <p className="text-xs text-surface-400">
        سفارش‌ها و پرداخت‌های قبلی حذف نمی‌شوند. برای مشاهده تاریخچه به{' '}
        <Link href="/admin/orders" className="font-bold text-ink-800">سفارش‌ها</Link> بروید.
      </p>
    </main>
  );
}
