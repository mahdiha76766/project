'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowRight, ExternalLink, Package, Receipt } from 'lucide-react';
import { DashBadge, DashError, DashLoading } from '@/components/shop/DashboardUI';
import { AddressMapView } from '@/components/shop/AddressMapView';
import { OrderProgressTracker } from '@/components/shop/OrderProgressTracker';
import { Landmark } from 'lucide-react';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, manageableOrderStatusOptions } from '@/lib/admin/labels';
import { formatDashCurrency, formatDashDate, formatInvoiceNumber, shortId } from '@/lib/dashboard/formats';
import { ORDER_PAYMENT_METHOD_LABELS } from '@/lib/dashboard/labels';
import { normalizeOrderStatus } from '@/lib/product/specs';

const steps = manageableOrderStatusOptions.map((s) => ({ key: s.value, label: s.label }));

type OrderItem = {
  product?: { name?: string };
  quantity: number;
  price: number;
  variantName?: string;
  sku?: string;
};

type Order = {
  _id: string;
  invoiceNumber?: string;
  totalAmount: number;
  discountAmount?: number;
  shippingAmount?: number;
  shippingPaymentTiming?: string;
  shippingDueOnDelivery?: number;
  paymentMethod?: string;
  paymentStatus: string;
  orderStatus: string;
  trackingCode?: string;
  trackingUrl?: string;
  shippingMethodName?: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    province?: string;
    city?: string;
    addressLine?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  receiptStatus?: string | null;
  receiptReviewedAt?: string | null;
  receiptRejectCount?: number;
};

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/dashboard/orders/${params.id}`, { credentials: 'include' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'سفارش یافت نشد');
        setOrder(data.item);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'خطا');
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id]);

  if (loading) return <DashLoading />;
  if (error || !order) return <DashError text={error || 'سفارش یافت نشد'} />;

  const normalizedStatus = normalizeOrderStatus(order.orderStatus);
  const active = Math.max(0, steps.findIndex((s) => s.key === normalizedStatus));
  const paymentLabel = ORDER_PAYMENT_METHOD_LABELS[order.paymentMethod || ''] || order.paymentMethod || '-';

  const getRepayableInfo = () => {
    if (order.receiptRejectCount && order.receiptRejectCount >= 2) {
      return { isRepayable: false, timeLeftText: '', isLocked: true };
    }
    if (order.receiptStatus !== 'REJECTED' || !order.receiptReviewedAt) {
      return { isRepayable: false, timeLeftText: '', isLocked: false };
    }
    const reviewedAt = new Date(order.receiptReviewedAt);
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

  const { isRepayable, timeLeftText, isLocked } = getRepayableInfo();

  return (
    <div>
      <Link href="/dashboard/orders" className="inline-flex items-center gap-1 text-sm font-bold text-amber-700">
        <ArrowRight size={16} />
        بازگشت به سفارش‌ها
      </Link>

      {isLocked ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-black text-rose-800 text-base">⚠️ سفارش قفل شده است</h3>
            <p className="text-sm">رسید پرداخت این سفارش ۲ بار متوالی رد شده است. این سفارش به دلیل بارگذاری رسیدهای نامعتبر قفل شده و امکان ارسال مجدد رسید وجود ندارد.</p>
          </div>
        </div>
      ) : isRepayable && order.invoiceNumber ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-black text-rose-800 text-base">⚠️ رسید پرداخت شما رد شده است</h3>
            <p className="text-sm">پشتیبان یا ادمین رسید ارسالی را تایید نکرده است. لطفاً مجدداً پرداخت خود را نهایی کنید.</p>
            <p className="text-xs font-bold text-rose-700">فرصت باقی‌مانده جهت پرداخت مجدد: {timeLeftText}</p>
          </div>
          <Link
            href={`/dashboard/invoices?invoiceNumber=${order.invoiceNumber}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition"
          >
            <Landmark className="h-4 w-4" />
            پرداخت مجدد سفارش
          </Link>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-gradient-to-l from-amber-50 via-white to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Package className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-900">سفارش #{shortId(String(order._id))}</h2>
              <p className="mt-1 text-xs text-slate-500">ثبت شده در {formatDashDate(order.createdAt)}</p>
            </div>
          </div>
          <DashBadge label={isLocked ? "قفل شده" : isRepayable ? "در انتظار پرداخت مجدد" : ORDER_STATUS_LABELS[order.orderStatus] || order.orderStatus} tone={isLocked || order.orderStatus === 'CANCELED' ? 'rose' : 'amber'} />
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {order.invoiceNumber ? (
            <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
              <p className="text-xs text-slate-500">شماره فاکتور</p>
              <p className="mt-1 font-mono text-lg font-black text-violet-800">{formatInvoiceNumber(order.invoiceNumber)}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">مبلغ کل</p>
            <p className="mt-1 font-black text-slate-900">{formatDashCurrency(order.totalAmount)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">روش پرداخت</p>
            <p className="mt-1 font-bold text-slate-800">{paymentLabel}</p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">وضعیت پرداخت</p>
            <p className="mt-1">
              {isLocked ? (
                <span className="inline-flex flex-col">
                  <DashBadge label="رسید بانکی رد شد" tone="rose" />
                  <span className="mt-1 text-[10px] text-rose-600 font-bold">تعداد تلاش مجاز پایان یافت</span>
                </span>
              ) : isRepayable ? (
                <DashBadge label="رسید بانکی رد شد" tone="rose" />
              ) : order.receiptStatus === 'REJECTED' ? (
                <span className="inline-flex flex-col">
                  <DashBadge label={PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus} tone="rose" />
                  <span className="mt-1 text-[10px] text-slate-400 font-bold">مهلت پرداخت تمام شد</span>
                </span>
              ) : (
                <DashBadge label={PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus} tone={order.paymentStatus === 'PAID' ? 'emerald' : 'amber'} />
              )}
            </p>
          </div>
          {order.shippingMethodName ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-xs text-slate-500">روش ارسال</p>
              <p className="mt-1 font-bold text-slate-800">{order.shippingMethodName}</p>
            </div>
          ) : null}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-xs text-slate-500">هزینه ارسال</p>
            <p className="mt-1 font-bold text-slate-800">
              {order.shippingPaymentTiming === 'ON_DELIVERY'
                ? 'پرداخت به پیک'
                : formatDashCurrency(order.shippingAmount || 0)}
            </p>
          </div>
        </div>
      </section>

      <OrderProgressTracker steps={steps} activeIndex={active} />

      {(order.trackingUrl || order.trackingCode) ? (
        <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-sky-900">پیگیری مرسوله</h3>
              {order.trackingCode ? (
                <p className="mt-1 text-sm text-sky-800">
                  کد رهگیری: <span className="font-mono font-bold">{order.trackingCode}</span>
                </p>
              ) : null}
              <p className="mt-1 text-xs text-sky-700">از طریق لینک زیر وضعیت ارسال را در سایت پست یا پیک مشاهده کنید</p>
            </div>
            {order.trackingUrl ? (
              <a
                href={order.trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                <ExternalLink className="h-4 w-4" />
                پیگیری آنلاین سفارش
              </a>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-amber-600" />
          <h3 className="font-black">محصولات</h3>
        </div>
        <div className="mt-4 space-y-3">
          {order.items.map((it, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
              <div>
                <p className="font-bold text-slate-900">
                  {it.product?.name || 'محصول'}
                  {it.variantName ? <span className="mr-1 text-sm font-bold text-amber-700">— {it.variantName}</span> : null}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  تعداد: {Number(it.quantity).toLocaleString('fa-IR')}
                  {it.sku ? ` · SKU: ${it.sku}` : ''}
                </p>
              </div>
              <p className="font-black text-amber-700">{formatDashCurrency(it.price * it.quantity)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <h3 className="font-black">آدرس ارسال</h3>
        <p className="mt-3 font-bold text-slate-800">{order.shippingAddress?.fullName} — {order.shippingAddress?.phone}</p>
        <p className="mt-1 text-slate-600">
          {order.shippingAddress?.province}، {order.shippingAddress?.city}، {order.shippingAddress?.addressLine}
        </p>
        <p className="mt-1 text-xs text-slate-500">کدپستی: {order.shippingAddress?.postalCode}</p>
        {order.shippingAddress?.latitude != null && order.shippingAddress?.longitude != null ? (
          <div className="mt-4">
            <AddressMapView
              latitude={order.shippingAddress.latitude}
              longitude={order.shippingAddress.longitude}
              label="موقعیت تحویل"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}
