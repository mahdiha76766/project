'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Landmark } from 'lucide-react';
import { DashBadge, DashCard, DashEmpty, DashError, DashLoading, DashPageHeader } from '@/components/shop/DashboardUI';
import { DashJalaliDateInput } from '@/components/shop/JalaliDateInput';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, manageableOrderStatusOptions } from '@/lib/admin/labels';
import { formatDashCurrency, formatDashDate, shortId } from '@/lib/dashboard/formats';

type Order = {
  _id: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  trackingCode?: string;
  createdAt: string;
  invoiceNumber?: string;
  receiptStatus?: string | null;
  receiptReviewedAt?: string | null;
  receiptRejectCount?: number;
};

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams(Object.entries({ status, from, to }).filter(([, v]) => v));
      const res = await fetch(`/api/dashboard/orders?${q.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت سفارش‌ها');
      setItems(data.items || []);
    } catch (e: any) {
      setError(e.message || 'خطا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const getRepayableInfo = (o: Order) => {
    if (o.receiptRejectCount && o.receiptRejectCount >= 2) {
      return { isRepayable: false, timeLeftText: '', isLocked: true };
    }
    if (o.receiptStatus !== 'REJECTED' || !o.receiptReviewedAt) {
      return { isRepayable: false, timeLeftText: '', isLocked: false };
    }
    const reviewedAt = new Date(o.receiptReviewedAt);
    const expireTime = reviewedAt.getTime() + 2 * 60 * 60 * 1000;
    const diffMs = expireTime - Date.now();
    const isRepayable = diffMs > 0;

    if (!isRepayable) {
      return { isRepayable: false, timeLeftText: '', isLocked: false };
    }

    const diffMinutes = Math.ceil(diffMs / (60 * 1000));
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const timeLeftText = hours > 0 ? `${hours} ساعت و ${mins} دقیقه` : `${mins} دقیقه`;

    return { isRepayable, timeLeftText, isLocked: false };
  };

  return (
    <div>
      <DashPageHeader title="سفارش‌های من" subtitle="پیگیری وضعیت خریدها و کد رهگیری ارسال" />

      <DashCard title="فیلتر سفارش‌ها">
        <div className="grid gap-3 md:grid-cols-4">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-xl border px-3 text-sm outline-none">
            <option value="">همه وضعیت‌ها</option>
            {manageableOrderStatusOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <DashJalaliDateInput value={from} onChange={setFrom} placeholder="از تاریخ" />
          <DashJalaliDateInput value={to} onChange={setTo} placeholder="تا تاریخ" />
          <button onClick={load} className="h-11 rounded-xl bg-amber-600 px-4 font-bold text-white transition hover:bg-amber-700">
            اعمال فیلتر
          </button>
        </div>
      </DashCard>

      <DashCard title="لیست سفارش‌ها">
        {loading ? (
          <DashLoading />
        ) : error ? (
          <DashError text={error} />
        ) : items.length === 0 ? (
          <DashEmpty text="هنوز سفارشی ندارید." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr className="text-right [&>th]:px-3 [&>th]:py-3">
                  <th>کد سفارش</th>
                  <th>تاریخ</th>
                  <th>مبلغ</th>
                  <th>وضعیت سفارش</th>
                  <th>وضعیت پرداخت</th>
                  <th>رهگیری</th>
                  <th className="text-center">عملیات / جزئیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((o) => {
                  const { isRepayable, timeLeftText, isLocked } = getRepayableInfo(o);
                  return (
                    <tr key={o._id} className="[&>td]:px-3 [&>td]:py-3.5">
                      <td>
                        <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs font-bold">
                          {shortId(o._id)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap">{formatDashDate(o.createdAt)}</td>
                      <td className="font-black text-slate-800">{formatDashCurrency(o.totalAmount)}</td>
                      <td>
                        {isLocked ? (
                          <DashBadge label="قفل شده" tone="rose" />
                        ) : isRepayable ? (
                          <DashBadge label="در انتظار پرداخت مجدد" tone="amber" />
                        ) : (
                          <DashBadge label={ORDER_STATUS_LABELS[o.orderStatus] || o.orderStatus} tone={o.orderStatus === 'CANCELED' ? 'rose' : 'amber'} />
                        )}
                      </td>
                      <td>
                        {isLocked ? (
                          <span className="inline-flex flex-col">
                            <DashBadge label="رسید بانکی رد شد" tone="rose" />
                            <span className="mt-1 text-[10px] text-rose-600 font-bold whitespace-nowrap">تعداد تلاش مجاز پایان یافت</span>
                          </span>
                        ) : isRepayable ? (
                          <span className="inline-flex flex-col">
                            <DashBadge label="رسید بانکی رد شد" tone="rose" />
                            <span className="mt-1 text-[10px] text-rose-600 font-bold whitespace-nowrap">فرصت مجدد: {timeLeftText}</span>
                          </span>
                        ) : o.receiptStatus === 'REJECTED' ? (
                          <span className="inline-flex flex-col">
                            <DashBadge label={PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus} tone="rose" />
                            <span className="mt-1 text-[10px] text-slate-400 font-bold whitespace-nowrap">مهلت پرداخت تمام شد</span>
                          </span>
                        ) : (
                          <DashBadge label={PAYMENT_STATUS_LABELS[o.paymentStatus] || o.paymentStatus} tone={o.paymentStatus === 'PAID' ? 'emerald' : 'amber'} />
                        )}
                      </td>
                      <td>{o.trackingCode || '-'}</td>
                      <td>
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                          {isRepayable && o.invoiceNumber ? (
                            <Link
                              href={`/dashboard/invoices?invoiceNumber=${o.invoiceNumber}`}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-black text-white shadow-md shadow-emerald-100 transition hover:bg-emerald-700"
                            >
                              <Landmark size={12} />
                              پرداخت مجدد
                            </Link>
                          ) : null}
                          <Link
                            href={`/dashboard/orders/${o._id}`}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
                          >
                            مشاهده سفارش
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashCard>
    </div>
  );
}
