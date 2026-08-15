'use client';

import { useEffect, useState } from 'react';
import { DollarSign, Link2, Save } from 'lucide-react';
import { AdminPageBanner } from '@/components/admin/AdminUI';
import { PricePortalAdminHints } from '@/components/price-portal/PricePortalClient';
import { adminFetch } from '@/lib/admin/client';

type Settings = {
  enabled: boolean;
  pathSlug: string;
  hasPassword: boolean;
};

export default function AdminPriceProductPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [pathSlug, setPathSlug] = useState('adminpricego');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [baseUrl, setBaseUrl] = useState('');

  const load = async () => {
    setLoading(true);
    const res = await adminFetch<{ settings: Settings }>('/api/admin/price-portal/settings');
    if (res.ok && res.data?.settings) {
      setSettings(res.data.settings);
      setEnabled(res.data.settings.enabled);
      setPathSlug(res.data.settings.pathSlug);
    }
    setLoading(false);
  };

  useEffect(() => {
    setBaseUrl(window.location.origin);
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const res = await adminFetch<{ settings: Settings }>('/api/admin/price-portal/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled,
        pathSlug,
        password: password || undefined
      })
    });
    setSaving(false);
    if (!res.ok) {
      setError(res.error || 'خطا در ذخیره');
      return;
    }
    setSettings(res.data?.settings ?? null);
    setPassword('');
    setMessage('تنظیمات پورتال قیمت ذخیره شد.');
  };

  return (
    <div className="space-y-6">
      <AdminPageBanner
        title="پورتال لیست قیمت"
        subtitle="آدرس و رمز اختصاصی برای ویرایش سریع قیمت محصولات"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <DollarSign className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-slate-900">تنظیمات دسترسی</h2>
            <p className="text-xs text-slate-500">
              مسیر دلخواه و رمز عبور — بدون محدودیت طول یا فرمت خاص
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">در حال بارگذاری...</p>
        ) : (
          <div className="space-y-5">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm">
              <span className="font-bold">فعال‌سازی پورتال قیمت</span>
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
            </label>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-600">
                <Link2 className="h-3.5 w-3.5" />
                آدرس صفحه (فقط نام مسیر)
              </label>
              <div className="flex items-center gap-2" dir="ltr">
                <span className="shrink-0 rounded-lg bg-slate-100 px-3 py-2.5 text-xs text-slate-500">
                  {baseUrl || 'https://example.com'}/
                </span>
                <input
                  type="text"
                  value={pathSlug}
                  onChange={(e) =>
                    setPathSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/^\/+|\/+$/g, '')
                        .replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  className="site-input flex-1"
                  placeholder="adminpricego"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                فقط حروف انگلیسی کوچک، عدد و خط تیره — مثال: adminpricego
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-600">رمز عبور پورتال</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="site-input"
                placeholder={settings?.hasPassword ? 'خالی بگذارید = بدون تغییر' : 'رمز دلخواه شما'}
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                هر طول و فرمتی مجاز است — برای ورود به صفحه لیست قیمت استفاده می‌شود
              </p>
            </div>

            {baseUrl && pathSlug ? (
              <PricePortalAdminHints pathSlug={pathSlug} baseUrl={baseUrl} />
            ) : null}

            {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            {message ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving}
              className="site-btn-primary inline-flex items-center gap-2 !rounded-xl"
            >
              <Save className="h-4 w-4" />
              {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-bold text-slate-800">راهنما</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs leading-6">
          <li>پس از ذخیره، لینک اختصاصی را کپی کنید و در اختیار مدیر فروشگاه بگذارید.</li>
          <li>در صفحه پورتال فقط نام محصول، وزن‌ها و قیمت‌ها نمایش داده می‌شود.</li>
          <li>با ذخیره هر قیمت، بلافاصله در سایت به‌روزرسانی می‌شود.</li>
        </ul>
      </section>
    </div>
  );
}
