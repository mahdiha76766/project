'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { RtlForwardArrow } from './RtlForwardArrow';
import type { HomeHeroSlide } from '@/lib/shop/home-types';

export function HomeHero({ slides }: { slides: HomeHeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const total = slides.length;

  useEffect(() => {
    if (total <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % total), 6000);
    return () => clearInterval(t);
  }, [total]);

  if (!total) return null;
  const slide = slides[index];

  return (
    <section className="overflow-hidden bg-surface-0 pt-10 pb-16 lg:pt-16 lg:pb-24">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <p className="site-label mb-4">عطاری آنلاین</p>
            <h1 className="text-4xl font-bold leading-[1.2] tracking-tight text-surface-900 sm:text-5xl lg:text-[3.25rem]">
              {slide.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-surface-500">{slide.subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={slide.ctaLink} className="site-btn-primary">
                {slide.ctaText}
                <RtlForwardArrow className="text-white" />
              </Link>
              <Link href="/categories" className="site-btn-outline">
                دسته‌بندی‌ها
              </Link>
            </div>
            <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-surface-200 pt-8">
              {[
                { k: '۱۰۰٪', v: 'طبیعی' },
                { k: '+۵۰', v: 'محصول' },
                { k: '۷ روز', v: 'ضمانت بازگشت' }
              ].map((s) => (
                <div key={s.v}>
                  <dt className="text-xl font-bold text-brand-600">{s.k}</dt>
                  <dd className="mt-0.5 text-xs text-surface-500">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl bg-surface-100 shadow-card">
              {slides.map((s, i) => (
                <img
                  key={`${s.title}-${i}`}
                  src={s.image}
                  alt={s.title}
                  className={`aspect-[4/5] w-full object-cover transition-opacity duration-700 sm:aspect-[5/4] ${i === index ? 'relative opacity-100' : 'absolute inset-0 opacity-0'}`}
                />
              ))}
            </div>

            {total > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i - 1 + total) % total)}
                  aria-label="قبلی"
                  className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-0/90 text-surface-700 shadow-soft backdrop-blur transition hover:bg-surface-0"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIndex((i) => (i + 1) % total)}
                  aria-label="بعدی"
                  className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-0/90 text-surface-700 shadow-soft backdrop-blur transition hover:bg-surface-0"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="mt-4 flex justify-center gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-label={`اسلاید ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-brand-600' : 'w-1.5 bg-surface-300'}`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}
