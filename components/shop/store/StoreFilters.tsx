'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Banknote, CheckCircle2, Filter, Percent, RotateCcw, Search } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { resolveImage } from '@/lib/shop/resolve-image';

export interface ProductFilterCategory {
  slug: string;
  name: string;
}

export const PRODUCT_USAGE_OPTIONS = [
  { value: 'EDIBLE', label: 'خوراکی' },
  { value: 'TOPICAL', label: 'مصرف موضعی' },
  { value: 'BOTH', label: 'خوراکی و موضعی' },
  { value: 'NON_EDIBLE', label: 'غیرخوراکی' }
] as const;

export type StoreFilterDefaults = {
  q?: string;
  category?: string;
  sort?: string;
  usage?: string;
  minPrice?: string;
  maxPrice?: string;
  stock?: boolean;
  discount?: boolean;
};

export function StoreFilters({
  categories = [],
  defaults = {},
  action = '/products',
  compact = false
}: {
  categories?: ProductFilterCategory[];
  defaults?: StoreFilterDefaults;
  action?: string;
  compact?: boolean;
}) {
  return (
    <aside className={compact ? '' : 'overflow-hidden rounded-[1.5rem] border border-surface-200 bg-white shadow-soft'}>
      <div className={compact ? 'mb-5 flex items-center justify-between' : 'flex items-center justify-between border-b border-surface-100 bg-gradient-to-l from-brand-50 to-white px-5 py-4'}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-800 text-white"><Filter className="h-3.5 w-3.5" /></span>
          <div>
            <h3 className="text-sm font-black text-surface-900">فیلتر محصولات</h3>
            <p className="mt-0.5 text-[10px] text-surface-400">انتخاب دقیق‌تر، خرید سریع‌تر</p>
          </div>
        </div>
        {(defaults.q || defaults.category || defaults.usage || defaults.minPrice || defaults.maxPrice || defaults.stock || defaults.discount || (defaults.sort && defaults.sort !== 'newest')) ? (
          <Link href={action} className="inline-flex items-center gap-1 text-[10px] font-bold text-surface-400 transition hover:text-rose-600"><RotateCcw className="h-3 w-3" /> پاک‌کردن</Link>
        ) : null}
      </div>
      <div className={compact ? 'space-y-4' : 'space-y-5 p-5'}>
        <div>
          <label htmlFor={compact ? 'q-mobile' : 'q'} className="mb-2 block text-[11px] font-black text-surface-600">جستجو در نتایج</label>
          <div className="relative">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input id={compact ? 'q-mobile' : 'q'} name="q" defaultValue={defaults.q} placeholder="نام محصول..." className="site-input bg-surface-50 pr-9" />
          </div>
        </div>
        <div>
          <label htmlFor={compact ? 'usage-mobile' : 'usage'} className="mb-2 block text-[11px] font-black text-surface-600">نوع مصرف</label>
          <select id={compact ? 'usage-mobile' : 'usage'} name="usage" defaultValue={defaults.usage || ''} className="site-input bg-surface-50">
            <option value="">همه کاربردها</option>
            {PRODUCT_USAGE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="mb-2 flex items-center gap-1.5 text-[11px] font-black text-surface-600"><Banknote className="h-3.5 w-3.5 text-brand-600" /> محدوده قیمت (تومان)</legend>
          <div className="grid grid-cols-2 gap-2">
            <input name="minPrice" inputMode="numeric" defaultValue={defaults.minPrice} placeholder="از قیمت" aria-label="حداقل قیمت" className="site-input bg-surface-50 px-3 text-xs" />
            <input name="maxPrice" inputMode="numeric" defaultValue={defaults.maxPrice} placeholder="تا قیمت" aria-label="حداکثر قیمت" className="site-input bg-surface-50 px-3 text-xs" />
          </div>
        </fieldset>
        <div className="space-y-2 rounded-2xl bg-surface-50 p-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-surface-700">
            <input type="checkbox" name="stock" value="1" defaultChecked={defaults.stock} className="h-4 w-4 accent-brand-700" />
            <CheckCircle2 className="h-4 w-4 text-brand-600" /> فقط کالاهای موجود
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-xs font-bold text-surface-700">
            <input type="checkbox" name="discount" value="1" defaultChecked={defaults.discount} className="h-4 w-4 accent-rose-600" />
            <Percent className="h-4 w-4 text-rose-500" /> فقط محصولات تخفیف‌دار
          </label>
        </div>
        <div>
          <label htmlFor={compact ? 'category-mobile' : 'category'} className="mb-2 block text-[11px] font-black text-surface-600">دسته‌بندی</label>
          <select id={compact ? 'category-mobile' : 'category'} name="category" defaultValue={defaults.category || ''} className="site-input bg-surface-50">
            <option value="">همه دسته‌بندی‌ها</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={compact ? 'sort-mobile' : 'sort'} className="mb-2 block text-[11px] font-black text-surface-600">مرتب‌سازی</label>
          <select id={compact ? 'sort-mobile' : 'sort'} name="sort" defaultValue={defaults.sort || 'newest'} className="site-input bg-surface-50">
            <option value="newest">جدیدترین</option>
            <option value="best_selling">پرفروش</option>
            <option value="cheapest">ارزان‌ترین</option>
            <option value="expensive">گران‌ترین</option>
          </select>
        </div>
        <button type="submit" className="site-btn-primary w-full !rounded-2xl">نمایش نتایج <ArrowLeft className="h-4 w-4" /></button>
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
