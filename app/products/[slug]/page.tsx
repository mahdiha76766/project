import { notFound } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { ProductPageHero } from '@/components/shop/ProductPageHero';
import { StoreSidebar } from '@/components/shop/store/StorePageHeader';
import { normalizeGalleryMedia } from '@/lib/media/gallery';
import { StoreProductCompact, StoreRelatedProducts } from '@/components/shop/store/StoreProductCard';
import { ProductReviewsSection } from '@/components/shop/ProductReviewsSection';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { getProductVariants, serializeVariantsForClient } from '@/lib/product/variants';
import { Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withDatabase(async () => {
    const product: any = await Product.findOne({ slug, isActive: true }).lean();
    if (!product) return { title: 'محصول یافت نشد' };
    return {
      title: product.seo?.title || `${product.name} | نابسرا`,
      description: product.seo?.description || product.shortDescription,
      alternates: { canonical: `/products/${product.slug}` }
    };
  }, { title: 'محصول یافت نشد' });
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product: any = await withDatabase(
    () => Product.findOne({ slug, isActive: true }).lean(),
    null
  );
  if (!product) notFound();

  const [sideProducts, relatedProducts] = await withDatabase(
    () =>
      Promise.all([
        Product.find({
          isActive: true,
          category: product.category,
          slug: { $ne: product.slug }
        })
          .sort({ isFeatured: -1, createdAt: -1 })
          .limit(8)
          .lean(),
        Product.find({
          isActive: true,
          _id: { $ne: product._id },
          $or: [{ category: product.category }, { tags: { $in: product.tags || [] } }]
        })
          .limit(4)
          .lean()
      ]),
    [[], []] as [unknown[], unknown[]]
  );

  const media = normalizeGalleryMedia(product.media, product.images);
  const hasDbVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const variants = hasDbVariants
    ? serializeVariantsForClient(product.variants)
    : serializeVariantsForClient(getProductVariants(product));

  return (
    <>
      <ProductPageHero
        title={product.name}
        badge={product.isFeatured ? 'پرفروش' : undefined}
        breadcrumbs={[
          { label: 'خانه', href: '/' },
          { label: 'محصولات', href: '/products' },
          { label: product.name }
        ]}
      />
      <Container className="py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <StoreSidebar title="محصولات هم‌دسته">
            {sideProducts.length ? (
              sideProducts.map((p: any) => (
                <StoreProductCompact
                  key={String(p._id)}
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  discountPrice={p.discountPrice}
                  image={p.images?.[0]}
                />
              ))
            ) : (
              <p className="px-2 text-xs text-surface-500">محصول دیگری در این دسته نیست.</p>
            )}
          </StoreSidebar>

          <div className="space-y-8">
            <article className="overflow-hidden rounded-2xl border border-surface-200 bg-surface-0">
              <ProductDetailClient
                productId={String(product._id)}
                productName={product.name}
                media={media}
                shortDescription={product.shortDescription}
                tags={product.tags}
                variants={variants}
                productBase={{
                  usageType: product.usageType,
                  weight: product.weight,
                  weightUnit: product.weightUnit,
                  containerSize: product.containerSize,
                  attributes: product.attributes || {}
                }}
                fullDescription={product.fullDescription}
                isFeatured={product.isFeatured}
                enableVariantPicker={hasDbVariants}
              />
            </article>
            {relatedProducts.length ? (
              <StoreRelatedProducts
                title="مرتبط"
                products={relatedProducts as unknown as Parameters<typeof StoreRelatedProducts>[0]['products']}
              />
            ) : null}
            <ProductReviewsSection slug={product.slug} />
          </div>
        </div>
      </Container>
    </>
  );
}
