import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { mapProductListing } from '@/lib/shop/map-product-listing';
import { Category, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import { buildDetailMetadata, notFoundMetadata } from '@/lib/seo/metadata';
import { SITE_BRAND_NAME } from '@/lib/seo/resolve-og-image';
import type { ShopProduct } from '@/types/shop';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withDatabase(async () => {
    const category: any = await Category.findOne({ slug, isActive: true }).lean();
    if (!category) return notFoundMetadata('دسته یافت نشد');
    const title = category.seoTitle?.trim() || category.name;
    const description =
      category.seoDescription?.trim() ||
      category.description?.trim() ||
      `محصولات دسته ${category.name} در ${SITE_BRAND_NAME}`;
    return buildDetailMetadata({
      title,
      description,
      canonicalPath: `/categories/${category.slug}`,
      image: category.image
    });
  }, notFoundMetadata('دسته یافت نشد'));
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category: any = await withDatabase(
    () => Category.findOne({ slug, isActive: true }).lean(),
    null
  );
  if (!category) notFound();

  const items = await withDatabase(
    () => Product.find({ isActive: true, category: category._id }).sort({ isFeatured: -1, createdAt: -1 }).lean(),
    []
  );
  const products: ShopProduct[] = items.map((p: any) => mapProductListing(p, slug));

  return (
    <>
      <FpPageHero
        kicker="خط محصول"
        title={category.name}
        description={category.description}
        breadcrumbs={[
          { label: 'خانه', href: '/' },
          { label: 'دسته‌بندی‌ها', href: '/categories' },
          { label: category.name }
        ]}
      />
      <Container className="py-12 lg:py-16">
        {products.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <FeedarProductCard key={p.id} product={p} categoryLabel={category.name} />
            ))}
          </div>
        ) : (
          <FpEmptyState title="محصولی در این دسته نیست." description="به‌زودی محصولات این خط به کاتالوگ اضافه می‌شود." actionHref="/products" actionLabel="همه محصولات" />
        )}
      </Container>
    </>
  );
}
