'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export const HeroSlider = ({ slides }: { slides: HeroSlide[] }) => {
  const safeSlides = useMemo(() => (slides.length ? slides : []), [slides]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!safeSlides.length) return;
    const t = setInterval(() => setIndex((p) => (p + 1) % safeSlides.length), 6000);
    return () => clearInterval(t);
  }, [safeSlides.length]);

  if (!safeSlides.length) return null;

  const prev = () => setIndex((p) => (p - 1 + safeSlides.length) % safeSlides.length);
  const next = () => setIndex((p) => (p + 1) % safeSlides.length);

  return (
    <section className="home-hero relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem]">
      <div className="home-hero-orb pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="home-hero-orb pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-gold-400/15 blur-3xl" />

      <div className="relative h-[380px] sm:h-[460px] lg:h-[560px]">
        {safeSlides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={`${slide.title}-${i}`}
              className={`absolute inset-0 transition-all duration-1000 ease-out ${active ? 'z-20 scale-100 opacity-100' : 'z-10 scale-105 opacity-0'}`}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className={`h-full w-full object-cover transition-transform duration-[8000ms] ease-out ${active ? 'scale-110' : 'scale-100'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-surface-900/90 via-surface-800/50 to-surface-900/10" />

              <div
                className={`absolute inset-x-0 bottom-0 p-6 text-white transition-all duration-1000 sm:p-10 lg:p-12 ${
                  active ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}
              >
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold backdrop-blur-md">
                  ✦ نابسرا
                </span>
                <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl lg:leading-[1.15]">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 sm:text-base">{slide.subtitle}</p>
                <Link
                  href={slide.ctaLink}
                  className="home-shimmer-btn mt-6 inline-flex items-center gap-2 rounded-full bg-gold-500 px-7 py-3.5 text-sm font-black text-surface-900 shadow-[0_8px_30px_rgba(198,154,58,0.35)] transition hover:scale-105"
                >
                  {slide.ctaText}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* RTL: قبلی = راست + فلش راست | بعدی = چپ + فلش چپ */}
      <button
        type="button"
        onClick={prev}
        aria-label="اسلاید قبلی"
        className="absolute right-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-surface-900/40 text-white backdrop-blur-sm transition hover:bg-surface-900/60 sm:right-4 sm:h-11 sm:w-11"
      >
        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="اسلاید بعدی"
        className="absolute left-3 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-surface-900/40 text-white backdrop-blur-sm transition hover:bg-surface-900/60 sm:left-4 sm:h-11 sm:w-11"
      >
        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>

      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2 rounded-full bg-surface-900/40 px-4 py-2.5 backdrop-blur-md">
        {safeSlides.map((slide, i) => (
          <button
            key={`${slide.title}-dot-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`اسلاید ${i + 1}`}
            aria-current={i === index ? 'true' : undefined}
            className={`h-2 rounded-full transition-all duration-500 ${i === index ? 'w-8 bg-gold-400' : 'w-2 bg-white/50 hover:bg-white/80'}`}
          />
        ))}
      </div>
    </section>
  );
};
