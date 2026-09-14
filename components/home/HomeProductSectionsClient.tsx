'use client';

import Link from 'next/link';
import { Section } from './Section';
import { HomeProductCarousel, HomeProductSectionShell } from './HomeProductCarousel';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import type { HomeProduct } from '@/lib/shop/home-types';
import type { HomeProductSectionConfig } from '@/lib/shop/home-product-sections';

type SectionData = { config: HomeProductSectionConfig; products: HomeProduct[] };

export function HomeProductSectionsClient({ sections }: { sections: SectionData[] }) {
  const { content } = useSiteContent();

  const merged = sections
    .map((s) => {
      const cfg =
        content.home.productSections.find((c) => c.id === s.config.id) ||
        content.home.productSections[sections.indexOf(s)] ||
        s.config;
      return { config: cfg, products: s.products };
    })
    .filter((s) => s.config.enabled && s.products.length > 0);

  if (!merged.length) return null;

  return (
    <>
      {merged.map(({ config, products }) => (
        <Section key={config.id} bg={config.design === 'minimal' ? 'white' : 'muted'}>
          <HomeProductSectionShell config={config}>
            <HomeProductCarousel products={products} design={config.design} />
          </HomeProductSectionShell>
          <div className="mt-5 text-left">
            <Link href="/products" className="inline-flex items-center rounded-full border border-brand-200 bg-white px-4 py-2 text-xs font-black text-brand-800 transition hover:border-brand-700 hover:bg-brand-800 hover:text-white">
              مشاهده همه محصولات ←
            </Link>
          </div>
        </Section>
      ))}
    </>
  );
}
