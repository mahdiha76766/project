'use client';

import { useEffect, useState } from 'react';
import { Clock3, History, Loader2, X } from 'lucide-react';
import { formatJalaliDateTime } from '@/lib/admin/jalali';

export type HistoryTarget = {
  productId: string;
  variantId: string | null;
  productName: string;
  variantLabel: string;
  currentPrice: number;
};

type HistoryItem = {
  id: string;
  price: number;
  discountPrice: number | null;
  savedAt: string;
};

function formatFa(n: number) {
  return n.toLocaleString('fa-IR');
}

function PriceText({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`} dir="rtl">
      <span className="tabular-nums" dir="ltr">
        {formatFa(value)}
      </span>
      <span>تومان</span>
    </span>
  );
}

export function PriceHistoryModal({
  target,
  onClose
}: {
  target: HistoryTarget;
  onClose: () => void;
}) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError('');
      const qs = new URLSearchParams({ productId: target.productId });
      if (target.variantId) qs.set('variantId', target.variantId);
      const res = await fetch(`/api/price-portal/products/history?${qs}`, {
        credentials: 'same-origin'
      });
      if (cancelled) return;
      if (!res.ok) {
        setError('بارگذاری تاریخچه ناموفق بود');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [target.productId, target.variantId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-history-title"
      dir="rtl"
    >
      <button
        type="button"
        className="absolute inset-0 bg-neutral-950/55 backdrop-blur-[2px]"
        aria-label="بستن"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:mx-4 sm:rounded-3xl">
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-700 to-neutral-900 px-5 pb-5 pt-5 text-white">
          <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-8 right-0 h-28 w-28 rounded-full bg-emerald-300/20 blur-2xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 text-right">
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold backdrop-blur-sm">
                <History className="h-3.5 w-3.5" />
                تاریخچه قیمت
              </div>
              <h2 id="price-history-title" className="truncate text-lg font-black leading-snug">
                {target.productName}
              </h2>
              <p className="mt-1 text-sm text-emerald-50/90">{target.variantLabel}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              aria-label="بستن"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="relative z-[1] mt-4 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
            <p className="text-[11px] font-medium text-emerald-100/80">قیمت فعلی</p>
            <p className="mt-0.5 text-2xl font-black tracking-tight">
              <PriceText value={target.currentPrice} className="text-white [&>span:last-child]:text-sm [&>span:last-child]:font-semibold [&>span:last-child]:text-emerald-100" />
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-neutral-400">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">در حال بارگذاری...</p>
            </div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-600">{error}</p>
          ) : !items.length ? (
            <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-10 text-center">
              <Clock3 className="mx-auto h-8 w-8 text-neutral-300" />
              <p className="mt-3 text-sm font-bold text-neutral-600">هنوز تاریخچه‌ای ثبت نشده</p>
              <p className="mt-1 text-xs leading-6 text-neutral-400">
                بعد از هر ذخیره قیمت، قیمت قبلی با تاریخ و ساعت ذخیره‌اش اینجا می‌آید.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-0">
              {items.map((item, index) => (
                <li key={item.id} className="relative flex gap-3 pb-5 last:pb-1">
                  <div className="relative mt-1.5 flex w-4 shrink-0 justify-center">
                    <span
                      className={`absolute top-0 h-3 w-3 rounded-full ring-4 ring-white ${
                        index === 0 ? 'bg-emerald-500' : 'bg-neutral-300'
                      }`}
                    />
                    {index < items.length - 1 ? (
                      <span className="absolute top-3 bottom-[-1.25rem] w-px bg-neutral-100" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1 rounded-2xl border border-neutral-100 bg-neutral-50/80 px-3.5 py-3 text-right transition hover:border-neutral-200 hover:bg-white">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-base font-black text-neutral-900">
                        <PriceText value={item.price} className="[&>span:last-child]:text-xs [&>span:last-child]:font-semibold [&>span:last-child]:text-neutral-400" />
                      </p>
                      {index === 0 ? (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          آخرین قبلی
                        </span>
                      ) : null}
                    </div>
                    {item.discountPrice ? (
                      <p className="mt-0.5 text-xs text-amber-700">
                        تخفیف: <PriceText value={item.discountPrice} />
                      </p>
                    ) : null}
                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500">
                      <Clock3 className="h-3.5 w-3.5 text-neutral-400" />
                      ذخیره شده در {formatJalaliDateTime(item.savedAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
