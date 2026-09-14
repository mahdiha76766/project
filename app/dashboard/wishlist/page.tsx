'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashCard, DashEmpty, DashError, DashLoading } from '@/components/shop/DashboardUI';

type Item = { _id: string; name: string; slug: string; price: number; discountPrice?: number; images?: string[] };

export default function Page() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try { const r = await fetch('/api/dashboard/wishlist'); const d = await r.json(); if (!r.ok) throw new Error(d.error||'خطا'); setItems(d.items||[]); }
    catch (e:any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(()=>{void load();},[]);

  return (
    <DashCard title="علاقه‌مندی‌ها">
      {loading ? <DashLoading /> : error ? <DashError text={error} /> : items.length === 0 ? (
        <DashEmpty text="هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((product) => (
            <article key={product._id} className="rounded-xl border bg-white p-3">
              <img src={product.images?.[0] || 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5'} alt={product.name} className="h-32 w-full rounded-lg object-cover" />
              <h3 className="mt-2 font-bold text-slate-800">{product.name}</h3>
              <p className="text-sm text-slate-600">{(product.discountPrice ?? product.price).toLocaleString('fa-IR')} تومان</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/dashboard/wishlist', {
                      method: 'DELETE',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId: product._id })
                    });
                    void load();
                  }}
                  className="rounded-lg border px-3 py-1 text-sm text-red-700"
                >
                  حذف
                </button>
                <Link href={`/products/${product.slug}`} className="rounded-lg bg-amber-600 px-3 py-1 text-sm text-white">انتخاب و خرید</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashCard>
  );
}
