'use client';

import {
  ChevronDown,
  ExternalLink,
  ListOrdered,
  MapPin,
  Truck,
  Zap
} from 'lucide-react';
import { AdminOrderItemsList } from '@/components/admin/AdminOrderItemsList';
import {
  itemCount,
  type AdminOrderRow
} from '@/components/admin/admin-order-types';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, orderStatusOptions, paymentStatusOptions } from '@/lib/admin/labels';
import { formatCurrency, formatDate } from '@/lib/admin/table-formats';
import { shortId } from '@/lib/dashboard/formats';

const statusAccent: Record<string, string> = {
  PENDING_PAYMENT: 'from-amber-400 to-orange-400',
  PAID: 'from-emerald-400 to-teal-400',
  PROCESSING: 'from-sky-400 to-blue-400',
  PACKED: 'from-sky-400 to-blue-400',
  SHIPPED: 'from-violet-400 to-purple-400',
  DELIVERED: 'from-emerald-500 to-green-400',
  CANCELED: 'from-rose-400 to-red-400',
  RETURNED: 'from-orange-400 to-amber-400',
  REFUNDED: 'from-slate-400 to-slate-300'
};

type Panel = 'items' | 'tracking' | null;

type Props = {
  order: AdminOrderRow;
  isNew?: boolean;
  isSaving?: boolean;
  panel: Panel;
  onPanelChange: (panel: Panel) => void;
  onMap: () => void;
  onUpdate: (patch: Record<string, string>) => void;
  trackingDraft: string;
  trackingUrlDraft: string;
  onTrackingDraft: (v: string) => void;
  onTrackingUrlDraft: (v: string) => void;
};

function selectCls() {
  return 'h-8 w-full rounded-lg border-0 bg-slate-100/90 px-2.5 text-xs font-bold text-slate-800 outline-none ring-1 ring-slate-200/80 focus:ring-amber-300';
}

export function AdminOrderCard({
  order: o,
  isNew,
  isSaving,
  panel,
  onPanelChange,
  onMap,
  onUpdate,
  trackingDraft,
  trackingUrlDraft,
  onTrackingDraft,
  onTrackingUrlDraft
}: Props) {
  const statusKey = o.orderStatus === 'PACKED' ? 'PROCESSING' : o.orderStatus;
  const accent = statusAccent[o.orderStatus] || statusAccent.PENDING_PAYMENT;
  const qty = itemCount(o);
  const toggle = (p: 'items' | 'tracking') => onPanelChange(panel === p ? null : p);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
        isNew ? 'border-emerald-300/80 ring-2 ring-emerald-100' : 'border-slate-200/90'
      }`}
    >
      <div className={`h-1 bg-gradient-to-l ${accent}`} />

      <div className="p-3.5">
        {/* Top row */}
        <div className="flex items-start gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-black text-white shadow-sm">
            {(o.user?.name || o.user?.mobile || '?').charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-black text-slate-900">
                {o.user?.name || o.user?.mobile || 'مشتری'}
              </p>
              {isNew ? (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Zap className="h-2.5 w-2.5" />
                  جدید
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 font-mono text-xs font-bold text-slate-500">#{shortId(o._id)}</p>
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-slate-900">{formatCurrency(o.totalAmount, 'تومان')}</p>
            <p className="text-[11px] text-slate-400">{formatDate(o.createdAt)}</p>
          </div>
        </div>

        {/* Meta chips */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus}
          </span>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus}
          </span>
          {o.shippingMethodName ? (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
              <Truck className="h-3 w-3" />
              {o.shippingMethodName}
            </span>
          ) : null}
        </div>

        {/* Compact selects */}
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <select
            className={selectCls()}
            value={statusKey}
            disabled={isSaving}
            onChange={(e) => onUpdate({ orderStatus: e.target.value })}
          >
            {orderStatusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            className={selectCls()}
            value={o.paymentStatus}
            disabled={isSaving}
            onChange={(e) => onUpdate({ paymentStatus: e.target.value })}
          >
            {paymentStatusOptions.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Action pills */}
        <div className="mt-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => toggle('items')}
            className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold transition ${
              panel === 'items'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-800 ring-1 ring-amber-200/80 hover:bg-amber-100'
            }`}
          >
            <ListOrdered className="h-3 w-3" />
            اقلام{qty ? ` (${qty})` : ''}
            <ChevronDown className={`h-2.5 w-2.5 transition ${panel === 'items' ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onMap}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-200/80 transition hover:bg-sky-100"
            title="آدرس"
          >
            <MapPin className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => toggle('tracking')}
            className={`inline-flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-bold transition ${
              panel === 'tracking'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-200/70'
            }`}
          >
            پیگیری
            <ChevronDown className={`h-2.5 w-2.5 transition ${panel === 'tracking' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Panels */}
        {panel === 'items' ? (
          <div className="mt-2.5">
            <AdminOrderItemsList order={o} />
          </div>
        ) : null}

        {panel === 'tracking' ? (
          <div className="mt-2.5 space-y-2 rounded-xl bg-slate-50 p-2.5 ring-1 ring-slate-200/60">
            <div className="flex gap-1">
              <input
                className="h-8 min-w-0 flex-1 rounded-lg border-0 bg-white px-2 text-[11px] outline-none ring-1 ring-slate-200 focus:ring-amber-300"
                value={trackingDraft}
                onChange={(e) => onTrackingDraft(e.target.value)}
                placeholder="کد رهگیری"
              />
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onUpdate({ trackingCode: trackingDraft })}
                className="shrink-0 rounded-lg bg-amber-600 px-2.5 text-[10px] font-bold text-white disabled:opacity-50"
              >
                ذخیره
              </button>
            </div>
            <div className="flex gap-1">
              <input
                dir="ltr"
                className="h-8 min-w-0 flex-1 rounded-lg border-0 bg-white px-2 text-left text-[11px] outline-none ring-1 ring-slate-200 focus:ring-sky-300"
                value={trackingUrlDraft}
                onChange={(e) => onTrackingUrlDraft(e.target.value)}
                placeholder="لینک پیگیری"
              />
              <button
                type="button"
                disabled={isSaving}
                onClick={() => onUpdate({ trackingUrl: trackingUrlDraft })}
                className="shrink-0 rounded-lg bg-sky-600 px-2.5 text-[10px] font-bold text-white disabled:opacity-50"
              >
                ذخیره
              </button>
            </div>
            {o.trackingUrl ? (
              <a
                href={o.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700"
              >
                <ExternalLink className="h-3 w-3" />
                باز کردن لینک
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
