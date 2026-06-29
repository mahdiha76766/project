'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { RtlForwardArrow } from './RtlForwardArrow';
import type { HeroSlide } from '@/lib/admin/slider-config';

type Props = {
  slides: HeroSlide[];
  autoplayInterval?: number;
};

export function AdvancedHeroSlider({ slides, autoplayInterval = 6000 }: Props) {
  const total = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef(Date.now());

  const goTo = useCallback(
    (i: number) => {
      setIndex(((i % total) + total) % total);
      setProgress(0);
      startRef.current = Date.now();
    },
    [total]
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    startRef.current = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min((elapsed / autoplayInterval) * 100, 100));
      if (elapsed >= autoplayInterval) {
        setIndex((i) => (i + 1) % total);
        startRef.current = Date.now();
        setProgress(0);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [index, total, paused, autoplayInterval]);

  if (!total) return null;
  const slide = slides[index];

  return (
    <section
      className="relative isolate min-h-[min(58vh,520px)] w-full overflow-hidden rounded-b-[2rem] bg-slate-950 shadow-xl sm:min-h-[min(62vh,560px)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {slides.map((s, i) => (
        <div
          key={`${s.title}-${i}`}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <img src={s.image} alt="" className={`h-full w-full object-cover ${i === index ? 'scale-105' : 'scale-100'} transition-transform duration-[6000ms]`} />
          <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/45 to-black/15" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(217,119,6,0.22),transparent_55%)]" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full min-h-[inherit] max-w-7xl flex-col justify-center px-4 py-12 pb-24 sm:px-6 lg:px-8">
        <div key={index} className="max-w-xl">
          {slide.badge ? (
            <span className="mb-3 inline-flex rounded-full border border-amber-300/30 bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-200 backdrop-blur">
              {slide.badge}
            </span>
          ) : (
            <span className="mb-3 inline-block text-xs font-bold tracking-wide text-amber-200/90">عطاری آنلاین</span>
          )}
          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl lg:text-[2.75rem]">{slide.title}</h1>
          <p className="mt-4 max-w-lg text-base leading-8 text-white/75 sm:text-lg">{slide.subtitle}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={slide.ctaLink} className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-l from-amber-500 to-brand-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-900/25 transition hover:brightness-110">
              {slide.ctaText}
              <RtlForwardArrow className="text-white" />
            </Link>
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20">
              دسته‌بندی‌ها
            </Link>
          </div>
        </div>
      </div>

      {total > 1 ? (
        <>
          <button type="button" onClick={prev} aria-label="قبلی" className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur hover:bg-black/55 sm:right-5">
            <ChevronRight className="h-5 w-5" />
          </button>
          <button type="button" onClick={next} aria-label="بعدی" className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur hover:bg-black/55 sm:left-5">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="absolute bottom-0 inset-x-0 z-20 border-t border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <button type="button" onClick={() => setPaused((p) => !p)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white">
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
              <div className="hidden flex-1 gap-2 sm:flex">
                {slides.map((s, i) => (
                  <button key={i} type="button" onClick={() => goTo(i)} className={`h-14 w-24 overflow-hidden rounded-lg border-2 transition ${i === index ? 'border-amber-400' : 'border-white/10 opacity-60 hover:opacity-100'}`}>
                    <img src={s.image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15 sm:max-w-xs">
                <div className="h-full rounded-full bg-gradient-to-l from-amber-400 to-brand-500" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-[10px] font-bold text-white/50">{index + 1}/{total}</span>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
