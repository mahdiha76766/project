'use client';

import { useMemo } from 'react';
import { useSiteContent } from '@/components/cms/SiteContentProvider';
import { BestsellersSpotlight } from '@/components/home/discovery/BestsellersSpotlight';
import { CategoryProductSection } from '@/components/home/discovery/CategoryProductSection';
import { CollectionStudio } from '@/components/home/discovery/CollectionStudio';
import type { HomeProduct } from '@/lib/shop/home-types';
import type { HomeProductSectionConfig } from '@/lib/shop/home-product-sections';
import type { CategoryShelf } from '@/lib/shop/shelf-types';

type SectionData = { config: HomeProductSectionConfig; products: HomeProduct[] };

/**
 * Marketplace homepage merchandising:
 * global bestsellers + dynamic category shelves + CMS collections.
 */
export function HomeMarketplaceExperience({
  sections,
  shelves
}: {
  sections: SectionData[];
  shelves: CategoryShelf[];
}) {
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

  const bestsellers = merged.find((s) => s.config.filterType === 'BEST_SELLING');
  const others = merged.filter(
    (s) => s.config.filterType !== 'NEWEST' && s.config.filterType !== 'BEST_SELLING'
  );

  // Avoid repeating the same product ids too densely in consecutive shelves
  const usedIds = new Set<string>();
  if (bestsellers) bestsellers.products.forEach((p) => usedIds.add(p.id));

  const diversifiedShelves = shelves
    .map((shelf, index) => {
      const filtered = shelf.products.filter((p) => !usedIds.has(p.id));
      const products = filtered.length >= 3 ? filtered : shelf.products;
      products.forEach((p) => usedIds.add(p.id));
      return { ...shelf, products, bg: (index % 2 === 0 ? 'white' : 'muted') as 'white' | 'muted' };
    })
    .filter((s) => s.products.length > 0);

  // Interleave: first half of shelves, then CMS collections, then rest
  const mid = Math.ceil(diversifiedShelves.length / 2);
  const firstWave = diversifiedShelves.slice(0, mid);
  const secondWave = diversifiedShelves.slice(mid);

  if (!bestsellers && !diversifiedShelves.length && !others.length) return null;

  return (
    <>
      {bestsellers ? (
        <BestsellersSpotlight
          products={bestsellers.products}
          label={bestsellers.config.label}
          title={bestsellers.config.title}
        />
      ) : null}

      {firstWave.map((shelf) => (
        <CategoryProductSection
          key={shelf.id}
          title={shelf.title}
          description={shelf.description}
          label={shelf.label}
          products={shelf.products}
          viewAllHref={shelf.viewAllHref}
          category={shelf.category}
          sort={shelf.sort}
          layout={shelf.layout}
          tone={shelf.tone}
          bg={shelf.bg}
        />
      ))}

      {others.length ? <CollectionStudio collections={others} /> : null}

      {secondWave.map((shelf) => (
        <CategoryProductSection
          key={shelf.id}
          title={shelf.title}
          description={shelf.description}
          label={shelf.label}
          products={shelf.products}
          viewAllHref={shelf.viewAllHref}
          category={shelf.category}
          sort={shelf.sort}
          layout={shelf.layout}
          tone={shelf.tone}
          bg={shelf.bg}
        />
      ))}
    </>
  );
}
