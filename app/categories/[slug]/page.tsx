import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { StorePageHeader, StoreEmpty } from '@/components/shop/store/StorePageHeader';
import { StoreProductCard } from '@/components/shop/store/StoreProductCard';
import { mapProductListing } from '@/lib/shop/map-product-listing';
import { Category, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import { buildDetailMetadata, notFoundMetadata } from '@/lib/seo/metadata';
import type { ShopProduct } from '@/types/shop';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withDatabase(async () => {
    const category: any = await Category.findOne({ slug, isActive: true }).lean();
    if (!category) return notFoundMetadata('دسته یافت نشد');
    return buildDetailMetadata({
      title: category.name,
      description: category.description?.trim() || `محصولات دسته ${category.name} در فروشگاه ناب سرا`,
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
      <StorePageHeader
        label="دسته"
        title={category.name}
        description={category.description}
        breadcrumbs={[
          { label: 'خانه', href: '/' },
          { label: 'دسته‌بندی‌ها', href: '/categories' },
          { label: category.name }
        ]}
      />
      <Container className="py-10 lg:py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.length ? products.map((p) => <StoreProductCard key={p.id} product={p} />) : (
            <StoreEmpty message="محصولی در این دسته نیست." />
          )}
        </div>
      </Container>
    </>
  );
}
