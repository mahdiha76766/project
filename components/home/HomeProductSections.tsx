import Link from 'next/link';
import { Section } from './Section';
import { HomeProductCarousel } from './HomeProductCarousel';
import type { HomeProduct } from '@/lib/shop/home-types';
import type { HomeProductSectionConfig } from '@/lib/shop/home-product-sections';

export function HomeProductSections({
  sections
}: {
  sections: Array<{ config: HomeProductSectionConfig; products: HomeProduct[] }>;
}) {
  const visible = sections.filter((s) => s.config.enabled && s.products.length > 0);
  if (!visible.length) return null;

  return (
    <>
      {visible.map(({ config, products }) => (
        <Section key={config.id} bg={config.design === 'minimal' ? 'white' : 'muted'}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              {config.label ? (
                <p className="text-xs font-bold uppercase tracking-wide text-amber-700">{config.label}</p>
              ) : null}
              <h2 className="mt-1 text-2xl font-black text-slate-900">{config.title}</h2>
            </div>
            <Link href="/products" className="text-sm font-bold text-amber-700 hover:underline">
              مشاهده همه
            </Link>
          </div>
          <HomeProductCarousel products={products} design={config.design} />
        </Section>
      ))}
    </>
  );
}
