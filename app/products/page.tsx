import { Filters } from '@/components/shop/Filters';
import { ProductCard } from '@/components/shop/ProductCard';
import { filterProducts } from '@/lib/filters/products';
import { products } from '@/lib/data/shop-data';
import { buildMetadata } from '@/lib/seo/metadata';

export const metadata = buildMetadata('محصولات فروشگاه', 'لیست محصولات روغن، ادویه و عصاری با فیلتر و جستجو');

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const filtered = filterProducts(products, {
    q: params.q,
    category: params.category,
    sort: (params.sort as 'newest' | 'best_selling' | 'cheapest' | 'expensive') ?? 'newest'
  });

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-[280px_1fr]">
      <form><Filters /></form>
      <section>
        <h1 className="mb-4 text-2xl font-black text-amber-900">محصولات</h1>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>
    </main>
  );
}
