'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineDeviceMobile,
  HiOutlineEye,
  HiOutlineGlobeAlt,
  HiOutlineUsers
} from 'react-icons/hi';
import { BsLightningChargeFill } from 'react-icons/bs';
import { AdminChartCard, AdminAreaTrendChart, AdminDonutChart, formatDayLabel, formatDuration } from '@/components/admin/charts/AdminChartKit';
import { AdminLoading, AdminPageBanner, AdminStatCard } from '@/components/admin/AdminUI';
import { adminFetch } from '@/lib/admin/client';
import type { CaptchaSettings } from '@/lib/admin/captcha-settings-config';
import type { AnalyticsSettings } from '@/lib/admin/analytics-settings-config';

type Summary = {
  rangeDays: number;
  totalPageViews: number;
  uniqueVisitors: number;
  uniqueSessions: number;
  activeNow: number;
  avgDurationSec: number;
  trend: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ path: string; title: string; views: number; avgDurationSec: number }>;
  topProducts: Array<{ slug: string; views: number; avgDurationSec: number }>;
  topBlogs: Array<{ slug: string; views: number; avgDurationSec: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  contentTypeBreakdown: Array<{ type: string; count: number }>;
};

type Realtime = {
  activeCount: number;
  activePages: Array<{ path: string; title?: string; contentType?: string; device?: string; durationSec?: number }>;
};

const RANGE_OPTIONS = [
  { value: 7, label: '۷ روز' },
  { value: 14, label: '۱۴ روز' },
  { value: 30, label: '۳۰ روز' },
  { value: 90, label: '۹۰ روز' }
];

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'موبایل',
  desktop: 'دسکتاپ',
  tablet: 'تبلت',
  unknown: 'نامشخص'
};

const CONTENT_LABELS: Record<string, string> = {
  page: 'صفحات',
  product: 'محصولات',
  blog: 'بلاگ',
  category: 'دسته‌بندی',
  checkout: 'تسویه‌حساب',
  dashboard: 'پنل کاربری',
  other: 'سایر'
};

function SettingsPanel({
  analytics,
  captcha,
  onSaved
}: {
  analytics: AnalyticsSettings;
  captcha: CaptchaSettings;
  onSaved: () => void;
}) {
  const [a, setA] = useState(analytics);
  const [c, setC] = useState(captcha);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    setA(analytics);
    setC(captcha);
  }, [analytics, captcha]);

  const save = async () => {
    setSaving(true);
    setMsg('');
    const res = await adminFetch('/api/admin/analytics/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analytics: a, captcha: c })
    });
    setSaving(false);
    if (!res.ok) setMsg(res.error || 'خطا در ذخیره');
    else {
      setMsg('تنظیمات ذخیره شد');
      onSaved();
    }
  };

  const toggle = (key: keyof CaptchaSettings) => setC((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <AdminChartCard title="تنظیمات آمار و کپچا" subtitle="کنترل ردیابی بازدید و فعال‌سازی کپچا" icon={<HiOutlineGlobeAlt />} accent="violet">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-900">آمار بازدید</h4>
          {([
            ['enabled', 'فعال‌سازی ردیابی'],
            ['trackAdmin', 'ردیابی پنل ادمین'],
            ['trackAuthenticated', 'ردیابی کاربران واردشده']
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <span>{label}</span>
              <input type="checkbox" checked={a[key]} onChange={() => setA((p) => ({ ...p, [key]: !p[key] }))} />
            </label>
          ))}
          <label className="block text-xs font-bold text-slate-500">
            نگهداری داده (روز)
            <input
              type="number"
              min={7}
              max={365}
              value={a.retentionDays}
              onChange={(e) => setA((p) => ({ ...p, retentionDays: Number(e.target.value) }))}
              className="site-input mt-1"
            />
          </label>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-900">کپچای ریاضی</h4>
          {([
            ['enabled', 'فعال‌سازی کپچا'],
            ['login', 'ورود با رمز'],
            ['register', 'ثبت‌نام'],
            ['otpSend', 'ارسال OTP'],
            ['comments', 'دیدگاه بلاگ'],
            ['reviews', 'نظر محصول']
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
              <span>{label}</span>
              <input type="checkbox" checked={c[key]} onChange={() => toggle(key)} />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button type="button" onClick={() => void save()} disabled={saving} className="site-btn-primary !rounded-xl">
          {saving ? 'در حال ذخیره...' : 'ذخیره تنظیمات'}
        </button>
        {msg ? <span className="text-sm text-slate-600">{msg}</span> : null}
      </div>
    </AdminChartCard>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState(7);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [realtime, setRealtime] = useState<Realtime | null>(null);
  const [analyticsSettings, setAnalyticsSettings] = useState<AnalyticsSettings | null>(null);
  const [captchaSettings, setCaptchaSettings] = useState<CaptchaSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    const [sumRes, rtRes, setRes] = await Promise.all([
      adminFetch<{ summary: Summary }>(`/api/admin/analytics/summary?range=${range}`),
      adminFetch<{ realtime: Realtime }>('/api/admin/analytics/realtime'),
      adminFetch<{ analytics: AnalyticsSettings; captcha: CaptchaSettings }>('/api/admin/analytics/settings')
    ]);
    if (!sumRes.ok) setError(sumRes.error || 'خطا در آمار');
    else setSummary(sumRes.data?.summary ?? null);
    if (rtRes.ok) setRealtime(rtRes.data?.realtime ?? null);
    if (setRes.ok) {
      setAnalyticsSettings(setRes.data?.analytics ?? null);
      setCaptchaSettings(setRes.data?.captcha ?? null);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void load();
    const id = setInterval(() => {
      void adminFetch<{ realtime: Realtime }>('/api/admin/analytics/realtime').then((res) => {
        if (res.ok) setRealtime(res.data?.realtime ?? null);
      });
    }, 15000);
    return () => clearInterval(id);
  }, [range]);

  const trendData = useMemo(
    () => (summary?.trend || []).map((d) => ({ ...d, label: formatDayLabel(d.date) })),
    [summary?.trend]
  );

  const deviceData = useMemo(
    () => (summary?.deviceBreakdown || []).map((d, i) => ({
      name: DEVICE_LABELS[d.device] || d.device,
      value: d.count,
      color: ['#0ea5e9', '#d97706', '#8b5cf6', '#94a3b8'][i % 4]
    })),
    [summary?.deviceBreakdown]
  );

  const contentData = useMemo(
    () => (summary?.contentTypeBreakdown || []).map((d, i) => ({
      name: CONTENT_LABELS[d.type] || d.type,
      value: d.count,
      color: ['#d97706', '#10b981', '#6366f1', '#f43f5e', '#0ea5e9', '#8b5cf6'][i % 6]
    })),
    [summary?.contentTypeBreakdown]
  );

  return (
    <div>
      <AdminPageBanner
        title="آمار بازدید و رفتار کاربران"
        subtitle="بازدید واقعی، زمان ماندگاری، صفحات پربازدید و کاربران آنلاین"
      />

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard title="بازدید صفحات" value={`${summary.totalPageViews.toLocaleString('fa-IR')}`} hint={`${summary.rangeDays} روز اخیر`} icon={HiOutlineEye} accent="amber" />
            <AdminStatCard title="بازدیدکنندگان یکتا" value={`${summary.uniqueVisitors.toLocaleString('fa-IR')}`} hint={`${summary.uniqueSessions.toLocaleString('fa-IR')} نشست`} icon={HiOutlineUsers} accent="sky" />
            <AdminStatCard title="آنلاین هم‌اکنون" value={`${(realtime?.activeCount ?? summary.activeNow).toLocaleString('fa-IR')}`} hint="۵ دقیقه اخیر" icon={BsLightningChargeFill} accent="emerald" />
            <AdminStatCard title="میانگین ماندگاری" value={formatDuration(summary.avgDurationSec)} icon={HiOutlineClock} accent="violet" />
            <AdminStatCard title="پربازدیدترین نوع" value={CONTENT_LABELS[summary.contentTypeBreakdown[0]?.type] || '—'} icon={HiOutlineChartBar} accent="rose" />
            <AdminStatCard title="دستگاه غالب" value={DEVICE_LABELS[summary.deviceBreakdown[0]?.device] || '—'} icon={HiOutlineDeviceMobile} accent="emerald" />
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${range === opt.value ? 'bg-amber-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminChartCard title="روند بازدید و بازدیدکنندگان" subtitle="نمودار روزانه" icon={<HiOutlineChartBar />} accent="amber">
              <AdminAreaTrendChart
                data={trendData}
                xKey="label"
                series={[
                  { key: 'views', name: 'بازدید', color: '#d97706' },
                  { key: 'visitors', name: 'بازدیدکننده یکتا', color: '#0ea5e9' }
                ]}
              />
            </AdminChartCard>

            <AdminChartCard title="کاربران آنلاین" subtitle="صفحات فعال در لحظه" icon={<BsLightningChargeFill />} accent="emerald">
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {(realtime?.activePages || []).length ? realtime!.activePages.map((p, i) => (
                  <div key={`${p.path}-${i}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{p.title || p.path}</p>
                      <p className="mt-0.5 text-slate-500">{p.path}</p>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                      {formatDuration(p.durationSec || 0)}
                    </span>
                  </div>
                )) : (
                  <p className="py-8 text-center text-sm text-slate-500">کاربر فعالی ثبت نشده</p>
                )}
              </div>
            </AdminChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminChartCard title="توزیع دستگاه" icon={<HiOutlineDeviceMobile />} accent="sky">
              {deviceData.length ? <AdminDonutChart data={deviceData} /> : <p className="text-sm text-slate-500">داده‌ای نیست</p>}
            </AdminChartCard>
            <AdminChartCard title="نوع محتوا" icon={<HiOutlineGlobeAlt />} accent="violet">
              {contentData.length ? <AdminDonutChart data={contentData} /> : <p className="text-sm text-slate-500">داده‌ای نیست</p>}
            </AdminChartCard>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <AdminChartCard title="صفحات پربازدید" accent="amber">
              <div className="space-y-2">
                {summary.topPages.map((p) => (
                  <div key={p.path} className="rounded-xl border border-slate-100 px-3 py-2 text-xs">
                    <p className="font-bold text-slate-800">{p.title}</p>
                    <p className="mt-1 flex justify-between text-slate-500">
                      <span>{p.views.toLocaleString('fa-IR')} بازدید</span>
                      <span>{formatDuration(p.avgDurationSec)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </AdminChartCard>
            <AdminChartCard title="محصولات پربازدید" accent="emerald">
              <div className="space-y-2">
                {summary.topProducts.map((p) => (
                  <div key={p.slug} className="rounded-xl border border-slate-100 px-3 py-2 text-xs">
                    <p className="font-bold text-slate-800">{p.slug}</p>
                    <p className="mt-1 flex justify-between text-slate-500">
                      <span>{p.views.toLocaleString('fa-IR')} بازدید</span>
                      <span>{formatDuration(p.avgDurationSec)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </AdminChartCard>
            <AdminChartCard title="پست‌های پربازدید" accent="violet">
              <div className="space-y-2">
                {summary.topBlogs.map((p) => (
                  <div key={p.slug} className="rounded-xl border border-slate-100 px-3 py-2 text-xs">
                    <p className="font-bold text-slate-800">{p.slug}</p>
                    <p className="mt-1 flex justify-between text-slate-500">
                      <span>{p.views.toLocaleString('fa-IR')} بازدید</span>
                      <span>{formatDuration(p.avgDurationSec)}</span>
                    </p>
                  </div>
                ))}
              </div>
            </AdminChartCard>
          </div>

          {analyticsSettings && captchaSettings ? (
            <SettingsPanel analytics={analyticsSettings} captcha={captchaSettings} onSaved={() => void load()} />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
