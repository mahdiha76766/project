'use client';

import { useEffect, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  ShoppingCart,
  Users,
  AlertTriangle,
  Truck
} from 'lucide-react';
import { AdminLiveOrders } from '@/components/admin/AdminLiveOrders';
import { AdminDashboardCharts } from '@/components/admin/AdminDashboardCharts';
import { AdminLoading, AdminPageBanner, AdminStatCard } from '@/components/admin/AdminUI';
import { adminFetch } from '@/lib/admin/client';
import { formatCurrency } from '@/lib/admin/table-formats';
import { DASHBOARD_RANGE_OPTIONS, type DashboardRangeDays } from '@/lib/admin/dashboard-range';

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

export default function AdminPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chartRange, setChartRange] = useState<DashboardRangeDays>(7);

  const load = async (range = chartRange) => {
    setError('');
    const res = await adminFetch<{ summary: Summary }>(`/api/admin/dashboard/summary?range=${range}`);
    if (!res.ok) setError(res.error || 'خطا در دریافت آمار');
    else setSummary(res.data?.summary ?? null);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    void load(chartRange);
    const id = setInterval(() => void load(chartRange), 30000);
    return () => clearInterval(id);
  }, [chartRange]);

  return (
    <div >
      <AdminPageBanner
        title="داشبورد مدیریت"
        subtitle="آمار لحظه‌ای فروش، نمودارها و مدیریت سفارش‌ها بدون نیاز به رفرش"
      />

      {loading ? (
        <AdminLoading />
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AdminStatCard
              title="فروش امروز"
              value={formatCurrency(summary.salesToday, 'ریال')}
              hint={`${summary.salesTodayCount.toLocaleString('fa-IR')} پرداخت موفق`}
              icon={Banknote}
              accent="amber"
            />
            <AdminStatCard
              title="فروش این ماه"
              value={formatCurrency(summary.salesMonth, 'ریال')}
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
