import { notFound } from 'next/navigation';
import { normalizeGalleryMedia } from '@/lib/media/gallery';
import { JsonLd } from '@/components/seo/JsonLd';
import { FeedarProductDetailView } from '@/components/feedar/products/ProductDetailView';
import { getProductVariants, serializeVariantsForClient } from '@/lib/product/variants';
import { buildDetailMetadata, notFoundMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbJsonLd, buildPageJsonLd, buildProductJsonLd } from '@/lib/seo/json-ld';
import { BlogPost, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';
import { getSalesConfig } from '@/lib/commerce/sales';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withDatabase(async () => {
    const product: any = await Product.findOne({ slug, isActive: true }).lean();
    if (!product) return notFoundMetadata('محصول یافت نشد');

    const title = product.seo?.title?.trim() || product.name;
    const description =
      product.seo?.description?.trim() ||
      product.shortDescription?.trim() ||
      product.name;

    return buildDetailMetadata({
      title,
      description,
      canonicalPath: `/products/${product.slug}`,
      image: product.images?.[0]
    });
  }, notFoundMetadata('محصول یافت نشد'));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product: any = await withDatabase(
    () => Product.findOne({ slug, isActive: true }).lean(),
    null
  );
  if (!product) notFound();

  const [relatedProducts, relatedPosts] = await withDatabase(
    () =>
      Promise.all([
        Product.find({
          isActive: true,
          _id: { $ne: product._id },
          $or: [{ category: product.category }, { tags: { $in: product.tags || [] } }]
        })
          .limit(4)
          .lean(),
        BlogPost.find({
          isPublished: true,
          relatedProductIds: product._id
        })
          .sort({ publishedAt: -1 })
          .limit(4)
          .select('slug title coverImage excerpt')
          .lean()
      ]),
    [[], []] as [unknown[], unknown[]]
  );

  const media = normalizeGalleryMedia(product.media, product.images);
  const hasDbVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const variants = hasDbVariants
    ? serializeVariantsForClient(product.variants)
    : serializeVariantsForClient(getProductVariants(product));

  const sales = await getSalesConfig();
  const jsonLd = buildPageJsonLd(
    buildProductJsonLd({
      name: product.name,
      slug: product.slug,
      shortDescription: product.shortDescription,
      seo: product.seo,
      images: product.images,
      sku: product.sku,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      variants: product.variants,
      updatedAt: product.updatedAt,
      includeOffers: sales.salesEnabled
    }),
    buildBreadcrumbJsonLd([
      { name: 'خانه', path: '/' },
      { name: 'محصولات', path: '/products' },
      { name: product.name }
    ])
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <FeedarProductDetailView
        product={product}
        media={media}
        variants={variants}
        hasDbVariants={hasDbVariants}
        relatedProducts={relatedProducts as Record<string, unknown>[]}
        relatedPosts={relatedPosts as Record<string, unknown>[]}
        salesEnabled={sales.salesEnabled}
      />
    </>
  );
}
