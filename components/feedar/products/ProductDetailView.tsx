import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { FpBadge } from '@/components/feedar/ui/Badge';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';
import { FpArticleCard } from '@/components/feedar/ui/ArticleCard';
import { ProductPurchasePanel } from '@/components/shop/ProductPurchasePanel';
import { ProductReviewsSection } from '@/components/shop/ProductReviewsSection';
import { mapProductListing } from '@/lib/shop/map-product-listing';
import { getProductSpecEntries, PRODUCT_LINE_LABELS } from '@/lib/product/specs';
import { RichHtmlContent } from '@/components/shop/RichHtmlContent';
import type { GalleryMediaItem } from '@/lib/media/gallery';

export function FeedarProductDetailView({
  product,
  media,
  variants,
  hasDbVariants,
  relatedProducts,
  relatedPosts,
  salesEnabled
}: {
  product: Record<string, unknown>;
  media: GalleryMediaItem[];
  variants: ReturnType<typeof import('@/lib/product/variants').serializeVariantsForClient>;
  hasDbVariants: boolean;
  relatedProducts: Record<string, unknown>[];
  relatedPosts: Record<string, unknown>[];
  salesEnabled: boolean;
}) {
  const specs = getProductSpecEntries({
    weight: product.weight as number | undefined,
    weightUnit: product.weightUnit as string | undefined,
    containerSize: String(product.containerSize || ''),
    usageType: String(product.usageType || ''),
    attributes: (product.attributes as Record<string, string>) || {}
  });
  const line = product.productLine ? PRODUCT_LINE_LABELS[String(product.productLine)] : '';
  const images = media.filter((m) => m.type === 'image');
  const brochure = String(product.attributes && (product.attributes as Record<string, string>).brochure || '');

  return (
    <>
      <FpPageHero
        kicker={line || 'کاتالوگ علمی'}
        title={String(product.name)}
        description={String(product.shortDescription || '')}
        breadcrumbs={[
          { label: 'خانه', href: '/' },
          { label: 'محصولات', href: '/products' },
          { label: String(product.name) }
        ]}
      />
      <Container className="space-y-12 py-12 lg:py-16">
        <div className="grid items-start gap-10 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="relative mx-auto aspect-square max-w-lg overflow-hidden rounded-full border-[10px] border-paper-50 shadow-card">
              <img src={images[0]?.url} alt={String(product.name)} className="h-full w-full object-cover" />
            </div>
            {images.length > 1 ? (
              <div className="mt-6 flex justify-center gap-3">
                {images.slice(1, 5).map((img) => (
                  <img key={img.url} src={img.url} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-paper-200" />
                ))}
              </div>
            ) : null}
          </div>
          <div className="space-y-5 lg:col-span-6">
            <div className="flex flex-wrap gap-2">
              {line ? <FpBadge>{line}</FpBadge> : null}
              {product.containerSize ? <FpBadge tone="neutral">{String(product.containerSize)}</FpBadge> : null}
            </div>
            <h2 className="text-2xl font-black text-ink-900">مشخصات علمی محصول</h2>
            <p className="text-base leading-9 text-surface-500">{String(product.shortDescription || '')}</p>
            {specs.length ? (
              <dl className="divide-y divide-paper-200 rounded-[1.5rem] border border-paper-200 bg-paper-50">
                {specs.map((item) => (
                  <div key={item.label} className="flex items-start justify-between gap-4 px-5 py-3.5 text-sm">
                    <dt className="text-surface-500">{item.label}</dt>
                    <dd className="font-semibold text-ink-900">{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {!salesEnabled && variants.length > 1 ? (
              <div>
                <p className="mb-2 text-xs font-bold text-surface-500">اشکال و انواع دارویی</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((variant) => (
                    <span key={variant.id} className="rounded-full border border-paper-200 px-4 py-2 text-sm text-ink-800">
                      {variant.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            {salesEnabled ? (
              <div className="rounded-[1.5rem] border border-paper-200 bg-paper-50 p-5">
                <ProductPurchasePanel
                  productId={String(product._id)}
                  productName={String(product.name)}
                  tags={(product.tags as string[]) || []}
                  variants={variants}
                  enableVariantPicker={hasDbVariants}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                <Link href="/downloads" className="ph-btn-primary">
                  بروشور و کاتالوگ
                </Link>
                <Link href="/contact" className="ph-btn-outline">
                  درخواست اطلاعات علمی
                </Link>
              </div>
            )}
            {salesEnabled ? (
              <Link href="/downloads" className="ph-btn-outline inline-flex">
                بروشور و کاتالوگ
              </Link>
            ) : null}
            {brochure ? (
              <a href={brochure} className="site-link" target="_blank" rel="noreferrer">
                دانلود بروشور این محصول
              </a>
            ) : null}
          </div>
        </div>

        {product.fullDescription ? (
          <article className="rounded-[1.75rem] border border-paper-200 bg-paper-50 p-6 sm:p-10">
            <h2 className="text-xl font-black">توضیحات، کاربرد و ترکیبات</h2>
            <div className="mt-4">
              <RichHtmlContent html={String(product.fullDescription)} />
            </div>
          </article>
        ) : null}

        {relatedProducts.length ? (
          <section>
            <h2 className="text-2xl font-black">محصولات مرتبط</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {relatedProducts.map((p) => (
                <FeedarProductCard key={String(p._id)} product={mapProductListing(p, (p.category as { slug?: string } | undefined)?.slug || '')} />
              ))}
            </div>
          </section>
        ) : null}

        {relatedPosts.length ? (
          <section>
            <h2 className="text-2xl font-black">مقالات مرتبط</h2>
            <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {relatedPosts.map((p) => (
                <FpArticleCard
                  key={String(p._id)}
                  post={{
                    slug: String(p.slug),
                    title: String(p.title),
                    excerpt: String(p.excerpt || ''),
                    coverImage: p.coverImage as string | undefined
                  }}
                />
              ))}
            </div>
          </section>
        ) : null}

        <ProductReviewsSection slug={String(product.slug)} />
      </Container>
    </>
  );
}
