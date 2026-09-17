'use client';

import Link from 'next/link';
import { ArrowUpLeft, Compass, LayoutGrid } from 'lucide-react';
import { Section } from '@/components/home/Section';
import { Reveal } from '@/components/home/Reveal';
import { cn } from '@/lib/utils/cn';
import type { HomeCategory } from '@/lib/shop/home-types';

export function CategoryShowcase({ categories }: { categories: HomeCategory[] }) {
  if (!categories.length) return null;

  const featured = categories[0];
  const secondary = categories.slice(1, 5);

  return (
    <Section bg="white" className="relative overflow-hidden !py-14 lg:!py-20">
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-accent-100/40 blur-3xl" />

      <div className="relative mb-8 flex flex-wrap items-end justify-between gap-4 lg:mb-10">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-black text-brand-700">
            <Compass className="h-3.5 w-3.5" /> دسته‌بندی‌ها
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-surface-900 sm:text-3xl lg:text-4xl">
            دسته‌بندی محصولات
          </h2>
          <p className="mt-3 text-sm leading-7 text-surface-500 sm:text-base">
            محصولات را بر اساس دسته‌بندی‌های فروشگاه مرور کنید.
          </p>
        </div>
        <Link
          href="/categories"
          className="inline-flex items-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-2.5 text-xs font-black text-brand-800 shadow-soft transition hover:border-brand-300 hover:bg-brand-800 hover:text-white"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          همه دسته‌بندی‌ها
        </Link>
      </div>

      {/* Mobile story rail */}
      <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {categories.map((cat, index) => (
          <div key={cat.id} className="w-[78vw] max-w-[19rem] shrink-0 snap-center sm:w-[42vw]">
            <CategoryTile category={cat} index={index} className="h-52 sm:h-60" />
          </div>
        ))}
      </div>

      {/* Desktop bento: featured 6 + 2x2 of 3 */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-12 lg:auto-rows-[15rem]">
        <Reveal className="lg:col-span-6 lg:row-span-2">
          <CategoryTile category={featured} featured index={0} className="h-full" />
        </Reveal>
        {secondary.map((cat, index) => (
          <Reveal key={cat.id} delay={(index + 1) * 70} className="lg:col-span-3">
            <CategoryTile category={cat} index={index + 1} className="h-full" />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function CategoryTile({
  category,
  featured,
  className
}: {
  category: HomeCategory;
  featured?: boolean;
  index?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className={cn(
        'group relative isolate block overflow-hidden rounded-[1.75rem] bg-brand-900 shadow-soft transition duration-500 hover:-translate-y-1 hover:shadow-card-hover',
        className
      )}
    >
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,133,70,0.22),transparent_48%)] opacity-0 transition duration-500 group-hover:opacity-100" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
        <div className="min-w-0">
          {typeof category.productCount === 'number' ? (
            <span className="mb-2 block text-[10px] font-black text-accent-300">
              {category.productCount.toLocaleString('fa-IR')} محصول
            </span>
          ) : (
            <span className="mb-2 block text-[10px] font-black text-accent-300">دسته</span>
          )}
          <h3 className={cn('font-black text-white', featured ? 'text-2xl sm:text-3xl' : 'text-lg')}>{category.name}</h3>
          {featured && category.description ? (
            <p className="mt-2 line-clamp-2 max-w-sm text-xs leading-6 text-white/70">{category.description}</p>
          ) : null}
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition group-hover:bg-accent-500">
          <ArrowUpLeft className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
