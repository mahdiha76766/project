import type { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpSearchInput } from '@/components/feedar/ui/SearchInput';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';
import { FpArticleCard } from '@/components/feedar/ui/ArticleCard';
import { FpCategoryCard } from '@/components/feedar/ui/CategoryCard';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { searchPublicSite } from '@/lib/feedar/search';
import { buildPublicMetadata } from '@/lib/seo/metadata';
import { resolveImage } from '@/lib/shop/resolve-image';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';

export async function generateMetadata({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = String(params.q || '').trim();
  return buildPublicMetadata({
    title: q ? `جستجو: ${q}` : 'جستجو',
    description: `جستجو در محصولات، مقالات و دسته‌بندی‌های ${FEEDAR_BRAND.nameFa}`,
    canonicalPath: q ? `/search?q=${encodeURIComponent(q)}` : '/search'
  });
}

export default async function SearchPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const q = String(params.q || '').trim();
  const result = q ? await searchPublicSite(q) : { products: [], articles: [], categories: [] };
  const empty = q.length >= 2 && !result.products.length && !result.articles.length && !result.categories.length;

  return (
    <>
      <FpPageHero
        kicker="جستجو"
        title={q ? `نتایج «${q}»` : 'جستجو در سایت'}
        description="محصولات، مقالات و دسته‌بندی‌ها را در یک مکان جستجو کنید."
        breadcrumbs={[{ label: 'خانه', href: '/' }, { label: 'جستجو' }]}
      />
      <Container className="space-y-10 py-10 lg:py-12">
        <FpSearchInput defaultValue={q} />
        {!q ? (
          <FpEmptyState title="عبارت جستجو را وارد کنید" description="حداقل دو حرف بنویسید تا نتایج نمایش داده شود." />
        ) : empty ? (
          <FpEmptyState title="نتیجه‌ای پیدا نشد" description="عبارت دیگری را امتحان کنید." actionHref="/products" actionLabel="مشاهده محصولات" />
        ) : (
          <>
            {result.products.length ? (
              <section>
                <h2 className="text-xl font-bold">محصولات</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {result.products.map((product) => (
                    <FeedarProductCard key={product.id} product={product} categoryLabel={product.category} />
                  ))}
                </div>
              </section>
            ) : null}
            {result.articles.length ? (
              <section>
                <h2 className="text-xl font-bold">مقالات</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {result.articles.map((post) => (
                    <FpArticleCard key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            ) : null}
            {result.categories.length ? (
              <section>
                <h2 className="text-xl font-bold">دسته‌بندی‌ها</h2>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {result.categories.map((cat) => (
                    <FpCategoryCard
                      key={cat.slug}
                      href={`/categories/${cat.slug}`}
                      title={cat.name}
                      description={cat.description}
                      image={resolveImage(cat.image)}
                    />
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}
      </Container>
    </>
  );
}
