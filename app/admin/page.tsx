'use client';

import { useEffect, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  ShoppingCart,
  Users,
  AlertTriangle,
  Truck,
  Package,
  Shapes,
  Newspaper,
  Download,
  Mail
} from 'lucide-react';
import { AdminLiveOrders } from '@/components/admin/AdminLiveOrders';
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';
import { AdminLoading, AdminPageBanner, AdminStatCard } from '@/components/admin/AdminUI';
import { AdminSalesStatusBanner } from '@/components/admin/AdminSalesStatusBanner';
import { adminFetch } from '@/lib/admin/client';
import { formatCurrency } from '@/lib/admin/table-formats';
import { DASHBOARD_RANGE_OPTIONS, type DashboardRangeDays } from '@/lib/admin/dashboard-range';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { canManageCommerce } from '@/lib/auth/client-roles';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

type Summary = {
  salesToday: number;
  salesTodayCount: number;
  salesMonth: number;
  salesMonthCount: number;
  pendingPaymentOrders: number;
  awaitingShipment: number;
  lowStockCount: number;
  usersCount: number;
  ordersCount: number;
  recentOrders: Array<{
    _id: string;
    totalAmount: number;
    orderStatus: string;
    paymentStatus: string;
    trackingCode?: string;
    trackingUrl?: string;
    shippingMethodName?: string;
    shippingAddress?: {
      fullName?: string;
      phone?: string;
      province?: string;
      city?: string;
      postalCode?: string;
      addressLine?: string;
      latitude?: number;
      longitude?: number;
    };
    invoiceNumber?: string;
    createdAt: string;
    user?: { name?: string; mobile?: string };
  }>;
  rangeDays: number;
  salesTrend: Array<{ date: string; amount: number }>;
  ordersTrend: Array<{ date: string; count: number }>;
  rangeSalesTotal: number;
  rangeOrdersTotal: number;
  orderStatusBreakdown: Array<{ status: string; count: number }>;
  paymentStatusBreakdown: Array<{ status: string; count: number }>;
};

type Overview = {
  products: number;
  categories: number;
  articles: number;
  downloads: number;
  messages: number;
  unreadMessages: number;
  users: number;
};

export default function AdminPage() {
  const user = useCurrentUser();
  const commerce = canManageCommerce(user?.role);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartRange, setChartRange] = useState<DashboardRangeDays>(7);

  const loadOverview = async () => {
    const res = await adminFetch<{ overview: Overview }>('/api/admin/overview');
    if (res.ok) setOverview(res.data.overview);
  };

  const load = async (range = chartRange) => {
    setError('');
    await loadOverview();
    if (!commerce) {
      setLoading(false);
      return;
    }
    const res = await adminFetch<{ summary: Summary }>(`/api/admin/dashboard/summary?range=${range}`);
    if (!res.ok) setError(res.error || 'خطا در دریافت آمار فروش');
    else setSummary(res.data?.summary ?? null);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void load(chartRange);
    const id = setInterval(() => void load(chartRange), 30000);
    return () => clearInterval(id);
  }, [chartRange, commerce]);

  return (
    <div className="space-y-6">
      <AdminPageBanner title={`داشبورد ${FEEDAR_BRAND.nameFa}`} subtitle="نمای کلی محتوا، محصولات و پیام‌های دریافتی" />
      <AdminSalesStatusBanner canManage={commerce} />

      {overview ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminStatCard title="محصولات" value={`${overview.products.toLocaleString('fa-IR')}`} icon={Package} href="/admin/products" accent="emerald" />
          <AdminStatCard title="دسته‌بندی‌ها" value={`${overview.categories.toLocaleString('fa-IR')}`} icon={Shapes} href="/admin/categories" accent="sky" />
          <AdminStatCard title="مقالات" value={`${overview.articles.toLocaleString('fa-IR')}`} icon={Newspaper} href="/admin/blog" accent="violet" />
          <AdminStatCard title="دانلودها" value={`${overview.downloads.toLocaleString('fa-IR')}`} icon={Download} href="/admin/downloads" accent="amber" />
          <AdminStatCard title="پیام‌های تماس" value={`${overview.messages.toLocaleString('fa-IR')}`} hint={`${overview.unreadMessages.toLocaleString('fa-IR')} خوانده‌نشده`} icon={Mail} href="/admin/messages" accent="rose" />
          <AdminStatCard title="کاربران" value={`${overview.users.toLocaleString('fa-IR')}`} icon={Users} href="/admin/users" accent="emerald" />
        </div>
      ) : null}

      {overview ? (
        <div className="rounded-2xl border border-surface-200 bg-white p-5">
          <h2 className="text-sm font-black">ترکیب محتوا</h2>
          <div className="mt-4 grid gap-3">
            {[
              { label: 'محصولات', value: overview.products },
              { label: 'مقالات', value: overview.articles },
              { label: 'دانلودها', value: overview.downloads },
              { label: 'پیام‌ها', value: overview.messages }
            ].map((row) => {
              const max = Math.max(overview.products, overview.articles, overview.downloads, overview.messages, 1);
              return (
                <div key={row.label}>
                  <div className="mb-1 flex justify-between text-xs text-surface-500">
                    <span>{row.label}</span>
                    <span>{row.value.toLocaleString('fa-IR')}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-100">
                    <div className="h-full rounded-full bg-brand-700" style={{ width: `${Math.round((row.value / max) * 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : commerce && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard
              title="فروش امروز"
              value={formatCurrency(summary.salesToday, 'تومان')}
              hint={`${summary.salesTodayCount.toLocaleString('fa-IR')} پرداخت موفق`}
              icon={Banknote}
              accent="amber"
            />
            <AdminStatCard
              title="فروش این ماه"
              value={formatCurrency(summary.salesMonth, 'تومان')}
              hint={`${summary.salesMonthCount.toLocaleString('fa-IR')} پرداخت`}
              icon={CalendarDays}
              accent="emerald"
            />
            <AdminStatCard
              title="سفارش در انتظار پرداخت"
              value={`${summary.pendingPaymentOrders.toLocaleString('fa-IR')} مورد`}
              icon={ShoppingCart}
              href="/admin/orders"
              accent="rose"
            />
            <AdminStatCard
              title="در انتظار ارسال"
              value={`${summary.awaitingShipment.toLocaleString('fa-IR')} سفارش`}
              icon={Truck}
              href="/admin/orders"
              accent="sky"
            />
            <AdminStatCard
              title="محصولات کم‌موجودی"
              value={`${summary.lowStockCount.toLocaleString('fa-IR')} مورد`}
              hint="موجودی ۵ عدد یا کمتر"
              icon={AlertTriangle}
              href="/admin/products"
              accent="violet"
            />
            <AdminStatCard
              title="کاربران ثبت‌نام‌شده"
              value={`${summary.usersCount.toLocaleString('fa-IR')} نفر`}
              hint={`${summary.ordersCount.toLocaleString('fa-IR')} سفارش کل`}
              icon={Users}
              href="/admin/users"
              accent="emerald"
            />
          </div>

          <AdminDashboardCharts
            salesTrend={summary.salesTrend}
            ordersTrend={summary.ordersTrend}
            orderStatusBreakdown={summary.orderStatusBreakdown}
            paymentStatusBreakdown={summary.paymentStatusBreakdown}
            rangeDays={summary.rangeDays || chartRange}
            rangeSalesTotal={summary.rangeSalesTotal}
            rangeOrdersTotal={summary.rangeOrdersTotal}
            rangeOptions={DASHBOARD_RANGE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onRangeChange={(range) => setChartRange(range as DashboardRangeDays)}
          />

          <div className="rounded-2xl border border-slate-200 bg-gradient-to-l from-sky-50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-slate-900">آمار بازدید سایت</h2>
                <p className="mt-1 text-xs text-slate-500">بازدید واقعی، ماندگاری کاربران و صفحات پربازدید</p>
              </div>
              <a href="/admin/analytics" className="site-btn-primary !rounded-xl !px-4 !py-2 !text-xs">
                مشاهده گزارش کامل
              </a>
            </div>
          </div>

          <AdminLiveOrders initialOrders={summary.recentOrders} />
        </>
      ) : null}
    </div>
  );
}
