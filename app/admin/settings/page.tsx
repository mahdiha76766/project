'use client';

import { useEffect, useState } from 'react';
import { Globe, Save, Search } from 'lucide-react';
import {
  AdminAlert,
  AdminCard,
  AdminCheckbox,
  AdminPageHeader,
  AdminPrimaryButton,
  AdminSingleImageUploader,
  FieldLabel,
  TextArea,
  TextInput
} from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin/client';
import type { SiteSeoSettings } from '@/lib/admin/site-settings-config';
import { defaultSiteSeoSettings } from '@/lib/admin/site-settings-config';

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSeoSettings>(defaultSiteSeoSettings);
  const [keywordsText, setKeywordsText] = useState(defaultSiteSeoSettings.keywords.join('، '));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    const res = await adminFetch<{ settings: SiteSeoSettings }>('/api/admin/settings/seo');
    if (!res.ok) setError(res.error);
    else if (res.data?.settings) {
      setForm(res.data.settings);
      setKeywordsText(res.data.settings.keywords.join('، '));
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    const keywords = keywordsText
      .split(/[,،]/)
      .map((k) => k.trim())
      .filter(Boolean);
    const payload = { ...form, keywords };
    const res = await adminFetch<{ settings?: SiteSeoSettings }>('/api/admin/settings/seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: payload })
    });
    setSaving(false);
    if (!res.ok) setError(res.error || 'ذخیره ناموفق بود');
    else {
      setMessage('تنظیمات سئو و سایت با موفقیت ذخیره شد.');
      if (res.data.settings) setForm(res.data.settings);
    }
  };

  if (loading) return <p className="text-sm text-slate-500">در حال بارگذاری تنظیمات...</p>;

  return (
    <main className="space-y-6">
      <AdminPageHeader
        title="تنظیمات سایت و سئو"
        description="عنوان، توضیحات، کلمات کلیدی، favicon و کدهای گوگل — مستقیماً روی صفحه اصلی و متاتگ‌ها اعمال می‌شود"
      />

      {error ? <AdminAlert tone="error">{error}</AdminAlert> : null}
      {message ? <AdminAlert tone="success">{message}</AdminAlert> : null}

      <AdminCard title="اطلاعات اصلی سایت">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel text="نام سایت" />
            <TextInput value={form.siteName} onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
          </div>
          <div>
            <FieldLabel text="آدرس پایه (Canonical)" />
            <TextInput
              dir="ltr"
              className="text-left"
              value={form.canonicalBaseUrl}
              onChange={(e) => setForm({ ...form, canonicalBaseUrl: e.target.value })}
              placeholder="https://nabsara.ir"
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel text="عنوان اصلی (Title)" />
            <TextInput value={form.siteTitle} onChange={(e) => setForm({ ...form, siteTitle: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <FieldLabel text="توضیحات متا (Description)" />
            <TextArea
              rows={3}
              value={form.siteDescription}
              onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <FieldLabel text="کلمات کلیدی (با ویرگول یا ، جدا کنید)" />
            <TextArea
              rows={2}
              value={keywordsText}
              onChange={(e) => setKeywordsText(e.target.value)}
              placeholder="روغن طبیعی، ادویه، عطاری آنلاین"
            />
            <p className="mt-1 text-xs text-slate-500">این کلمات در صفحه اصلی و متاتگ keywords نمایش داده می‌شوند.</p>
          </div>
        </div>
      </AdminCard>

      <AdminCard title="تصاویر و آیکون">
        <div className="grid gap-6 md:grid-cols-2">
          <AdminSingleImageUploader
            label="Favicon / آیکون سایت"
            folder="banners"
            value={form.faviconUrl}
            onChange={(url) => setForm({ ...form, faviconUrl: url })}
            hint="پیشنهاد: PNG مربعی ۳۲×۳۲ یا ۱۹۲×۱۹۲"
          />
          <AdminSingleImageUploader
            label="تصویر Open Graph (اشتراک در شبکه‌ها)"
            folder="banners"
            value={form.ogImageUrl}
            onChange={(url) => setForm({ ...form, ogImageUrl: url })}
            hint="پیشنهاد: ۱۲۰۰×۶۳۰ پیکسل"
          />
        </div>
      </AdminCard>

      <AdminCard title="گوگل و ابزارهای ردیابی">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel text="Google Site Verification" />
            <TextInput
              dir="ltr"
              className="text-left text-sm"
              value={form.googleSiteVerification}
              onChange={(e) => setForm({ ...form, googleSiteVerification: e.target.value })}
              placeholder="کد تأیید مالکیت از Search Console"
            />
          </div>
          <div>
            <FieldLabel text="Google Analytics ID (GA4)" />
            <TextInput
              dir="ltr"
              className="text-left text-sm"
              value={form.googleAnalyticsId}
              onChange={(e) => setForm({ ...form, googleAnalyticsId: e.target.value })}
              placeholder="G-XXXXXXXXXX"
            />
          </div>
          <div>
            <FieldLabel text="Google Tag Manager ID" />
            <TextInput
              dir="ltr"
              className="text-left text-sm"
              value={form.googleTagManagerId}
              onChange={(e) => setForm({ ...form, googleTagManagerId: e.target.value })}
              placeholder="GTM-XXXXXXX"
            />
          </div>
          <div>
            <FieldLabel text="Bing Site Verification" />
            <TextInput
              dir="ltr"
              className="text-left text-sm"
              value={form.bingSiteVerification}
              onChange={(e) => setForm({ ...form, bingSiteVerification: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <AdminCheckbox
              checked={form.robotsIndex}
              onChange={(checked) => setForm({ ...form, robotsIndex: checked })}
              label="اجازه ایندکس توسط موتورهای جستجو (robots index)"
            />
          </div>
        </div>
      </AdminCard>

      <AdminCard title="سازمان و شبکه‌های اجتماعی">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <FieldLabel text="نام سازمان (Schema.org)" />
            <TextInput value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
          </div>
          <div>
            <FieldLabel text="تلفن سازمان" />
            <TextInput dir="ltr" className="text-left" value={form.organizationPhone} onChange={(e) => setForm({ ...form, organizationPhone: e.target.value })} />
          </div>
          <div>
            <FieldLabel text="Twitter / X Handle" />
            <TextInput dir="ltr" className="text-left" value={form.twitterHandle} onChange={(e) => setForm({ ...form, twitterHandle: e.target.value })} placeholder="@shop" />
          </div>
        </div>
      </AdminCard>

      <div className="flex flex-wrap gap-3">
        <AdminPrimaryButton onClick={save} disabled={saving}>
          <Save className="h-4 w-4" />
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </AdminPrimaryButton>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          <Globe className="h-4 w-4" />
          مشاهده صفحه اصلی
        </a>
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 text-sm font-bold text-sky-700"
        >
          <Search className="h-4 w-4" />
          Google Search Console
        </a>
      </div>
    </main>
  );
}
