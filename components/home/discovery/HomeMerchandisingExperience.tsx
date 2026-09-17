'use client';

import { useMemo } from 'react';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { BestsellersSpotlight } from '@/components/home/discovery/BestsellersSpotlight';
import { FreshArrivals } from '@/components/home/discovery/FreshArrivals';
import { CollectionStudio } from '@/components/home/discovery/CollectionStudio';
import type { HomeProduct } from '@/lib/shop/home-types';
import type { HomeProductSectionConfig } from '@/lib/shop/home-product-sections';

type SectionData = { config: HomeProductSectionConfig; products: HomeProduct[] };

export function HomeMerchandisingExperience({ sections }: { sections: SectionData[] }) {
  const { content } = useSiteContent();

  const merged = useMemo(
    () =>
      sections
        .map((s) => {
          const cfg =
            content.home.productSections.find((c) => c.id === s.config.id) ||
            content.home.productSections[sections.indexOf(s)] ||
            s.config;
          return { config: cfg, products: s.products };
        })
        .filter((s) => s.config.enabled && s.products.length > 0),
    [sections, content.home.productSections]
  );

  if (!merged.length) return null;

  const newest = merged.find((s) => s.config.filterType === 'NEWEST');
  const bestsellers = merged.find((s) => s.config.filterType === 'BEST_SELLING');
  const others = merged.filter(
    (s) => s.config.filterType !== 'NEWEST' && s.config.filterType !== 'BEST_SELLING'
  );

  return (
    <>
      {bestsellers ? (
        <BestsellersSpotlight
          products={bestsellers.products}
          label={bestsellers.config.label}
          title={bestsellers.config.title}
        />
      ) : null}
      {newest ? (
        <FreshArrivals products={newest.products} label={newest.config.label} title={newest.config.title} />
      ) : null}
      {others.length ? <CollectionStudio collections={others} /> : null}
    </>
  );
}
