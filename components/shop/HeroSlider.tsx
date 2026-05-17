'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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
    const t = setInterval(() => setIndex((p) => (p + 1) % safeSlides.length), 5000);
    return () => clearInterval(t);
  }, [safeSlides.length]);

  if (!safeSlides.length) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#2f261f]">
      <div className="relative h-[340px] sm:h-[420px] lg:h-[520px]">
        {safeSlides.map((slide, i) => {
          const active = i === index;
          return (
            <div key={`${slide.title}-${i}`} className={`absolute inset-0 transition-all duration-700 ${active ? 'z-20 opacity-100' : 'z-10 opacity-0'}`}>
              <img src={slide.image} alt={slide.title} className={`h-full w-full object-cover transition-transform duration-[5200ms] ${active ? 'scale-110' : 'scale-100'}`} />
              <div className="absolute inset-0 bg-gradient-to-l from-[#1f160f]/85 via-[#2f261f]/40 to-transparent" />
              <div className={`absolute inset-x-0 bottom-0 p-6 text-white sm:p-8 lg:p-12 transition-all duration-700 ${active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <span className="inline-block rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs backdrop-blur">تازه از پنل مدیریت</span>
                <h1 className="mt-3 max-w-3xl text-2xl font-black leading-tight sm:text-3xl lg:text-5xl">{slide.title}</h1>
                <p className="mt-3 max-w-2xl text-sm text-white/90 sm:text-base">{slide.subtitle}</p>
                <Link href={slide.ctaLink} className="mt-5 inline-block rounded-xl bg-[#c69a3a] px-6 py-3 text-sm font-bold text-white transition hover:brightness-110">{slide.ctaText}</Link>
              </div>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
        {safeSlides.map((slide, i) => (
          <button key={`${slide.title}-dot-${i}`} onClick={() => setIndex(i)} aria-label={`slide-${i + 1}`} className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-[#d8b372]' : 'w-2.5 bg-white/70'}`} />
        ))}
      </div>
    </section>
  );
};
