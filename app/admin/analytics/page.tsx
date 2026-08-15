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
import {
  AdminChartCard,
  AdminAreaTrendChart,
  AdminBarTrendChart,
  AdminDonutChart,
  formatDayLabel,
  formatDuration,
  CHART_COLORS
} from '@/components/admin/charts/AdminChartKit';
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
  weeklyTrend: Array<{ week: string; label: string; views: number; visitors: number }>;
  monthlyTrend: Array<{ month: string; label: string; views: number; visitors: number }>;
  hourlyTrend: Array<{ hour: string; label: string; activeUsers: number; sessions: number }>;
  topPages: Array<{ path: string; title: string; views: number; avgDurationSec: number }>;
  topProducts: Array<{ slug: string; title: string; views: number; avgDurationSec: number }>;
  topBlogs: Array<{ slug: string; title: string; views: number; avgDurationSec: number }>;
  deviceBreakdown: Array<{ device: string; count: number }>;
  browserBreakdown: Array<{ name: string; count: number }>;
  osBreakdown: Array<{ name: string; count: number }>;
  deviceDetailBreakdown: Array<{
    label: string;
    deviceType: string;
    browser: string;
    os: string;
    vendor: string;
    model: string;
    screen: string;
    count: number;
  }>;
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
] as const;

const TREND_TABS = [
  { id: 'daily' as const, label: 'روزانه' },
  { id: 'weekly' as const, label: 'هفتگی' },
  { id: 'monthly' as const, label: 'ماهانه' }
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

const TOP_LIST_CLASS = 'max-h-64 space-y-2 overflow-y-auto pr-1';

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

function TopListItem({
  title,
  subtitle,
  views,
  duration
}: {
  title: string;
  subtitle?: string;
  views: number;
  duration: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2 text-xs">
      <p className="line-clamp-2 font-bold text-slate-800">{title}</p>
      {subtitle ? <p className="mt-0.5 truncate text-[10px] text-slate-400">{subtitle}</p> : null}
      <p className="mt-1 flex justify-between text-slate-500">
        <span>{views.toLocaleString('fa-IR')} بازدید</span>
        <span>{formatDuration(duration)}</span>
      </p>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [range, setRange] = useState(7);
  const [trendTab, setTrendTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
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

  const dailyTrendData = useMemo(
    () => (summary?.trend || []).map((d) => ({ ...d, label: formatDayLabel(d.date) })),
    [summary?.trend]
  );

  const trendChartData = useMemo(() => {
    if (!summary) return [];
    if (trendTab === 'weekly') return summary.weeklyTrend.map((w) => ({ ...w, label: w.label }));
    if (trendTab === 'monthly') return summary.monthlyTrend.map((m) => ({ ...m, label: m.label }));
    return dailyTrendData;
  }, [summary, trendTab, dailyTrendData]);

  const hourlyData = useMemo(() => summary?.hourlyTrend || [], [summary?.hourlyTrend]);

  const deviceData = useMemo(
    () => (summary?.deviceBreakdown || []).map((d, i) => ({
      name: DEVICE_LABELS[d.device] || d.device,
      value: d.count,
      color: CHART_COLORS[i % CHART_COLORS.length]
    })),
    [summary?.deviceBreakdown]
  );

  const contentData = useMemo(
    () => (summary?.contentTypeBreakdown || []).map((d, i) => ({
      name: CONTENT_LABELS[d.type] || d.type,
      value: d.count,
      color: CHART_COLORS[i % CHART_COLORS.length]
    })),
    [summary?.contentTypeBreakdown]
  );

  const browserData = useMemo(
    () => (summary?.browserBreakdown || []).map((d, i) => ({
      name: d.name,
      value: d.count,
      color: CHART_COLORS[i % CHART_COLORS.length]
    })),
    [summary?.browserBreakdown]
  );

  const osData = useMemo(
    () => (summary?.osBreakdown || []).map((d, i) => ({
      name: d.name,
      value: d.count,
      color: CHART_COLORS[i % CHART_COLORS.length]
    })),
    [summary?.osBreakdown]
  );

  return (
    <div className="space-y-6">
      <AdminPageBanner
        title="آمار بازدید و رفتار کاربران"
        subtitle="بازدید واقعی بر اساس IP و مرورگر — بدون شمارش تکراری بستن/باز کردن"
      />

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard title="بازدید صفحات" value={`${summary.totalPageViews.toLocaleString('fa-IR')}`} hint={`${summary.rangeDays} روز اخیر`} icon={HiOutlineEye} accent="amber" />
            <AdminStatCard title="بازدیدکنندگان یکتا" value={`${summary.uniqueVisitors.toLocaleString('fa-IR')}`} hint="بر اساس IP + مرورگر" icon={HiOutlineUsers} accent="sky" />
            <AdminStatCard title="آنلاین هم‌اکنون" value={`${(realtime?.activeCount ?? summary.activeNow).toLocaleString('fa-IR')}`} hint="۵ دقیقه اخیر" icon={BsLightningChargeFill} accent="emerald" />
            <AdminStatCard title="میانگین ماندگاری" value={formatDuration(summary.avgDurationSec)} icon={HiOutlineClock} accent="violet" />
            <AdminStatCard title="نشست‌ها" value={`${summary.uniqueSessions.toLocaleString('fa-IR')}`} hint="بازه ۳۰ دقیقه‌ای" icon={HiOutlineChartBar} accent="rose" />
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

          {/* Trend charts with tabs */}
          <AdminChartCard
            title="روند بازدید"
            subtitle="روزانه · هفتگی · ماهانه"
            icon={<HiOutlineChartBar />}
            accent="amber"
            action={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
                {TREND_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTrendTab(tab.id)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${trendTab === tab.id ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            }
          >
            <AdminAreaTrendChart
              data={trendChartData}
              xKey="label"
              series={[
                { key: 'views', name: 'بازدید', color: '#d97706' },
                { key: 'visitors', name: 'بازدیدکننده یکتا', color: '#0ea5e9' }
              ]}
            />
          </AdminChartCard>

          <div className="grid gap-4 xl:grid-cols-2">
            <AdminChartCard title="کاربران آنلاین — ۲۴ ساعت گذشته" subtitle="تعداد بازدیدکننده یکتا در هر ساعت" icon={<BsLightningChargeFill />} accent="emerald">
              <AdminBarTrendChart
                data={hourlyData}
                xKey="label"
                yKey="activeUsers"
                name="کاربر فعال"
                color="#10b981"
                height={260}
              />
            </AdminChartCard>

            <AdminChartCard title="کاربران آنلاین" subtitle="صفحات فعال در لحظه" icon={<BsLightningChargeFill />} accent="sky">
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {(realtime?.activePages || []).length ? realtime!.activePages.slice(0, 12).map((p, i) => (
                  <div key={`${p.path}-${i}`} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-800">{p.title || p.path}</p>
                      <p className="mt-0.5 truncate text-slate-500">{p.path}{p.device ? ` · ${p.device}` : ''}</p>
                    </div>
                    <span className="mr-2 shrink-0 rounded-lg bg-emerald-50 px-2 py-1 font-bold text-emerald-700">
                      {formatDuration(p.durationSec || 0)}
                    </span>
                  </div>
                )) : (
                  <p className="py-8 text-center text-sm text-slate-500">کاربر فعالی ثبت نشده</p>
                )}
              </div>
            </AdminChartCard>
          </div>

          {/* Device distribution - detailed */}
          <div className="grid gap-4 xl:grid-cols-2">
            <AdminChartCard title="مرورگرها" icon={<HiOutlineGlobeAlt />} accent="sky">
              {browserData.length ? <AdminDonutChart data={browserData} height={220} /> : <p className="text-sm text-slate-500">داده‌ای نیست</p>}
            </AdminChartCard>
            <AdminChartCard title="سیستم‌عامل" icon={<HiOutlineDeviceMobile />} accent="violet">
              {osData.length ? <AdminDonutChart data={osData} height={220} /> : <p className="text-sm text-slate-500">داده‌ای نیست</p>}
            </AdminChartCard>
          </div>

          <AdminChartCard
            title="جزئیات دستگاه‌ها"
            subtitle={`حداکثر ${summary.deviceDetailBreakdown.length} مورد · مرورگر · سیستم‌عامل · مدل · رزولوشن`}
            icon={<HiOutlineDeviceMobile />}
            accent="emerald"
          >
            {summary.deviceDetailBreakdown.length ? (
              <div className={`${TOP_LIST_CLASS} overflow-x-auto`}>
                <table className="w-full min-w-[520px] text-xs">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-slate-100 text-right text-slate-500">
                      <th className="px-3 py-2 font-bold">دستگاه</th>
                      <th className="px-3 py-2 font-bold">نوع</th>
                      <th className="px-3 py-2 font-bold">صفحه‌نمایش</th>
                      <th className="px-3 py-2 font-bold">بازدید</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.deviceDetailBreakdown.map((d, i) => (
                      <tr key={`${d.label}-${i}`} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-3 py-2.5">
                          <p className="font-bold text-slate-800">{d.label}</p>
                          {d.vendor || d.model ? (
                            <p className="mt-0.5 text-[10px] text-slate-400">{[d.vendor, d.model].filter(Boolean).join(' ')}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{DEVICE_LABELS[d.deviceType] || d.deviceType}</td>
                        <td className="px-3 py-2.5 text-slate-500">{d.screen || '—'}</td>
                        <td className="px-3 py-2.5 font-black text-slate-900">{d.count.toLocaleString('fa-IR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {deviceData.length ? <AdminDonutChart data={deviceData} height={200} /> : null}
                {contentData.length ? <AdminDonutChart data={contentData} height={200} /> : null}
                {!deviceData.length && !contentData.length ? <p className="text-sm text-slate-500">داده‌ای نیست — پس از ثبت بازدید واقعی نمایش داده می‌شود</p> : null}
              </div>
            )}
          </AdminChartCard>

          {/* Top lists with scroll limit */}
          <div className="grid gap-4 xl:grid-cols-3">
            <AdminChartCard title="صفحات پربازدید" accent="amber" subtitle={`حداکثر ${summary.topPages.length} مورد`}>
              <div className={TOP_LIST_CLASS}>
                {summary.topPages.length ? summary.topPages.map((p) => (
                  <TopListItem key={p.path} title={p.title} subtitle={p.path} views={p.views} duration={p.avgDurationSec} />
                )) : <p className="py-6 text-center text-sm text-slate-500">داده‌ای نیست</p>}
              </div>
            </AdminChartCard>
            <AdminChartCard title="محصولات پربازدید" accent="emerald" subtitle={`حداکثر ${summary.topProducts.length} مورد`}>
              <div className={TOP_LIST_CLASS}>
                {summary.topProducts.length ? summary.topProducts.map((p) => (
                  <TopListItem key={p.slug} title={p.title || p.slug} subtitle={`/products/${p.slug}`} views={p.views} duration={p.avgDurationSec} />
                )) : <p className="py-6 text-center text-sm text-slate-500">داده‌ای نیست</p>}
              </div>
            </AdminChartCard>
            <AdminChartCard title="پست‌های پربازدید" accent="violet" subtitle={`حداکثر ${summary.topBlogs.length} مورد`}>
              <div className={TOP_LIST_CLASS}>
                {summary.topBlogs.length ? summary.topBlogs.map((p) => (
                  <TopListItem key={p.slug} title={p.title || p.slug} subtitle={`/blog/${p.slug}`} views={p.views} duration={p.avgDurationSec} />
                )) : <p className="py-6 text-center text-sm text-slate-500">داده‌ای نیست</p>}
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
