import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, Tag, UserRound } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { FpPageHero } from '@/components/feedar/ui/PageHero';
import { StoreSidebar } from '@/components/shop/store/StorePageHeader';
import { StoreBlogCompact } from '@/components/shop/store/StoreBlogCard';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';
import { mapProductListing } from '@/lib/shop/map-product-listing';
import { BlogCommentsSection } from '@/components/shop/BlogCommentsSection';
import { ProductMediaGallery } from '@/components/shop/ProductMediaGallery';
import { RichHtmlContent } from '@/components/shop/RichHtmlContent';
import { JsonLd } from '@/components/seo/JsonLd';
import { normalizeGalleryMedia } from '@/lib/media/gallery';
import { RtlForwardArrow } from '@/components/home/RtlForwardArrow';
import { buildDetailMetadata, notFoundMetadata } from '@/lib/seo/metadata';
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd, buildPageJsonLd } from '@/lib/seo/json-ld';
import { SITE_CONTENT_TEAM } from '@/lib/seo/resolve-og-image';
import { BlogPost, Product } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return withDatabase(async () => {
    const post: any = await BlogPost.findOne({ slug, isPublished: true }).lean();
    if (!post) return notFoundMetadata('مقاله یافت نشد');

    const title = post.seoMetaTitle?.trim() || post.title;
    const description =
      post.seoMetaDescription?.trim() ||
      post.excerpt?.trim() ||
      String(post.content || '').replace(/<[^>]+>/g, '').slice(0, 160);

    return buildDetailMetadata({
      title,
      description,
      canonicalPath: `/blog/${post.slug}`,
      ogType: 'article',
      image: post.coverImage
    });
  }, notFoundMetadata('مقاله یافت نشد'));
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post: any = await withDatabase(
    () => BlogPost.findOneAndUpdate({ slug, isPublished: true }, { $inc: { views: 1 } }, { new: true }).lean(),
    null
  );
  if (!post) notFound();

  const [sidePosts, relatedPosts, relatedProducts] = await withDatabase(
    () =>
      Promise.all([
        BlogPost.find({ isPublished: true, slug: { $ne: post.slug } }).sort({ publishedAt: -1 }).limit(8).lean(),
        BlogPost.find({ isPublished: true, _id: { $ne: post._id }, category: post.category }).sort({ publishedAt: -1 }).limit(3).lean(),
        post.relatedProductIds?.length
          ? Product.find({ _id: { $in: post.relatedProductIds }, isActive: true })
              .select('name slug price discountPrice images')
              .lean()
          : Promise.resolve([])
      ]),
    [[], [], []] as [unknown[], unknown[], unknown[]]
  );

  const media = normalizeGalleryMedia(post.media, post.coverImage ? [post.coverImage] : []);
  const jsonLd = buildPageJsonLd(
    buildBlogPostingJsonLd({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      seoMetaDescription: post.seoMetaDescription,
      coverImage: post.coverImage,
      publishedAt: post.publishedAt,
      updatedAt: post.updatedAt
    }),
    buildBreadcrumbJsonLd([
      { name: 'خانه', path: '/' },
      { name: 'بلاگ', path: '/blog' },
      { name: post.title }
    ])
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <FpPageHero
        kicker={post.category || 'مقاله'}
        title={post.title}
        breadcrumbs={[
          { label: 'خانه', href: '/' },
          { label: 'مقالات', href: '/blog' },
          { label: post.title }
        ]}
      />
      <Container className="py-10 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
          <StoreSidebar title="مقالات دیگر">
            {sidePosts.map((p: any) => (
              <StoreBlogCompact key={String(p._id)} slug={p.slug} title={p.title} coverImage={p.coverImage} />
            ))}
          </StoreSidebar>

          <div className="space-y-8">
            <article className="overflow-hidden rounded-2xl border border-surface-200 bg-surface-0">
              <div className="p-4 sm:p-6">
                <ProductMediaGallery media={media} name={post.title} />
              </div>
              <div className="p-6 sm:p-8 pt-0">
                <div className="flex flex-wrap gap-4 text-xs text-surface-500">
                  <span className="inline-flex items-center gap-1">
                    <UserRound className="h-3.5 w-3.5" />
                    {post.author || SITE_CONTENT_TEAM}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('fa-IR') : '-'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Tag className="h-3.5 w-3.5" />
                    {post.category || 'عمومی'}
                  </span>
                </div>
                {post.excerpt ? (
                  <p className="mt-6 rounded-xl bg-brand-50 p-4 text-sm leading-7 text-surface-700">{post.excerpt}</p>
                ) : null}
                <div className="mt-8">
                  <RichHtmlContent html={post.content} />
                </div>
              </div>
            </article>

            {relatedProducts.length ? (
              <section>
                <h3 className="text-xl font-black text-ink-900">محصولات مرتبط</h3>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  {(relatedProducts as Record<string, unknown>[]).map((p) => (
                    <FeedarProductCard key={String(p._id)} product={mapProductListing(p)} />
                  ))}
                </div>
              </section>
            ) : null}

            {relatedPosts.length ? (
              <section className="rounded-2xl border border-surface-200 bg-surface-0 p-6">
                <h3 className="font-bold text-surface-900">مقالات مرتبط</h3>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {relatedPosts.map((p: any) => (
                    <Link
                      key={String(p._id)}
                      href={`/blog/${p.slug}`}
                      className="group rounded-xl border border-surface-200 p-4 transition hover:shadow-soft"
                    >
                      <p className="line-clamp-3 text-sm font-semibold text-surface-900 group-hover:text-brand-700">
                        {p.title}
                      </p>
                      <span className="site-link mt-2 text-xs">
                        مطالعه
                        <RtlForwardArrow className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <BlogCommentsSection slug={post.slug} />
          </div>
        </div>
      </Container>
    </>
  );
}
