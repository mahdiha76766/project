import type { Metadata } from 'next';
import { AdvancedHeroSlider } from '@/components/home/AdvancedHeroSlider';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { CategoryShowcase } from '@/components/home/discovery/CategoryShowcase';
import { HomeMarketplaceExperience } from '@/components/home/discovery/HomeMarketplaceExperience';
import { HomePromo } from '@/components/home/HomePromo';
import { HomeAboutEditable, HomeFeaturesEditable, HomeProductSectionsEditable } from '@/components/home/HomeEditableSections';
import { HomeBlog } from '@/components/home/HomeBlog';
import { HomeKeywords } from '@/components/home/HomeKeywords';
import { HomeNewsletter } from '@/components/home/HomeNewsletter';
import { HomeDiscovery } from '@/components/home/HomeDiscovery';
import { HomePurchaseJourney } from '@/components/home/HomePurchaseJourney';
import { HomeReviews } from '@/components/home/HomeReviews';
import { HomeFaq } from '@/components/home/HomeFaq';
import { HomeJsonLd } from '@/components/seo/HomeJsonLd';
import { getHeroSliderConfig } from '@/lib/admin/slider-settings';
import { getSiteSeoSettings } from '@/lib/admin/site-settings';
import { getSitePageContent } from '@/lib/admin/page-content';
import { buildSiteMetadata } from '@/lib/seo/site-metadata';
import { resolveImage } from '@/lib/shop/resolve-image';
import { fetchProductsByHomeFilter } from '@/lib/shop/home-product-query';
import { mapHomeProduct } from '@/lib/shop/map-home-product';
import { buildHomeCategoryShelves } from '@/lib/shop/category-shelves';
import { withAvailableProducts } from '@/lib/shop/available-products';
import { Banner, BlogPost, Category, Product, Review } from '@/models';
import { withDatabase } from '@/lib/db/safe-query';

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoSettings();
  return buildSiteMetadata(seo, {
    alternates: { canonical: '/' },
    openGraph: { url: seo.canonicalBaseUrl }
  });
}

export default async function Home() {
  const [heroConfig, seo, pageContent] = await Promise.all([
    getHeroSliderConfig(),
    getSiteSeoSettings(),
    getSitePageContent()
  ]);

  const sectionsConfig = pageContent.home.productSections.filter((s) => s.enabled);

  const [data, overview, categoryShelves] = await Promise.all([
    withDatabase(
      () =>
        Promise.all([
          Banner.find({ isActive: true, position: 'home' }).sort({ createdAt: -1 }).limit(2).lean(),
          ...sectionsConfig.map((sec) => fetchProductsByHomeFilter(sec.filterType, sec.limit)),
          Category.find({ isActive: true }).sort({ createdAt: -1 }).limit(8).lean(),
          BlogPost.find({ isPublished: true }).sort({ publishedAt: -1, createdAt: -1 }).limit(6).lean()
        ]),
      [[], ...sectionsConfig.map(() => []), [], []] as unknown[][]
    ),
    withDatabase(
      async () => {
        const [reviews, productCount, categoryCount, counts] = await Promise.all([
          Review.find({ status: 'APPROVED', isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(3)
            .select('userName rating title comment productId')
            .populate('productId', 'name slug')
            .lean(),
          Product.countDocuments(withAvailableProducts()),
          Category.countDocuments({ isActive: true }),
          Product.aggregate([
            { $match: withAvailableProducts({ category: { $ne: null } }) },
            { $group: { _id: '$category', count: { $sum: 1 } } }
          ])
        ]);
        return {
          reviews,
          productCount,
          categoryCount,
          counts: counts as Array<{ _id: unknown; count: number }>
        };
      },
      { reviews: [], productCount: 0, categoryCount: 0, counts: [] as Array<{ _id: unknown; count: number }> }
    ),
    withDatabase(() => buildHomeCategoryShelves({ maxCategories: 5, productsPerShelf: 8 }), [])
  ]);

  const homeBanners = data[0] as Record<string, unknown>[];
  const sectionRaw = sectionsConfig.map((_, i) => (data[i + 1] as Record<string, unknown>[]) || []);
  const categories = (data[data.length - 2] as Record<string, unknown>[]) || [];
  const blogPosts = (data[data.length - 1] as Record<string, unknown>[]) || [];
  const categoryCounts = new Map(
    (overview.counts || []).map((row) => [String(row._id), Number(row.count || 0)])
  );

  const productSections = sectionsConfig.map((config, i) => ({
    config,
    products: sectionRaw[i].map(mapHomeProduct)
  }));

  const categoryItems = categories.map((cat) => ({
    id: String(cat._id),
    name: String(cat.name),
    slug: String(cat.slug),
    description: String(cat.description || ''),
    image: resolveImage(cat.image as string | undefined),
    productCount: categoryCounts.get(String(cat._id)) || 0
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

  const reviews = (overview.reviews as Record<string, unknown>[]).map((review) => {
    const product = review.productId as { name?: string; slug?: string } | undefined;
    return {
      id: String(review._id),
      userName: String(review.userName || ''),
      title: String(review.title || ''),
      comment: String(review.comment || ''),
      rating: Number(review.rating || 5),
      productName: product?.name,
      productSlug: product?.slug
    };
  });

  return (
    <>
      <HomeJsonLd seo={seo} />
      <AdvancedHeroSlider slides={heroConfig.slides} autoplayInterval={heroConfig.autoplayInterval} />
      <HomeTrustBar />
      <HomeKeywords keywords={seo.keywords} />
      <HomeDiscovery />
      <CategoryShowcase categories={categoryItems} />
      <HomeProductSectionsEditable />
      <HomeMarketplaceExperience sections={productSections} shelves={categoryShelves} />
      {banners.length > 0 ? <HomePromo banners={banners} /> : null}
      <HomePurchaseJourney productCount={overview.productCount} categoryCount={overview.categoryCount} />
      <HomeAboutEditable />
      <HomeFeaturesEditable />
      <HomeReviews reviews={reviews} />
      {posts.length > 0 ? <HomeBlog posts={posts} /> : null}
      <HomeFaq />
      <HomeNewsletter />
    </>
  );
}
