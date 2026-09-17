'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BadgeCheck, ChevronLeft, ChevronRight, Leaf, PackageCheck, Pause, Play, Sparkles } from 'lucide-react';
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
      className="relative isolate overflow-hidden bg-[#f7f3e8] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="pointer-events-none absolute inset-0 soft-noise opacity-35" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-[8%] h-72 w-72 rounded-full bg-accent-200/40 blur-3xl" />

      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.75rem] bg-brand-900 shadow-[0_30px_90px_-35px_rgba(26,46,36,0.55)] lg:rounded-[2.25rem]">
        <div className="organic-grid absolute inset-0 opacity-60" />
        <div className="relative grid min-h-[26rem] sm:min-h-[28rem] lg:grid-cols-[1.05fr_.95fr] lg:min-h-[30.5rem]">
          <div className="relative z-10 flex flex-col justify-center px-5 py-9 sm:px-9 sm:py-11 lg:px-12 lg:py-12">
            <div key={`copy-${index}`} className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-1.5 text-[11px] font-bold text-brand-100 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent-400" />
                {slide.badge || 'عطاری آنلاین و تخصصی'}
              </span>
              <h1 className="mt-4 max-w-xl text-[1.9rem] font-black leading-[1.35] tracking-tight text-white sm:text-4xl lg:text-[2.85rem]">
                {slide.title}
              </h1>
              <p className="mt-3.5 max-w-lg text-sm leading-7 text-brand-100/75 sm:text-[0.95rem] sm:leading-8 lg:text-base">
                {slide.subtitle}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={slide.ctaLink}
                  className="inline-flex items-center gap-2 rounded-2xl bg-accent-500 px-5 py-3 text-sm font-black text-white shadow-xl shadow-black/15 transition hover:-translate-y-1 hover:bg-accent-400"
                >
                  {slide.ctaText}
                  <RtlForwardArrow className="text-white" />
                </Link>
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.06] px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
                >
                  کشف دسته‌بندی‌ها
                </Link>
              </div>
              <div className="mt-7 grid max-w-xl grid-cols-2 gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                <span className="flex items-center gap-2 text-xs font-bold text-brand-100/80">
                  <Leaf className="h-4 w-4 text-accent-400" /> کاملاً طبیعی
                </span>
                <span className="flex items-center gap-2 text-xs font-bold text-brand-100/80">
                  <PackageCheck className="h-4 w-4 text-accent-400" /> بسته‌بندی تازه
                </span>
                <span className="hidden items-center gap-2 text-xs font-bold text-brand-100/80 sm:flex">
                  <BadgeCheck className="h-4 w-4 text-accent-400" /> تضمین اصالت
                </span>
              </div>
            </div>

            {total > 1 ? (
              <div className="mt-7 flex items-center gap-3 lg:mt-8">
                <button
                  type="button"
                  onClick={() => setPaused((p) => !p)}
                  aria-label={paused ? 'پخش اسلایدر' : 'توقف اسلایدر'}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                >
                  {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                </button>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-accent-400" style={{ width: `${progress}%` }} />
                </div>
                <span className="min-w-12 text-left text-[10px] font-black text-white/55">
                  {(index + 1).toLocaleString('fa-IR', { minimumIntegerDigits: 2 })} /{' '}
                  {total.toLocaleString('fa-IR', { minimumIntegerDigits: 2 })}
                </span>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="اسلاید قبلی"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="اسلاید بعدی"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="relative min-h-[16.5rem] overflow-hidden border-t border-white/10 sm:min-h-[18.5rem] lg:min-h-full lg:border-r lg:border-t-0">
            {slides.map((s, i) => (
              <div
                key={`${s.title}-${i}`}
                className={`absolute inset-0 transition-all duration-700 ${
                  i === index ? 'scale-100 opacity-100' : 'pointer-events-none scale-105 opacity-0'
                }`}
              >
                <img src={s.image} alt={s.title} className="h-full w-full object-cover object-center" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f1f17]/80 via-transparent to-brand-900/10" />
              </div>
            ))}
            <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-[#0f1f17]/60 p-3.5 text-white shadow-xl backdrop-blur-md sm:inset-x-6 sm:bottom-6 sm:p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-accent-300">انتخابی برای زندگی سالم‌تر</p>
                  <p className="mt-1 text-sm font-black">از طبیعت، برای خانه شما</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <Leaf className="h-5 w-5 text-accent-300" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
