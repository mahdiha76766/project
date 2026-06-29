'use client';

import Link from 'next/link';
import { resolveImage } from '@/lib/shop/resolve-image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  Headphones,
  Trash2,
  Sparkles
} from 'lucide-react';
import { formatDashCurrency } from '@/lib/dashboard/formats';
import { cartLineKey } from '@/lib/product/variants';

type CartItem = {
  product?: {
    _id: string;
    name: string;
    slug?: string;
    price: number;
    discountPrice?: number;
    images?: string[];
    weight?: number;
    weightUnit?: string;
  } | null;
  variantId?: string;
  variantName?: string;
  unitPrice?: number;
  quantity: number;
};

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'پرداخت امن', tone: 'text-emerald-600 bg-emerald-50' },
  { icon: Truck, label: 'ارسال سریع', tone: 'text-sky-600 bg-sky-50' },
  { icon: Headphones, label: 'پشتیبانی ۲۴/۷', tone: 'text-violet-600 bg-violet-50' }
];

function linePrice(item: CartItem) {
  return item.unitPrice ?? item.product?.discountPrice ?? item.product?.price ?? 0;
}

function lineKey(item: CartItem) {
  return cartLineKey(item.product?._id || 'missing', item.variantId);
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/cart', { credentials: 'same-origin' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'خطا در دریافت سبد');
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (item: CartItem, quantity: number) => {
    if (quantity < 1 || !item.product?._id) return;
    const key = lineKey(item);
    setUpdatingKey(key);
    try {
      await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.product!._id, variantId: item.variantId, quantity })
      });
      await load();
    } finally {
      setUpdatingKey('');
    }
  };

  const removeItem = async (item: CartItem) => {
    if (!item.product?._id) return;
    const key = lineKey(item);
    setUpdatingKey(key);
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: item.product!._id, variantId: item.variantId })
      });
      await load();
    } finally {
      setUpdatingKey('');
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const validItems = useMemo(() => items.filter((i) => i.product?._id), [items]);

  const subtotal = useMemo(
    () => validItems.reduce((sum, i) => sum + linePrice(i) * i.quantity, 0),
    [validItems]
  );

  const itemCount = validItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-l from-amber-50 via-white to-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-amber-700">مرحله ۱ از ۲</p>
            <h1 className="mt-1 text-2xl font-black text-slate-900">سبد خرید شما</h1>
            <p className="mt-1 text-sm text-slate-500">
              {itemCount > 0
                ? `${itemCount.toLocaleString('fa-IR')} قلم کالا در سبد`
                : 'محصولات مورد علاقه‌تان را اینجا ببینید'}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-amber-300"
          >
            <ArrowLeft className="h-4 w-4" />
            ادامه خرید
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : null}

      {!loading && validItems.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ShoppingBag className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-lg font-black text-slate-800">سبد خرید شما خالی است</h2>
          <p className="mt-2 text-sm text-slate-500">هنوز محصولی اضافه نکرده‌اید. از فروشگاه دیدن کنید.</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-amber-700 px-6 py-3 font-bold text-white transition hover:bg-amber-800"
          >
            <Sparkles className="h-4 w-4" />
            مشاهده محصولات
          </Link>
        </div>
      ) : null}

      {!loading && validItems.length > 0 ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {validItems.map((item) => {
              const product = item.product!;
              const price = linePrice(item);
              const hasDiscount = Boolean(
                product.discountPrice && product.discountPrice < product.price && !item.unitPrice
              );
              const image = resolveImage(product.images?.[0]);
              const key = lineKey(item);
              const busy = updatingKey === key;

              return (
                <article
                  key={key}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center"
                >
                  <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-20 sm:w-20">
                    {product.images?.[0] ? (
                      <img src={image} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={product.slug ? `/products/${product.slug}` : '#'}
                      className="font-black text-slate-900 transition hover:text-amber-700"
                    >
                      {product.name}
                    </Link>
                    {item.variantName ? (
                      <p className="mt-1 inline-flex rounded-lg bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800">
                        نوع: {item.variantName}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-amber-700">{formatDashCurrency(price)}</span>
                      {hasDiscount ? (
                        <span className="text-xs text-slate-400 line-through">
                          {formatDashCurrency(product.price)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                    <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                      <button
                        type="button"
                        disabled={busy || item.quantity <= 1}
                        onClick={() => updateQty(item, item.quantity - 1)}
                        className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-white disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="min-w-[2rem] text-center text-sm font-black">
                        {item.quantity.toLocaleString('fa-IR')}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateQty(item, item.quantity + 1)}
                        className="flex h-10 w-10 items-center justify-center text-slate-600 transition hover:bg-white disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeItem(item)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      حذف
                    </button>
                  </div>

                  <div className="text-left text-sm font-black text-slate-800 sm:min-w-[7rem]">
                    {formatDashCurrency(price * item.quantity)}
                  </div>
                </article>
              );
            })}

            <div className="grid gap-3 sm:grid-cols-3">
              {TRUST_BADGES.map(({ icon: Icon, label, tone }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-sm font-black text-slate-800">جمع‌بندی</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>تعداد اقلام</span>
                <span>{itemCount.toLocaleString('fa-IR')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-slate-900">
                <span>جمع کل</span>
                <span className="text-amber-700">{formatDashCurrency(subtotal)}</span>
              </div>
            </div>
            <p className="mt-3 text-xs leading-6 text-slate-500">
              هزینه ارسال در مرحله بعد بر اساس روش ارسال و وزن محصولات محاسبه می‌شود.
            </p>
            <Link
              href="/checkout"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-700 py-3.5 font-black text-white transition hover:bg-amber-800"
            >
              ادامه به تسویه حساب
              <ArrowLeft className="h-4 w-4 rotate-180" />
            </Link>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
