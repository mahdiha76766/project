import { Section } from './Section';
import { SectionHeading } from './SectionHeading';
import { HomeProductCard } from './HomeProductCard';
import type { HomeProduct } from '@/lib/shop/home-types';

export function HomeProducts({ products }: { products: HomeProduct[] }) {
  if (!products.length) return null;

  return (
    <Section bg="muted">
      <SectionHeading label="منتخب فروشگاه" title="محصولات پرطرفدار" href="/products" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => (
          <HomeProductCard key={p.id} product={p} />
        ))}
      </div>
    </Section>
  );
}
