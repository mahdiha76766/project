import { Container } from '@/components/ui/Container';
import { StorePageHeader } from '@/components/shop/store/StorePageHeader';
import { StoreProductCard } from '@/components/shop/store/StoreProductCard';
import { StoreFilters } from '@/components/shop/store/StoreFilters';
import { StoreEmpty } from '@/components/shop/store/StorePageHeader';
import { buildQueryListMetadata } from '@/lib/seo/metadata';
import { mapProductListing } from '@/lib/shop/map-product-listing';
import { Category, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import type { ShopProduct } from '@/types/shop';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return buildQueryListMetadata(
    'محصولات',
    'خرید روغن، ادویه و محصولات گیاهی — فروشگاه آنلاین ناب سرا',
    '/products',
    params
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = String(params.q || '').trim();
  const category = String(params.category || '').trim();
  const sort = String(params.sort || 'newest');

  const [items, categories] = await withDatabase(async () => {
    const filter: Record<string, unknown> = { isActive: true };
    if (category) {
      const foundCategory = await Category.findOne({ slug: category, isActive: true }).select('_id').lean() as { _id?: unknown } | null;
      filter.category = foundCategory?._id || null;
    }
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
        { fullDescription: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } }
      ];
    }

    const sortObj =
      sort === 'cheapest' ? { discountPrice: 1, price: 1 }
      : sort === 'expensive' ? { discountPrice: -1, price: -1 }
      : sort === 'best_selling' ? { isFeatured: -1, createdAt: -1 }
      : { createdAt: -1 };

    return Promise.all([
      Product.find(filter).sort(sortObj as any).populate('category', 'slug').lean(),
      Category.find({ isActive: true }).sort({ name: 1 }).select('slug name').lean()
    ]);
  }, [[], []] as [unknown[], unknown[]]);

  const products: ShopProduct[] = items.map((p: any) => mapProductListing(p, p.category?.slug || ''));

  return (
    <>
      <StorePageHeader
        label="فروشگاه"
        title="محصولات"
        description="روغن، ادویه و محصولات گیاهی با فیلتر و جستجو."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'محصولات' }]}
      />
      <Container className="py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <form action="/products" className="lg:sticky lg:top-24 lg:self-start">
            <StoreFilters
              categories={categories.map((c: any) => ({ slug: c.slug, name: c.name }))}
              defaults={{ q, category, sort }}
            />
          </form>
          <section>
            <p className="mb-5 text-sm text-surface-500">{products.length.toLocaleString('fa-IR')} محصول</p>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.length ? products.map((p) => <StoreProductCard key={p.id} product={p} />) : (
                <StoreEmpty message="محصولی یافت نشد." />
              )}
            </div>
          </section>
        </div>
      </Container>
    </>
  );
}
