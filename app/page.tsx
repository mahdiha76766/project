import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { HomeJsonLd } from '@/components/seo/HomeJsonLd';
import { FeedarHomeHero } from '@/components/feedar/home/HomeHero';
import { FeedarHomeServices } from '@/components/feedar/home/HomeServices';
import { FeedarHomeWhy } from '@/components/feedar/home/HomeWhy';
import { FeedarHomeFamilies } from '@/components/feedar/home/HomeFamilies';
import { FeedarHomeResearch } from '@/components/feedar/home/HomeResearch';
import { FeedarHomeArticles } from '@/components/feedar/home/HomeArticles';
import { FeedarHomePartners } from '@/components/feedar/home/HomePartners';
import { FeedarHomeCta } from '@/components/feedar/home/HomeCta';
import { FeedarProductCard } from '@/components/feedar/products/ProductCard';
import { FpEmptyState } from '@/components/feedar/ui/EmptyState';
import { FpSectionHeader } from '@/components/feedar/ui/PulseTitle';
import { FEEDAR_BRAND } from '@/lib/brand/feedar';
import { getSiteSeoSettings } from '@/lib/admin/site-settings';
import { getSitePageContent } from '@/lib/admin/page-content';
import { fetchFeaturedStoreProducts } from '@/lib/feedar/product-families';
import { stripHtml } from '@/lib/feedar/content';
import { buildSiteMetadata } from '@/lib/seo/site-metadata';
import { withDatabase } from '@/lib/db/safe-query';
import { resolveImage } from '@/lib/shop/resolve-image';
import { BlogPost, Category } from '@/models';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  return buildSiteMetadata(seo, {
    alternates: { canonical: '/' },
    openGraph: { url: seo.canonicalBaseUrl }
  });
}

export default async function Home() {
  const [seo, pageContent, products] = await Promise.all([
    getSiteSeoSettings(),
    getSitePageContent(),
    fetchFeaturedStoreProducts(6)
  ]);

  const [blogPosts, categories] = await Promise.all([
    withDatabase(
      () => BlogPost.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).limit(3).lean(),
      [] as Record<string, unknown>[]
    ),
    withDatabase(
      () => Category.find({ isActive: true }).sort({ createdAt: -1 }).limit(4).lean(),
      [] as Record<string, unknown>[]
    )
  ]);

  const posts = blogPosts.map((p) => ({
    slug: String(p.slug),
    title: String(p.title),
    excerpt: String(p.excerpt || String(p.content || '').replace(/<[^>]+>/g, '').slice(0, 120)),
    coverImage: p.coverImage as string | undefined,
    category: String(p.category || ''),
    dateLabel: p.publishedAt ? new Date(String(p.publishedAt)).toLocaleDateString('fa-IR') : undefined
  }));

  const categoryItems = categories.map((cat) => ({
    slug: String(cat.slug),
    name: String(cat.name),
    description: String(cat.description || ''),
    image: resolveImage(cat.image as string | undefined)
  }));

  return (
    <>
      <HomeJsonLd seo={seo} />
      <FeedarHomeHero home={pageContent.home} />
      <FeedarHomeServices home={pageContent.home} />
      <FeedarHomeWhy
        title={pageContent.home.featuresTitle}
        description={stripHtml(pageContent.home.featuresHtml)}
        image={pageContent.home.aboutImage}
      />
      <FeedarHomeFamilies categories={categoryItems} />

      <section className="ph-section bg-paper-50">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <FpSectionHeader title="محصولات منتخب" description={`نمایی از سبد محصولات ${FEEDAR_BRAND.nameFa}.`} />
            <Link href="/products" className="fp-btn-outline !py-2 text-sm">
              همه محصولات
            </Link>
          </div>
          {products.length ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <FeedarProductCard key={product.id} product={product} categoryLabel={product.category} />
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <FpEmptyState title="محصولی برای نمایش نیست" description="پس از ثبت محصولات در پنل مدیریت، این بخش تکمیل می‌شود." actionHref="/contact" actionLabel="تماس با ما" />
            </div>
          )}
        </Container>
      </section>

      <FeedarHomeResearch
        title={pageContent.home.researchTitle}
        description={stripHtml(pageContent.home.researchHtml)}
        image={pageContent.home.researchImage}
      />
      <FeedarHomeArticles posts={posts} />
      <FeedarHomePartners title={pageContent.home.partnersTitle} partnersText={pageContent.home.partnersText} />
      <FeedarHomeCta title={pageContent.home.ctaTitle} description={stripHtml(pageContent.home.ctaHtml)} />
    </>
  );
}
