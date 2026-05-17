'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { HeroSlide } from '@/lib/admin/slider-settings';

export const HeroSlider = ({ slides }: { slides: HeroSlide[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  const active = slides[index];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-lg">
      <img src={active.image} alt={active.title} className="h-[380px] w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-black/20" />
      <div className="absolute inset-0 z-10 flex items-end p-8 text-white">
        <div>
          <h1 className="text-3xl font-black md:text-4xl">{active.title}</h1>
          <p className="mt-2 text-white/90">{active.subtitle}</p>
          <Link href={active.ctaLink} className="mt-4 inline-block rounded-xl bg-amber-700 px-5 py-3">{active.ctaText}</Link>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((_, i) => (
          <button key={i} onClick={() => setIndex(i)} className={`h-2.5 w-6 rounded-full ${i === index ? 'bg-amber-300' : 'bg-white/60'}`} />
        ))}
      </div>
    </section>
  );
};
