'use client';

import { useMemo, useState } from 'react';
import { BadgePercent, Sparkles } from 'lucide-react';
import { Section } from '@/components/home/Section';
import { DiscoveryProductCard } from '@/components/home/discovery/DiscoveryProductCard';
import { SiteButton } from '@/components/ui/SiteButton';
import type { HomeProduct } from '@/lib/shop/home-types';
import type { HomeProductSectionConfig } from '@/lib/shop/home-product-sections';

type Collection = {
  config: HomeProductSectionConfig;
  products: HomeProduct[];
};

const filterHref: Record<string, string> = {
  ON_SALE: '/products?discount=1',
  FEATURED: '/products?sort=best_selling',
  EDIBLE: '/products?usage=EDIBLE',
  NON_EDIBLE: '/products?usage=TOPICAL',
  LOWEST_PRICE: '/products?sort=cheapest',
  HIGHEST_PRICE: '/products?sort=expensive',
  RANDOM: '/products',
  HIGHEST_STOCK: '/products?stock=1'
};

export function CollectionStudio({ collections }: { collections: Collection[] }) {
  const tabs = useMemo(
    () => collections.filter((c) => c.config.enabled && c.products.length > 0),
    [collections]
  );

  const [activeId, setActiveId] = useState(tabs[0]?.config.id || '');
  const active = tabs.find((t) => t.config.id === activeId) || tabs[0];

  if (!tabs.length || !active) return null;

  const href = filterHref[active.config.filterType] || '/products';

  return (
    <Section bg="muted" className="relative overflow-hidden !py-14 lg:!py-20">
      <div className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-rose-100/40 blur-3xl" />

      <div className="relative mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-[11px] font-black text-rose-700">
            <BadgePercent className="h-3.5 w-3.5" /> پیشنهادها
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-surface-900 sm:text-3xl lg:text-4xl">
            پیشنهادهای ویژه
          </h2>
          <p className="mt-3 text-sm leading-7 text-surface-500">مجموعه‌های منتخب فروشگاه.</p>
        </div>
        <SiteButton href={href} variant="outline" size="md">
          <Sparkles className="h-3.5 w-3.5" />
          مشاهده همه
        </SiteButton>
      </div>

      <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => {
          const selected = tab.config.id === active.config.id;
          return (
            <SiteButton
              key={tab.config.id}
              type="button"
              variant={selected ? 'primary' : 'outline'}
              size="md"
              onClick={() => setActiveId(tab.config.id)}
              className="shrink-0"
            >
              {tab.config.label || tab.config.title}
              <span className={selected ? 'text-accent-300' : 'text-surface-400'}>
                {tab.products.length.toLocaleString('fa-IR')}
              </span>
            </SiteButton>
          );
        })}
      </div>

      <div className="rounded-[1.75rem] border border-surface-200/80 bg-white/70 p-4 shadow-soft backdrop-blur sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-black text-accent-600">{active.config.label}</p>
            <h3 className="mt-1 text-lg font-black text-surface-900 sm:text-xl">{active.config.title}</h3>
          </div>
        </div>

        <div
          key={active.config.id}
          className="grid animate-[fadeUp_0.45s_ease] grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5"
        >
          {active.products.slice(0, 10).map((product) => (
            <DiscoveryProductCard key={product.id} product={product} variant="editorial" />
          ))}
        </div>
      </div>
    </Section>
  );
}
