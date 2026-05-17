'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface HeroSlide {
  title: string;
  subtitle: string;
  image: string;
  ctaText: string;
  ctaLink: string;
}

export const HeroSlider = ({ slides }: { slides: HeroSlide[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((p) => (p + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-100 shadow-xl">
      <div className="relative h-[360px] md:h-[460px]">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.title + i}
              className={`absolute inset-0 transition-all duration-700 ${active ? 'opacity-100 scale-100 z-20' : 'opacity-0 scale-105 z-10'}`}
            >
              <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent" />
              <div className={`absolute bottom-0 right-0 left-0 p-6 text-white md:p-10 transition-all duration-700 ${active ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                <span className="mb-3 inline-block rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs backdrop-blur">پیشنهاد ویژه عصاره طبیعت</span>
                <h1 className="text-2xl font-black leading-tight md:text-5xl">{slide.title}</h1>
                <p className="mt-3 max-w-2xl text-sm text-white/90 md:text-base">{slide.subtitle}</p>
                <Link href={slide.ctaLink} className="mt-5 inline-block rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-400 md:text-base">{slide.ctaText}</Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((slide, i) => (
          <button
            key={slide.title + i}
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-amber-300' : 'w-3 bg-white/70'}`}
          />
        ))}
      </div>
    </section>
  );
};
