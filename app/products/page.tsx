import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpFilterSidebar } from '@/components/feedar/products/FilterSidebar';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { FpPagination } from '@/components/feedar/ui/Pagination';
import { buildQueryListMetadata } from '@/lib/seo/metadata';
import { queryPublicCatalog } from '@/lib/feedar/product-families';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return buildQueryListMetadata(
    'محصولات',
    `محصولات دارویی، گیاهی و مکمل ${FEEDAR_BRAND.nameFa}`,
    '/products',
    params
  );
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const q = String(params.q || '').trim();
  const category = String(params.category || '').trim();
  const line = String(params.line || '').trim();
  const sort = String(params.sort || 'newest');
  const page = Number(params.page || 1);

  const result = await queryPublicCatalog({ q, category, line, sort, page });

  const hrefForPage = (next: number) => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (category) sp.set('category', category);
    if (line) sp.set('line', line);
    if (sort) sp.set('sort', sort);
    if (next > 1) sp.set('page', String(next));
    const qs = sp.toString();
    return qs ? `/products?${qs}` : '/products';
  };

  return (
    <>
      <FpPageHero
        kicker="کاتالوگ"
        title="محصولات"
        description={`جستجو، فیلتر و مشاهده سبد محصولات ${FEEDAR_BRAND.nameFa}.`}
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'محصولات' }]}
      />
      <Container className="py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <FpFilterSidebar categories={result.categories} defaults={{ q, category, sort, line }} />
          </div>
          <section>
            <p className="mb-5 text-sm text-surface-500">{result.total.toLocaleString('fa-IR')} محصول</p>
            {result.products.length ? (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {result.products.map((p) => (
                    <FeedarProductCard key={p.id} product={p} categoryLabel={p.category} />
                  ))}
                </div>
                <FpPagination className="mt-10" page={result.page} pageCount={result.pageCount} hrefForPage={hrefForPage} />
              </>
            ) : (
              <FpEmptyState
                title="محصولی یافت نشد"
                description="عبارت جستجو یا فیلتر را تغییر دهید."
                actionHref="/products"
                actionLabel="پاک کردن فیلتر"
              />
            )}
          </section>
        </div>
      </Container>
    </>
  );
}
