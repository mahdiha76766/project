import type { Metadata } from 'next';
import { AdvancedHeroSlider } from '@/components/home/AdvancedHeroSlider';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { HomeCategories } from '@/components/home/HomeCategories';
import { HomeProductSectionsClient } from '@/components/home/HomeProductSectionsClient';
import { HomePromo } from '@/components/home/HomePromo';
import { HomeAboutEditable, HomeFeaturesEditable, HomeProductSectionsEditable } from '@/components/home/HomeEditableSections';
import { HomeBlog } from '@/components/home/HomeBlog';
import { HomeKeywords } from '@/components/home/HomeKeywords';
import { HomeNewsletter } from '@/components/home/HomeNewsletter';
import { HomeJsonLd } from '@/components/seo/HomeJsonLd';
import { getHeroSliderConfig } from '@/lib/admin/slider-settings';
import { getSiteSeoSettings } from '@/lib/admin/site-settings';
import { getSitePageContent } from '@/lib/admin/page-content';
import { buildSiteMetadata } from '@/lib/seo/site-metadata';
import { getProductMinPrice, getProductVariants, hasVariants, serializeVariantsForClient } from '@/lib/product/variants';
import { getProductDiscountInfo } from '@/lib/product/discount';
import { resolveImage } from '@/lib/shop/resolve-image';
import { fetchProductsByHomeFilter } from '@/lib/shop/home-product-query';
import { Banner, BlogPost, Category } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  return buildSiteMetadata(seo, {
    alternates: { canonical: '/' },
    openGraph: { url: seo.canonicalBaseUrl }
  });
}

function mapProduct(p: Record<string, unknown>) {
  const variantRows = serializeVariantsForClient(getProductVariants(p as never));
  const multi = hasVariants(p as never);
  const defaultVariant = variantRows.find((v) => v.isDefault) || variantRows[0];
  const images = p.images as string[] | undefined;
  const discount = getProductDiscountInfo(p as never);
  return {
    id: String(p._id),
    slug: String(p.slug),
    name: String(p.name),
    shortDescription: String(p.shortDescription || ''),
    images: images?.length ? images.map((img) => resolveImage(img)) : [resolveImage(undefined)],
    price: Number(p.price || 0),
    discountPrice: typeof p.discountPrice === 'number' ? p.discountPrice : undefined,
    bestSeller: Boolean(p.isFeatured),
    hasVariants: multi,
    minPrice: multi ? getProductMinPrice(p as never) : undefined,
    defaultVariantId: defaultVariant?.id,
    variants: variantRows,
    discountLabel: discount.hasDiscount ? discount.label : undefined
  };
}

export default async function Home() {
  const [heroConfig, seo, pageContent] = await Promise.all([
    getHeroSliderConfig(),
    getSiteSeoSettings(),
    getSitePageContent()
  ]);

  const sectionsConfig = pageContent.home.productSections.filter((s) => s.enabled);

  const data = await withDatabase(
    () =>
      Promise.all([
        Banner.find({ isActive: true, position: 'home' }).sort({ createdAt: -1 }).limit(2).lean(),
        ...sectionsConfig.map((sec) => fetchProductsByHomeFilter(sec.filterType, sec.limit)),
        Category.find({ isActive: true }).sort({ createdAt: -1 }).limit(6).lean(),
        BlogPost.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).limit(6).lean()
      ]),
    [[], ...sectionsConfig.map(() => []), [], []] as unknown[][]
  );

  const homeBanners = data[0] as Record<string, unknown>[];
  const sectionRaw = sectionsConfig.map((_, i) => (data[i + 1] as Record<string, unknown>[]) || []);
  const categories = (data[data.length - 2] as Record<string, unknown>[]) || [];
  const blogPosts = (data[data.length - 1] as Record<string, unknown>[]) || [];

  const productSections = sectionsConfig.map((config, i) => ({
    config,
    products: sectionRaw[i].map(mapProduct)
  }));

  const categoryItems = categories.map((cat) => ({
    id: String(cat._id),
    name: String(cat.name),
    slug: String(cat.slug),
    description: String(cat.description || ''),
    image: resolveImage(cat.image as string | undefined)
  }));

  const banners = homeBanners.map((b) => ({
    id: String(b._id),
    title: String(b.title || ''),
    image: String(b.image || ''),
    link: String(b.link || '')
  }));

  const posts = blogPosts.map((p) => ({
    id: String(p._id),
    slug: String(p.slug),
    title: String(p.title),
    excerpt: String(p.excerpt || String(p.content || '').slice(0, 120)),
    coverImage: p.coverImage as string | undefined,
    category: String(p.category || ''),
    views: Number(p.views || 0)
  }));

  return (
    <>
      <HomeJsonLd seo={seo} />
      <AdvancedHeroSlider slides={heroConfig.slides} autoplayInterval={heroConfig.autoplayInterval} />
      <HomeTrustBar />
      <HomeKeywords keywords={seo.keywords} />
      <HomeCategories categories={categoryItems} />
      <HomeProductSectionsEditable />
      <HomeProductSectionsClient sections={productSections} />
      {banners.length > 0 ? <HomePromo banners={banners} /> : null}
      <HomeAboutEditable />
      <HomeFeaturesEditable />
      {posts.length > 0 ? <HomeBlog posts={posts} /> : null}
      <HomeNewsletter />
    </>
  );
}
