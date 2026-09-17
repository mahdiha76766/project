'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import { Section } from '@/components/home/Section';
import { DiscoveryProductCard } from '@/components/home/discovery/DiscoveryProductCard';
import { SiteButton } from '@/components/ui/SiteButton';
import type { HomeProduct } from '@/lib/shop/home-types';

export function FreshArrivals({
  products,
  label = 'جدید',
  title = 'جدیدترین محصولات'
}: {
  products: HomeProduct[];
  label?: string;
  title?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const syncNav = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const scrollPos = Math.abs(el.scrollLeft);
    setCanPrev(scrollPos > 8);
    setCanNext(scrollPos < max - 8);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncNav();
    el.addEventListener('scroll', syncNav, { passive: true });
    return () => el.removeEventListener('scroll', syncNav);
  }, [products.length]);

  if (!products.length) return null;

  const scroll = (dir: -1 | 1) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <Section bg="white" className="relative overflow-hidden !py-14 lg:!py-20">
      <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-[36rem] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />

      <div className="relative mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-800">
            <Leaf className="h-3.5 w-3.5" /> {label}
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-surface-900 sm:text-3xl lg:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-surface-500">آخرین محصولات اضافه‌شده به فروشگاه.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            <SiteButton variant="outline" size="icon" aria-label="قبلی" disabled={!canPrev} onClick={() => scroll(1)}>
              <ChevronRight className="h-4 w-4" />
            </SiteButton>
            <SiteButton variant="outline" size="icon" aria-label="بعدی" disabled={!canNext} onClick={() => scroll(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </SiteButton>
          </div>
          <SiteButton href="/products?sort=newest" variant="outline" size="md">
            همه تازه‌ها
          </SiteButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:hidden">
        {products.slice(0, 6).map((product) => (
          <DiscoveryProductCard key={product.id} product={product} variant="editorial" />
        ))}
      </div>

      <div ref={trackRef} className="home-product-track hidden snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:flex">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="home-product-slide w-[min(78%,16.5rem)] shrink-0 snap-start md:w-[17.5rem] lg:w-[18.5rem]"
            style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
          >
            <DiscoveryProductCard product={product} variant="editorial" />
          </div>
        ))}
      </div>
    </Section>
  );
}
