'use client';

import { Tag, Truck, Wallet } from 'lucide-react';
import { formatDashCurrency } from '@/lib/dashboard/formats';

export type CheckoutQuote = {
  subtotal: number;
  shippingCost: number;
  shippingPayableNow: number;
  shippingDueOnDelivery: number;
  shippingPaymentTiming: 'ONLINE' | 'ON_DELIVERY';
  courierPaidShipping?: boolean;
  discount: number;
  freeShipping?: boolean;
  couponLabel?: string;
  total: number;
  shippingMethod?: { code?: string; name?: string };
};

export function OrderSummaryPanel({
  items,
  quote,
  couponCode,
  onCouponChange,
  onApplyCoupon,
  applyingCoupon
}: {
  items: Array<{
    product: { _id: string; name: string; price: number; discountPrice?: number };
    variantId?: string;
    variantName?: string;
    unitPrice?: number;
    quantity: number;
  }>;
  quote: CheckoutQuote | null;
  couponCode?: string;
  onCouponChange?: (v: string) => void;
  onApplyCoupon?: () => void;
  applyingCoupon?: boolean;
}) {
  const courierPaid = quote?.courierPaidShipping;

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
      <h2 className="text-sm font-black text-slate-800">خلاصه سفارش</h2>

      <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto text-sm">
        {items.map((item) => {
          const price = item.unitPrice ?? item.product.discountPrice ?? item.product.price;
          const key = `${item.product._id}:${item.variantId || ''}`;
          return (
            <li key={key} className="flex items-start justify-between gap-3">
              <span className="text-slate-600">
                {item.product.name}
                {item.variantName ? <span className="mr-1 text-xs text-amber-700">({item.variantName})</span> : null}
                <span className="mr-1 text-xs text-slate-400">× {item.quantity.toLocaleString('fa-IR')}</span>
              </span>
              <span className="shrink-0 font-bold text-slate-800">{formatDashCurrency(price * item.quantity)}</span>
            </li>
          );
        })}
      </ul>

      {onCouponChange ? (
        <div className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <Tag className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="کد تخفیف"
              value={couponCode}
              onChange={(e) => onCouponChange(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 pr-10 pl-3 text-sm outline-none focus:border-amber-500"
            />
          </div>
          {onApplyCoupon ? (
            <button
              type="button"
              onClick={onApplyCoupon}
              disabled={applyingCoupon}
              className="shrink-0 rounded-xl bg-slate-100 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
            >
              {applyingCoupon ? '...' : 'اعمال'}
            </button>
          ) : null}
        </div>
      ) : null}

      {quote ? (
        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>جمع کالا</span>
            <span>{formatDashCurrency(quote.subtotal)}</span>
          </div>

          {courierPaid ? (
            <div className="flex justify-between text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                هزینه ارسال
                {quote.shippingMethod?.name ? ` (${quote.shippingMethod.name})` : ''}
              </span>
              <span className="text-xs font-bold text-sky-700">پرداخت به پیک</span>
            </div>
          ) : quote.shippingPayableNow > 0 ? (
            <div className="flex justify-between text-slate-600">
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5" />
                هزینه ارسال
                {quote.shippingMethod?.name ? ` (${quote.shippingMethod.name})` : ''}
              </span>
              <span>{formatDashCurrency(quote.shippingPayableNow)}</span>
            </div>
          ) : null}

          {quote.discount > 0 ? (
            <div className="flex justify-between text-emerald-700">
              <span>{quote.freeShipping ? (quote.couponLabel || 'ارسال رایگان') : (quote.couponLabel || 'تخفیف')}</span>
              <span>-{formatDashCurrency(quote.discount)}</span>
            </div>
          ) : null}

          {quote.freeShipping ? (
            <p className="rounded-xl bg-emerald-50 p-3 text-xs leading-6 text-emerald-800">
              هزینه ارسال با کد تخفیف شما پوشش داده شد.
            </p>
          ) : null}

          <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-slate-900">
            <span className="inline-flex items-center gap-1">
              <Wallet className="h-4 w-4 text-amber-600" />
              مبلغ قابل پرداخت
            </span>
            <span className="text-amber-700">{formatDashCurrency(quote.total)}</span>
          </div>

          {courierPaid ? (
            <p className="rounded-xl bg-sky-50 p-3 text-xs leading-6 text-sky-800">
              هزینه ارسال در فاکتور فروشگاه لحاظ نمی‌شود. مبلغ ارسال در زمان تحویل مستقیماً به پیک پرداخت می‌شود.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-slate-100" />
          ))}
        </div>
      )}
    </aside>
  );
}
