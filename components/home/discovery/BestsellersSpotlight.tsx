'use client';

import { Crown, TrendingUp } from 'lucide-react';
import { Section } from '@/components/home/Section';
import { Reveal } from '@/components/home/Reveal';
import { DiscoveryProductCard } from '@/components/home/discovery/DiscoveryProductCard';
import { SiteButton } from '@/components/ui/SiteButton';
import type { HomeProduct } from '@/lib/shop/home-types';

export function BestsellersSpotlight({
  products,
  label = 'پرفروش',
  title = 'محصولات پرفروش'
}: {
  products: HomeProduct[];
  label?: string;
  title?: string;
}) {
  if (!products.length) return null;

  const hero = products[0];
  const side = products.slice(1, 3);
  const rest = products.slice(3, 7);

  return (
    <Section bg="muted" className="relative overflow-hidden !py-14 lg:!py-20">
      <div className="pointer-events-none absolute inset-0 soft-noise opacity-40" />
      <div className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-accent-200/30 blur-3xl" />

      <div className="relative mb-8 flex flex-wrap items-end justify-between gap-4 lg:mb-10">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-accent-200 bg-white/80 px-3 py-1 text-[11px] font-black text-accent-700">
            <Crown className="h-3.5 w-3.5" /> {label}
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-surface-900 sm:text-3xl lg:text-4xl">{title}</h2>
          <p className="mt-3 text-sm leading-7 text-surface-500 sm:text-base">
            محصولات پرفروش فروشگاه را در این بخش ببینید.
          </p>
        </div>
        <SiteButton href="/products?sort=best_selling" variant="primary" size="md">
          <TrendingUp className="h-3.5 w-3.5" />
          مشاهده بیشتر
        </SiteButton>
      </div>

      <div className="relative grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <DiscoveryProductCard product={hero} variant="spotlight" rank={0} />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          {side.map((product, index) => (
            <Reveal key={product.id} delay={(index + 1) * 90}>
              <DiscoveryProductCard product={product} variant="compact" rank={index + 1} />
            </Reveal>
          ))}
        </div>
      </div>

      {rest.length ? (
        <div className="relative mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {rest.map((product, index) => (
            <Reveal key={product.id} delay={(index + 3) * 70}>
              <DiscoveryProductCard product={product} variant="editorial" rank={index + 3} />
            </Reveal>
          ))}
        </div>
      ) : null}
    </Section>
  );
}
