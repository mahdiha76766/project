'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { HeroSlide } from '@/lib/admin/slider-settings';

export const HeroSlider = ({ slides }: { slides: HeroSlide[] }) => {
  const [index, setIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIndex((p) => (p + 1) % slides.length);
      setAnimKey((k) => k + 1);
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const active = slides[index];

  return (
    <section className="group relative overflow-hidden rounded-3xl border border-white/40 bg-slate-900 shadow-2xl">
      <img
        key={`img-${animKey}`}
        src={active.image}
        alt={active.title}
        className="hero-image h-[300px] w-full object-cover md:h-[420px]"
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.35),transparent_30%)]" />

      <div className="absolute inset-0 z-10 flex items-end p-4 md:p-8">
        <div key={`txt-${animKey}`} className="hero-text max-w-xl text-white">
          <span className="mb-3 inline-block rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs backdrop-blur">پیشنهاد ویژه فروشگاه</span>
          <h1 className="text-2xl font-black leading-tight md:text-4xl">{active.title}</h1>
          <p className="mt-2 text-sm text-white/90 md:text-base">{active.subtitle}</p>
          <Link href={active.ctaLink} className="mt-4 inline-flex items-center rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold transition hover:bg-amber-500 md:text-base">
            {active.ctaText}
          </Link>
        </div>
      </div>

      <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-5">
        {slides.map((s, i) => (
          <button
            key={s.title + i}
            onClick={() => {
              setIndex(i);
              setAnimKey((k) => k + 1);
            }}
            className={`h-2.5 rounded-full transition-all ${i === index ? 'w-8 bg-amber-300' : 'w-3 bg-white/60'}`}
          />
        ))}
      </div>
    </section>
  );
};
