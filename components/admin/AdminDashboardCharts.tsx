'use client';

import { useMemo, useState } from 'react';
import { HiOutlineChartBar, HiOutlineTrendingUp } from 'react-icons/hi';
import { PiChartPieSliceDuotone } from 'react-icons/pi';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/admin/labels';
import { formatCurrency } from '@/lib/admin/table-formats';
import {
  AdminBarTrendChart,
  AdminChartCard,
  AdminDonutChart,
  CHART_COLORS,
  formatDayLabel
} from '@/components/admin/charts/AdminChartKit';

type SalesPoint = { date: string; amount: number };
type OrdersPoint = { date: string; count: number };
type Breakdown = { status: string; count: number };

const STATUS_COLORS: Record<string, string> = {
  PENDING_PAYMENT: '#f59e0b',
  PAID: '#10b981',
  PROCESSING: '#3b82f6',
  PACKED: '#6366f1',
  SHIPPED: '#8b5cf6',
  DELIVERED: '#059669',
  CANCELED: '#ef4444',
  RETURNED: '#f97316',
  REFUNDED: '#94a3b8',
  PENDING: '#f59e0b',
  FAILED: '#ef4444'
};

function RangeSelector({
  value,
  options,
  onChange
}: {
  value: number;
  options: Array<{ value: number; label: string }>;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white/80 p-1 shadow-sm">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
            value === opt.value ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function AdminDashboardCharts({
  salesTrend,
  ordersTrend,
  orderStatusBreakdown,
  paymentStatusBreakdown,
  rangeDays = 7,
  rangeSalesTotal,
  rangeOrdersTotal,
  rangeOptions,
  onRangeChange
}: {
  salesTrend: SalesPoint[];
  ordersTrend: OrdersPoint[];
  orderStatusBreakdown: Breakdown[];
  paymentStatusBreakdown: Breakdown[];
  rangeDays?: number;
  rangeSalesTotal?: number;
  rangeOrdersTotal?: number;
  rangeOptions?: Array<{ value: number; label: string }>;
  onRangeChange?: (range: number) => void;
}) {
  const salesData = useMemo(
    () => salesTrend.map((d) => ({ ...d, label: formatDayLabel(d.date) })),
    [salesTrend]
  );
  const ordersData = useMemo(
    () => ordersTrend.map((d) => ({ ...d, label: formatDayLabel(d.date) })),
    [ordersTrend]
  );

  const salesTotal = rangeSalesTotal ?? salesTrend.reduce((s, d) => s + d.amount, 0);
  const ordersTotal = rangeOrdersTotal ?? ordersTrend.reduce((s, d) => s + d.count, 0);
  const rangeLabel = rangeOptions?.find((o) => o.value === rangeDays)?.label || `${rangeDays} روز`;

  const orderDonut = orderStatusBreakdown.map((d, i) => ({
    name: ORDER_STATUS_LABELS[d.status] || d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || CHART_COLORS[i % CHART_COLORS.length]
  }));

  const paymentDonut = paymentStatusBreakdown.map((d, i) => ({
    name: PAYMENT_STATUS_LABELS[d.status] || d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] || CHART_COLORS[i % CHART_COLORS.length]
  }));

  const rangeAction =
    rangeOptions?.length && onRangeChange ? (
      <RangeSelector value={rangeDays} options={rangeOptions} onChange={onRangeChange} />
    ) : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <AdminChartCard
          title="روند فروش"
          subtitle={`${rangeLabel} · ${formatCurrency(salesTotal, 'ریال')}`}
          icon={<HiOutlineTrendingUp />}
          accent="amber"
          action={rangeAction}
        >
          <AdminBarTrendChart
            data={salesData}
            xKey="label"
            yKey="amount"
            name="فروش"
            color="#d97706"
            valueFormatter={(n) => formatCurrency(n, 'ریال')}
          />
        </AdminChartCard>

        <AdminChartCard
          title="حجم سفارش‌ها"
          subtitle={`${ordersTotal.toLocaleString('fa-IR')} سفارش در ${rangeLabel}`}
          icon={<HiOutlineChartBar />}
          accent="sky"
        >
          <AdminBarTrendChart
            data={ordersData}
            xKey="label"
            yKey="count"
            name="سفارش"
            color="#0ea5e9"
            valueFormatter={(n) => `${n.toLocaleString('fa-IR')} سفارش`}
          />
        </AdminChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminChartCard title="توزیع وضعیت سفارش" subtitle="نمای کلی چرخه سفارش‌ها" icon={<PiChartPieSliceDuotone />} accent="violet">
          {orderDonut.length ? <AdminDonutChart data={orderDonut} /> : <EmptyChart message="سفارشی برای نمایش وجود ندارد" />}
        </AdminChartCard>

        <AdminChartCard title="توزیع وضعیت پرداخت" subtitle="پرداخت‌های موفق، معلق و ناموفق" icon={<PiChartPieSliceDuotone />} accent="emerald">
          {paymentDonut.length ? <AdminDonutChart data={paymentDonut} /> : <EmptyChart message="داده پرداختی وجود ندارد" />}
        </AdminChartCard>
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
      <HiOutlineChartBar className="mb-2 h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
