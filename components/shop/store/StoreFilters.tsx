'use client';

import { useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { resolveImage } from '@/lib/shop/resolve-image';

export interface ProductFilterCategory {
  slug: string;
  name: string;
}

export function StoreFilters({
  categories = [],
  defaults = {},
  action = '/products'
}: {
  categories?: ProductFilterCategory[];
  defaults?: { q?: string; category?: string; sort?: string };
  action?: string;
}) {
  return (
    <aside className="rounded-2xl border border-surface-200 bg-surface-0 p-5">
      <div className="mb-5 flex items-center gap-2">
        <Filter className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-bold text-surface-900">فیلتر</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="q" className="mb-1.5 block text-xs font-medium text-surface-500">جستجو</label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input id="q" name="q" defaultValue={defaults.q} placeholder="نام محصول..." className="site-input pr-9" />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="mb-1.5 block text-xs font-medium text-surface-500">دسته</label>
          <select id="category" name="category" defaultValue={defaults.category || ''} className="site-input">
            <option value="">همه</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="mb-1.5 block text-xs font-medium text-surface-500">مرتب‌سازی</label>
          <select id="sort" name="sort" defaultValue={defaults.sort || 'newest'} className="site-input">
            <option value="newest">جدیدترین</option>
            <option value="best_selling">پرفروش</option>
            <option value="cheapest">ارزان‌ترین</option>
            <option value="expensive">گران‌ترین</option>
          </select>
        </div>
        <button type="submit" className="site-btn-primary w-full">اعمال</button>
      </div>
    </aside>
  );
}

export function StoreBlogToolbar({
  categories,
  defaults
}: {
  categories: string[];
  defaults: { q?: string; category?: string; sort?: string };
}) {
  return (
    <form action="/blog" className="rounded-2xl border border-surface-200 bg-surface-0 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input name="q" defaultValue={defaults.q} placeholder="جستجو..." className="site-input pr-9" />
        </div>
        <select name="category" defaultValue={defaults.category || ''} className="site-input">
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select name="sort" defaultValue={defaults.sort || 'newest'} className="site-input">
          <option value="newest">جدیدترین</option>
          <option value="popular">پربازدید</option>
        </select>
        <button type="submit" className="site-btn-primary">اعمال</button>
      </div>
    </form>
  );
}

export function StoreGallery({ images, name }: { images: string[]; name: string }) {
  const imgs = images.length ? images.map((img) => resolveImage(img)) : [resolveImage(undefined)];
  const [active, setActive] = useState(0);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl bg-surface-100">
        <img src={imgs[active]} alt={name} className="aspect-square w-full object-cover sm:aspect-[4/3]" />
      </div>
      {imgs.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {imgs.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2',
                i === active ? 'border-brand-600' : 'border-surface-200 opacity-60'
              )}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
