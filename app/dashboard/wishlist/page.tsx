'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';
import { AddToCartButton } from '@/components/shop/AddToCartButton';
import { ProductPriceWithDiscount } from '@/components/shop/DiscountBadge';
import { CommerceOnly } from '@/components/commerce/SalesProvider';

type Item = { _id: string; name: string; slug: string; price: number; discountPrice?: number; images?: string[] };

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/dashboard/wishlist');
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'خطا');
      setItems(d.items || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <DashCard title="علاقه‌مندی‌ها">
      {loading ? (
        <DashLoading />
      ) : error ? (
        <DashError text={error} />
      ) : items.length === 0 ? (
        <DashEmpty text="هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <article key={p._id} className="rounded-[1.5rem] border border-paper-200 bg-paper-50 p-3">
              <img
                src={p.images?.[0] || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'}
                alt={p.name}
                className="h-32 w-full rounded-2xl object-cover"
              />
              <h3 className="mt-3 font-black text-ink-900">{p.name}</h3>
              <ProductPriceWithDiscount
                className="mt-2"
                salePrice={p.discountPrice ?? p.price}
                originalPrice={p.price}
                hasDiscount={Boolean(p.discountPrice && p.discountPrice < p.price)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/dashboard/wishlist', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: p._id })
                    });
                    void load();
                  }}
                  className="rounded-full border border-paper-200 px-3 py-1 text-sm text-red-700"
                >
                  حذف
                </button>
                <Link href={`/products/${p.slug}`} className="rounded-full border border-paper-200 px-3 py-1 text-sm">
                  مشاهده اطلاعات محصول
                </Link>
                <CommerceOnly>
                  <AddToCartButton productId={p._id} className="ph-btn-primary !px-3 !py-1 text-sm" />
                </CommerceOnly>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashCard>
  );
}
