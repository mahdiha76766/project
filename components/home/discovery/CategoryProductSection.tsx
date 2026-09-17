'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Leaf, Sparkles, Tag } from 'lucide-react';
import { Section } from '@/components/home/Section';
import { Reveal } from '@/components/home/Reveal';
import { DiscoveryProductCard } from '@/components/home/discovery/DiscoveryProductCard';
import { SiteButton } from '@/components/ui/SiteButton';
import { cn } from '@/lib/utils/cn';
import type { HomeProduct } from '@/lib/shop/home-types';
import type { ShelfLayout, ShelfTone } from '@/lib/shop/shelf-types';

const toneStyles: Record<
  ShelfTone,
  { badge: string; glow: string; Icon: typeof Leaf }
> = {
  brand: {
    badge: 'border-brand-200 bg-brand-50 text-brand-700',
    glow: 'bg-brand-100/45',
    Icon: Leaf
  },
  accent: {
    badge: 'border-accent-200 bg-accent-50 text-accent-700',
    glow: 'bg-accent-100/40',
    Icon: Flame
  },
  emerald: {
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    glow: 'bg-emerald-100/40',
    Icon: Leaf
  },
  rose: {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    glow: 'bg-rose-100/35',
    Icon: Tag
  },
  muted: {
    badge: 'border-surface-200 bg-white text-surface-700',
    glow: 'bg-surface-100/60',
    Icon: Sparkles
  }
};

export type CategoryProductSectionProps = {
  title: string;
  description?: string;
  label?: string;
  products: HomeProduct[];
  viewAllHref: string;
  viewAllLabel?: string;
  /** Category slug for documentation / future CMS; filtering already applied server-side */
  category?: string;
  sort?: string;
  layout?: ShelfLayout;
  tone?: ShelfTone;
  bg?: 'white' | 'muted';
  className?: string;
};

/**
 * Reusable Digikala-style category merchandising block.
 * Pass pre-filtered available products from the server (CategoryProductSection does not fetch).
 */
export function CategoryProductSection({
  title,
  description,
  label = 'دسته',
  products,
  viewAllHref,
  viewAllLabel = 'مشاهده همه',
  layout = 'rail',
  tone = 'brand',
  bg = 'white',
  className
}: CategoryProductSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);
  const { badge, glow, Icon } = toneStyles[tone];

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
  }, [products.length, layout]);

  if (!products.length) return null;

  const scroll = (dir: -1 | 1) => {
    trackRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  const header = (
    <div className="relative mb-7 flex flex-wrap items-end justify-between gap-4 lg:mb-9">
      <div className="max-w-xl">
        <p className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black', badge)}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </p>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-surface-900 sm:text-3xl lg:text-[2.1rem]">{title}</h2>
        {description ? <p className="mt-2.5 text-sm leading-7 text-surface-500">{description}</p> : null}
      </div>
      <div className="flex items-center gap-2">
        {layout === 'rail' ? (
          <div className="hidden items-center gap-2 sm:flex">
            <SiteButton
              variant="outline"
              size="icon"
              aria-label="قبلی"
              disabled={!canPrev}
              onClick={() => scroll(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </SiteButton>
            <SiteButton
              variant="outline"
              size="icon"
              aria-label="بعدی"
              disabled={!canNext}
              onClick={() => scroll(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </SiteButton>
          </div>
        ) : null}
        <SiteButton href={viewAllHref} variant="outline" size="md">
          {viewAllLabel}
          <ChevronLeft className="h-3.5 w-3.5" />
        </SiteButton>
      </div>
    </div>
  );

  if (layout === 'spotlight') {
    const hero = products[0];
    const side = products.slice(1, 3);
    const rest = products.slice(3, 7);
    return (
      <Section bg={bg} className={cn('relative overflow-hidden !py-12 lg:!py-16', className)}>
        <div className={cn('pointer-events-none absolute -left-16 top-8 h-64 w-64 rounded-full blur-3xl', glow)} />
        {header}
        <div className="relative grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <DiscoveryProductCard product={hero} variant="spotlight" rank={0} />
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
            {side.map((product, index) => (
              <Reveal key={product.id} delay={(index + 1) * 80}>
                <DiscoveryProductCard product={product} variant="compact" rank={index + 1} />
              </Reveal>
            ))}
          </div>
        </div>
        {rest.length ? (
          <div className="relative mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((product, index) => (
              <Reveal key={product.id} delay={(index + 3) * 60}>
                <DiscoveryProductCard product={product} variant="editorial" rank={index + 3} />
              </Reveal>
            ))}
          </div>
        ) : null}
      </Section>
    );
  }

  if (layout === 'grid') {
    return (
      <Section bg={bg} className={cn('relative overflow-hidden !py-12 lg:!py-16', className)}>
        <div className={cn('pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full blur-3xl', glow)} />
        {header}
        {/* Mobile: horizontal rail */}
        <div className="-mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          {products.map((product) => (
            <div key={product.id} className="w-[72vw] max-w-[16rem] shrink-0 snap-start">
              <DiscoveryProductCard product={product} variant="editorial" />
            </div>
          ))}
        </div>
        {/* Tablet/Desktop grid */}
        <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.slice(0, 10).map((product, index) => (
            <Reveal key={product.id} delay={Math.min(index, 6) * 45}>
              <DiscoveryProductCard product={product} variant="editorial" />
            </Reveal>
          ))}
        </div>
      </Section>
    );
  }

  // Default: rail — horizontal browse on all breakpoints
  return (
    <Section bg={bg} className={cn('relative overflow-hidden !py-12 lg:!py-16', className)}>
      <div className={cn('pointer-events-none absolute left-1/2 top-0 h-40 w-[28rem] -translate-x-1/2 rounded-full blur-3xl', glow)} />
      {header}
      <div
        ref={trackRef}
        className="home-product-track -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:gap-5 sm:px-0"
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="home-product-slide w-[72vw] max-w-[16rem] shrink-0 snap-start sm:w-[min(78%,16.5rem)] md:w-[17.5rem] lg:w-[18rem]"
            style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
          >
            <DiscoveryProductCard product={product} variant="editorial" />
          </div>
        ))}
      </div>
    </Section>
  );
}
