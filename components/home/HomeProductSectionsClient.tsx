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
          <div className="mt-4 text-left">
            <Link href="/products" className="text-sm font-bold text-amber-700 hover:underline">
              مشاهده همه محصولات ←
            </Link>
          </div>
        </Section>
      ))}
    </>
  );
}
