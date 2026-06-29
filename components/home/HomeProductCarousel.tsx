'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { HomeProductCard } from './HomeProductCard';
import type { HomeProduct } from '@/lib/shop/home-types';
import type { HomeSectionDesign } from '@/lib/shop/home-product-sections';

const cardWrap: Record<HomeSectionDesign, string> = {
  classic: 'min-w-[252px] max-w-[252px] sm:min-w-[272px] sm:max-w-[272px]',
  minimal: 'min-w-[236px] max-w-[236px]',
  accent: 'min-w-[280px] max-w-[280px]'
};

export function HomeProductCarousel({
  products,
  design = 'classic'
}: {
  products: HomeProduct[];
  design?: HomeSectionDesign;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeDot, setActiveDot] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const dotCount = Math.min(8, Math.max(1, Math.ceil(products.length / 3)));

  const syncNav = () => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // Handle RTL scrollLeft (can be negative in some browsers)
    const scrollPos = Math.abs(el.scrollLeft);
    
    setCanPrev(scrollPos > 8);
    setCanNext(scrollPos < max - 8);
    
    const ratio = max > 0 ? scrollPos / max : 0;
    setActiveDot(Math.round(ratio * (dotCount - 1)));
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncNav();

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        // Standardize RTL wheel scroll horizontal behavior
        el.scrollBy({ left: -e.deltaY * 1.2, behavior: 'auto' });
      }
    };

    el.addEventListener('scroll', syncNav, { passive: true });
    el.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      el.removeEventListener('scroll', syncNav);
      el.removeEventListener('wheel', handleWheel);
    };
  }, [products.length, dotCount]);

  const scroll = (dir: -1 | 1) => {
    trackRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  if (!products.length) return null;

  return (
    <div className="group/carousel relative">
      <button
        type="button"
        aria-label="قبلی"
        disabled={!canPrev}
        onClick={() => scroll(1)}
        className="absolute -right-2 top-[45%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-surface-200 bg-white/95 text-surface-700 shadow-md backdrop-blur transition-all duration-300 hover:scale-105 hover:border-brand-500 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-0 md:-right-5 md:h-11 md:w-11"
      >
        <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
      </button>
      <button
        type="button"
        aria-label="بعدی"
        disabled={!canNext}
        onClick={() => scroll(-1)}
        className="absolute -left-2 top-[45%] z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-surface-200 bg-white/95 text-surface-700 shadow-md backdrop-blur transition-all duration-300 hover:scale-105 hover:border-brand-500 hover:text-brand-600 disabled:pointer-events-none disabled:opacity-0 md:-left-5 md:h-11 md:w-11"
      >
        <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
      </button>

      <div
        ref={trackRef}
        className="home-product-track flex gap-5 overflow-x-auto py-4 px-1 scroll-smooth snap-x snap-mandatory"
      >
        {products.map((p, i) => (
          <div
            key={p.id}
            className={`home-product-slide shrink-0 snap-start ${cardWrap[design]}`}
            style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
          >
            <div className="h-full">
              <HomeProductCard product={p} />
            </div>
          </div>
        ))}
      </div>

      {dotCount > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {Array.from({ length: dotCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`اسلاید ${i + 1}`}
              onClick={() => {
                const el = trackRef.current;
                if (!el) return;
                const max = el.scrollWidth - el.clientWidth;
                // In RTL, we might need to scroll to a negative position depending on browser
                const target = (max / Math.max(dotCount - 1, 1)) * i;
                el.scrollTo({ 
                  left: el.scrollLeft > 0 ? target : -target, 
                  behavior: 'smooth' 
                });
              }}
              className={`h-2 rounded-full transition-all ${activeDot === i ? 'w-6 bg-amber-600' : 'w-2 bg-slate-300 hover:bg-amber-300'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function HomeProductSectionShell({
  config,
  children
}: {
  config: { label: string; title: string; design: HomeSectionDesign };
  children: React.ReactNode;
}) {
  const shell = useMemo(() => {
    if (config.design === 'accent') {
      return {
        wrap: 'relative overflow-hidden rounded-[2rem] border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 md:p-8 shadow-sm',
        decor: (
          <>
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-orange-200/25 blur-3xl" />
          </>
        ),
        label: 'inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white/80 px-3 py-1 text-xs font-bold text-amber-800',
        title: 'text-2xl font-black text-slate-900 md:text-3xl'
      };
    }
    if (config.design === 'minimal') {
      return {
        wrap: 'rounded-2xl border border-slate-200 bg-white p-6 md:p-7',
        decor: null,
        label: 'text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400',
        title: 'text-xl font-black text-slate-900 md:text-2xl'
      };
    }
    return {
      wrap: 'relative',
      decor: <div className=" " />,
      label: 'text-xs font-bold text-amber-700',
      title: 'text-2xl font-black text-slate-900'
    };
  }, [config.design]);

  return (
    <div className={shell.wrap}>
      {shell.decor}
      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          {config.label ? <p className={shell.label}>{config.label}</p> : null}
          <h2 className={`${shell.title} ${config.label ? 'mt-2' : ''}`}>{config.title}</h2>
        </div>
        {config.design === 'accent' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-3 py-1 text-xs font-bold text-white">
            <Sparkles className="h-3.5 w-3.5" />
            ویژه
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
